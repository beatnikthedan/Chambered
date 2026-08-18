using Microsoft.AspNetCore.OData.Formatter;
using Microsoft.AspNetCore.OData.Formatter.Serialization;
using Microsoft.OData;
using Microsoft.OData.Edm;
using Chambered.Data.Models;
using System.Text.Json;

namespace Chambered.Api.Configuration;

public class CustomODataResourceSerializer : ODataResourceSerializer
{
    public CustomODataResourceSerializer(IODataSerializerProvider serializerProvider)
        : base(serializerProvider)
    {
    }

    public override ODataResource CreateResource(SelectExpandNode selectExpandNode, ResourceContext resourceContext)
    {
        var resource = base.CreateResource(selectExpandNode, resourceContext);
        if (resource == null) return null;

        if (resourceContext.ResourceInstance is Product product && product.Specifications != null && product.Specifications.Count > 0)
        {
            var json = JsonSerializer.Serialize(product.Specifications);
            var property = new ODataProperty
            {
                Name = "specifications",
                Value = new ODataUntypedValue { RawValue = json }
            };
            var list = resource.Properties.ToList();
            list.Add(property);
            resource.Properties = list;
        }
        else if (resourceContext.ResourceInstance is ArmoryItem armoryItem && armoryItem.Specifications != null && armoryItem.Specifications.Count > 0)
        {
            var json = JsonSerializer.Serialize(armoryItem.Specifications);
            var property = new ODataProperty
            {
                Name = "specifications",
                Value = new ODataUntypedValue { RawValue = json }
            };
            var list = resource.Properties.ToList();
            list.Add(property);
            resource.Properties = list;
        }

        return resource;
    }
}
