using Asp.Versioning;
using Asp.Versioning.OData;
using Chambered.Api.Dto.Versioning;
using Microsoft.OData.ModelBuilder;

namespace Chambered.Api.Configuration
{
    /// <summary>
    /// OData configuration for system versioning operations.
    /// </summary>
    public class VersionOdataConfiguration : IModelConfiguration
    {
        /// <inheritdoc/>
        public void Apply(ODataModelBuilder builder, ApiVersion apiVersion, string? routePrefix)
        {
            builder.Function("GetCurrentVersion").Returns<GitHubReleaseDto>();
            builder.Function("GetVersionHistory").ReturnsCollection<GitHubReleaseDto>().Parameter<bool>("PreRelease");
            builder.Function("GetLatestVersion").Returns<GitHubReleaseDto>().Parameter<bool>("PreRelease");
        }
    }
}
