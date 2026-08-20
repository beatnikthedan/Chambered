using Microsoft.AspNetCore.OData.Formatter.Serialization;
using Microsoft.OData.Edm;

namespace Chambered.Api.Configuration;

public class CustomODataSerializerProvider : ODataSerializerProvider
{
    private readonly CustomODataResourceSerializer _resourceSerializer;

    public CustomODataSerializerProvider(IServiceProvider serviceProvider)
        : base(serviceProvider)
    {
        _resourceSerializer = new CustomODataResourceSerializer(this);
    }

    public override IODataEdmTypeSerializer GetEdmTypeSerializer(IEdmTypeReference edmType)
    {
        if (edmType.IsEntity() || edmType.IsComplex())
        {
            return _resourceSerializer;
        }

        return base.GetEdmTypeSerializer(edmType);
    }
}
