using Chambered.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OData.Deltas;
using Microsoft.AspNetCore.OData.Query;
using Microsoft.AspNetCore.OData.Routing.Controllers;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;

namespace Chambered.Api.Controllers;

/// <summary>
/// A highly reusable, generic OData base controller that implements standard, type-safe CRUD operations using OData routing conventions.
/// </summary>
/// <typeparam name="TEntity">The target entity database model class.</typeparam>
/// <typeparam name="TKey">The primary key type of the target entity.</typeparam>
[Produces("application/json")]
public abstract class ODataControllerBase<TEntity, TKey>(ChamberedDbContext db) : ODataController
    where TEntity : class
{
    protected readonly ChamberedDbContext _db = db;

    /// <summary>
    /// Retrieves a queryable collection of entities.
    /// </summary>
    /// <remarks>
    /// Supports standard OData query operators:
    /// * **$select** (choose specific properties)
    /// * **$filter** (apply complex criteria, e.g. `price lt 1000`)
    /// * **$expand** (load related navigation properties, e.g. `manufacturer`)
    /// * **$orderby** (sort results)
    /// * **$top** and **$skip** (pagination)
    /// </remarks>
    /// <returns>A list of entities matching the query.</returns>
    /// <response code="200">Returns the queryable list of matching entities.</response>
    /// <response code="401">If the request is unauthorized.</response>
    [EnableQuery(MaxExpansionDepth = 3, MaxTop = 100)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public virtual IQueryable<TEntity> Get()
    {
        return _db.Set<TEntity>();
    }

    /// <summary>
    /// Retrieves a single entity by its unique primary key.
    /// </summary>
    /// <param name="key">The unique identifier of the entity.</param>
    /// <returns>The requested entity details.</returns>
    /// <response code="200">Returns the requested entity.</response>
    /// * **$select** (choose specific properties)
    /// * **$expand** (load related navigation properties, e.g. `manufacturer`)
    /// <response code="401">If the request is unauthorized.</response>
    /// <response code="404">If no entity matches the provided identifier.</response>
    [EnableQuery]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public virtual async Task<ActionResult<TEntity>> Get([FromRoute] TKey key)
    {
        var entity = await _db.Set<TEntity>().FindAsync(key);
        if (entity == null) return NotFound();
        return Ok(entity);
    }

    /// <summary>
    /// Creates and registers a new entity.
    /// </summary>
    /// <param name="entity">The entity data structure to write.</param>
    /// <returns>The newly created entity containing its system-generated ID.</returns>
    /// <response code="201">The entity was successfully created.</response>
    /// <response code="400">If the payload schema validation fails.</response>
    /// <response code="401">If the request is unauthorized.</response>
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public virtual async Task<ActionResult<TEntity>> Post([FromBody] TEntity entity)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        _db.Set<TEntity>().Add(entity);
        await _db.SaveChangesAsync();

        return Created(entity);
    }

    /// <summary>
    /// Replaces all properties of an existing entity (Full Replace).
    /// </summary>
    /// <param name="key">The unique identifier of the entity to replace.</param>
    /// <param name="update">The complete replaced entity body.</param>
    /// <returns>The updated entity details.</returns>
    /// <response code="204">The entity was successfully replaced.</response>
    /// <response code="400">If the replacement data fails model validation.</response>
    /// <response code="401">If the request is unauthorized.</response>
    /// <response code="404">If no entity matches the specified ID.</response>
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public virtual async Task<IActionResult> Put([FromRoute] TKey key, [FromBody] TEntity update)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var existing = await _db.Set<TEntity>().FindAsync(key);
        if (existing == null) return NotFound();

        _db.Entry(existing).CurrentValues.SetValues(update);

        // Reset read-only after save properties (such as the discriminator "ItemType") to prevent EF Core from throwing
        foreach (var property in _db.Entry(existing).Properties)
        {
            var behavior = property.Metadata.GetAfterSaveBehavior();
            if (behavior != Microsoft.EntityFrameworkCore.Metadata.PropertySaveBehavior.Save || property.Metadata.Name == "ItemType")
            {
                property.CurrentValue = property.OriginalValue;
                property.IsModified = false;
            }
        }

        await UpdateRelationsAsync(existing, update);

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!await EntityExists(key)) return NotFound();
            throw;
        }

        return Updated(existing);
    }

    /// <summary>
    /// Generically synchronizes the navigation collection and reference properties of an existing tracked entity with an incoming updated entity state.
    /// </summary>
    /// <param name="existing">The database-tracked entity instance containing loaded relations.</param>
    /// <param name="update">The detached entity payload containing updated values and relationships.</param>
    /// <returns>A asynchronous task tracking the update operation.</returns>
    protected virtual async Task UpdateRelationsAsync(TEntity existing, TEntity update)
    {
        var entry = _db.Entry(existing);
        var updateEntry = _db.Entry(update);

        foreach (var collectionEntry in entry.Collections)
        {
            if (!collectionEntry.IsLoaded)
            {
                await collectionEntry.LoadAsync();
            }

            var incomingCollectionEntry = updateEntry.Collections
                .FirstOrDefault(w => w.Metadata.Name == collectionEntry.Metadata.Name);

            if (incomingCollectionEntry != null)
            {
                var currentItems = collectionEntry.CurrentValue as System.Collections.IEnumerable ?? Enumerable.Empty<object>();
                var incomingItems = incomingCollectionEntry.CurrentValue as System.Collections.IEnumerable ?? Enumerable.Empty<object>();

                var targetEntityType = collectionEntry.Metadata.TargetEntityType;
                var primaryKey = targetEntityType.FindPrimaryKey();

                if (primaryKey != null)
                {
                    var keyPropertyName = primaryKey.Properties[0].Name;

                    var currentKeys = new System.Collections.Generic.HashSet<object>();
                    foreach (var x in currentItems)
                    {
                        var val = _db.Entry(x).Property(keyPropertyName).CurrentValue;
                        if (val != null)
                        {
                            currentKeys.Add(val);
                        }
                    }

                    var incomingKeys = new System.Collections.Generic.HashSet<object>();
                    var incomingItemsList = new System.Collections.Generic.List<object>();
                    foreach (var x in incomingItems)
                    {
                        var val = _db.Entry(x).Property(keyPropertyName).CurrentValue;
                        if (val != null)
                        {
                            incomingKeys.Add(val);
                            incomingItemsList.Add(x);
                        }
                    }

                    var toRemove = new System.Collections.Generic.List<object>();
                    foreach (var x in currentItems)
                    {
                        var val = _db.Entry(x).Property(keyPropertyName).CurrentValue;
                        if (val != null && !incomingKeys.Contains(val))
                        {
                            toRemove.Add(x);
                        }
                    }

                    var removeMethod = collectionEntry.CurrentValue.GetType().GetMethod("Remove");
                    foreach (var removeObj in toRemove)
                    {
                        removeMethod?.Invoke(collectionEntry.CurrentValue, new[] { removeObj });
                    }

                    var toAddKeys = new System.Collections.Generic.List<object>();
                    foreach (var k in incomingKeys)
                    {
                        if (!currentKeys.Contains(k))
                        {
                            toAddKeys.Add(k);
                        }
                    }

                    var addMethod = collectionEntry.CurrentValue.GetType().GetMethod("Add");
                    foreach (var addKey in toAddKeys)
                    {
                        var addObj = await _db.FindAsync(targetEntityType.ClrType, addKey);
                        if (addObj != null)
                        {
                            addMethod?.Invoke(collectionEntry.CurrentValue, new[] { addObj });
                        }
                    }
                }
            }
        }

        foreach (var referenceEntry in entry.References)
        {
            if (!referenceEntry.IsLoaded)
            {
                await referenceEntry.LoadAsync();
            }

            var incomingReferenceEntry = updateEntry.References
                .FirstOrDefault(w => w.Metadata.Name == referenceEntry.Metadata.Name);

            if (incomingReferenceEntry != null)
            {
                var incomingRef = incomingReferenceEntry.CurrentValue;
                if (incomingRef == null)
                {
                    // Only set the navigation reference to null if there is no foreign key or if the foreign key itself is null
                    var foreignKey = (referenceEntry.Metadata as INavigation)?.ForeignKey;
                    if (foreignKey != null)
                    {
                        var fkProp = foreignKey.Properties[0].Name;
                        var incomingFkValue = updateEntry.Property(fkProp).CurrentValue;
                        if (incomingFkValue == null)
                        {
                            referenceEntry.CurrentValue = null;
                        }
                    }
                    else
                    {
                        referenceEntry.CurrentValue = null;
                    }
                }
                else
                {
                    var targetEntityType = referenceEntry.Metadata.TargetEntityType;
                    var primaryKey = targetEntityType.FindPrimaryKey();
                    if (primaryKey != null)
                    {
                        var keyPropertyName = primaryKey.Properties[0].Name;
                        var incomingKey = _db.Entry(incomingRef).Property(keyPropertyName).CurrentValue;

                        var trackedRef = await _db.FindAsync(targetEntityType.ClrType, incomingKey);
                        referenceEntry.CurrentValue = trackedRef;
                    }
                }
            }
        }
    }

    /// <summary>
    /// Applies a delta modification to an existing entity (Partial Update).
    /// </summary>
    /// <param name="key">The unique identifier of the target entity.</param>
    /// <param name="patch">The specific property-level delta modifications to apply.</param>
    /// <returns>The updated entity details.</returns>
    /// <response code="200">The partial modifications were successfully written.</response>
    /// <response code="400">If the delta changes violate database constraints or model validation.</response>
    /// <response code="401">If the request is unauthorized.</response>
    /// <response code="404">If no entity matches the specified ID.</response>
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public virtual async Task<IActionResult> Patch([FromRoute] TKey key, [FromBody] Delta<TEntity> patch)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var existing = await _db.Set<TEntity>().FindAsync(key);
        if (existing == null) return NotFound();

        patch.Patch(existing);

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!await EntityExists(key)) return NotFound();
            throw;
        }

        return Updated(existing);
    }

    /// <summary>
    /// Permanently deletes an entity from the database.
    /// </summary>
    /// <param name="key">The unique key of the entity to purge.</param>
    /// <returns>No content on success.</returns>
    /// <response code="204">The entity was successfully deleted.</response>
    /// <response code="401">If the request is unauthorized.</response>
    /// <response code="404">If no entity matches the specified identifier.</response>
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public virtual async Task<IActionResult> Delete([FromRoute] TKey key)
    {
        var entity = await _db.Set<TEntity>().FindAsync(key);
        if (entity == null) return NotFound();

        _db.Set<TEntity>().Remove(entity);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    /// <summary>
    /// Generic helper to dynamically load and return an entity's Reference or Collection navigation property.
    /// Handles camelCase/PascalCase case discrepancies case-insensitively using EF Core's Entry metadata APIs.
    /// </summary>
    /// <param name="key">The primary key of the target entity.</param>
    /// <returns>The resolved navigation property value.</returns>
    protected virtual async Task<ActionResult> GetNavigationPropertyAsync(TKey key)
    {
        var pathSegment = HttpContext.Request.Path.Value?.Split('/', StringSplitOptions.RemoveEmptyEntries).Last();
        if (string.IsNullOrEmpty(pathSegment))
        {
            return BadRequest("Invalid navigation property path.");
        }

        var entity = await _db.Set<TEntity>().FindAsync(key);
        if (entity == null)
        {
            return NotFound($"Entity with key {key} was not found.");
        }

        var entry = _db.Entry(entity);
        var navigations = entry.Metadata.GetNavigations()
            .Concat<INavigationBase>(entry.Metadata.GetSkipNavigations());

        var navigation = navigations.FirstOrDefault(n =>
            string.Equals(n.Name, pathSegment, StringComparison.OrdinalIgnoreCase));

        if (navigation == null)
        {
            return BadRequest($"Property '{pathSegment}' is not a valid navigation property on {typeof(TEntity).Name}.");
        }

        if (navigation.IsCollection)
        {
            var collectionEntry = entry.Collection(navigation.Name);
            if (!collectionEntry.IsLoaded)
            {
                await collectionEntry.LoadAsync();
            }
            return Ok(collectionEntry.CurrentValue);
        }
        else
        {
            var referenceEntry = entry.Reference(navigation.Name);
            if (!referenceEntry.IsLoaded)
            {
                await referenceEntry.LoadAsync();
            }
            return Ok(referenceEntry.CurrentValue);
        }
    }

    private async Task<bool> EntityExists(TKey key)
    {
        return await _db.Set<TEntity>().FindAsync(key) != null;
    }

    protected static IEnumerable<Chambered.Api.Models.EnumDto> GetEnumValues<TEnum>() where TEnum : struct, Enum
    {
        return Enum.GetValues(typeof(TEnum))
            .Cast<TEnum>()
            .Select(e => new Chambered.Api.Models.EnumDto
            {
                Value = e.ToString(),
                DisplayName = GetEnumDisplayName(e)
            });
    }

    private static string GetEnumDisplayName(Enum value)
    {
        var field = value.GetType().GetField(value.ToString());
        if (field == null) return value.ToString();
        var attribute = (System.ComponentModel.DataAnnotations.DisplayAttribute?)Attribute.GetCustomAttribute(field, typeof(System.ComponentModel.DataAnnotations.DisplayAttribute));
        return attribute?.Name ?? value.ToString();
    }
}
