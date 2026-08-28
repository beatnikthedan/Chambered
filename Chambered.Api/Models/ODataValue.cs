namespace Chambered.Api.Models;

/// <summary>
/// Represents a generic OData envelope wrapper for collection responses.
/// </summary>
/// <typeparam name="T">The type of the elements in the collection.</typeparam>
public class ODataValue<T>
{
    /// <summary>
    /// Gets or sets the collection value.
    /// </summary>
    public IEnumerable<T> Value { get; set; } = [];
}
