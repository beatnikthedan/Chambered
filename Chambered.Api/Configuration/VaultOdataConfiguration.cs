using Asp.Versioning;
using Asp.Versioning.OData;
using Chambered.Api.Dto.Versioning;
using Chambered.Api.Models;
using Chambered.Data.Models;
using Microsoft.OData.ModelBuilder;

namespace Chambered.Api.Configuration
{
    /// <summary>
    /// OData configuration for secure physical storage vaults.
    /// </summary>
    public class VaultOdataConfiguration : IModelConfiguration
    {
        /// <inheritdoc/>
        public void Apply(ODataModelBuilder builder, ApiVersion apiVersion, string? routePrefix)
        {
            builder.EntitySet<Vault>("Vaults");

            var vaultsColl = builder.EntityType<Vault>().Collection;
            vaultsColl.Function("GetLockTypes").ReturnsCollection<EnumDto>();
            vaultsColl.Function("GetVaultCategories").ReturnsCollection<EnumDto>();

            switch (apiVersion.MajorVersion)
            {
                case 1:
                    {
                        var vault = builder.EntityType<Vault>();
                        vault.Property(v => v.Name).IsRequired();
                        vault.Property(v => v.Name).MaxLength = 100;
                        vault.Property(v => v.Description).MaxLength = 500;
                        vault.Property(v => v.EncryptedPasscode).MaxLength = 512;
                        vault.Property(v => v.EncryptionIv).MaxLength = 128;
                        vault.Property(v => v.PasscodeHint).MaxLength = 250;
                        vault.Property(v => v.BackupKeyLocation).MaxLength = 250;
                        break;
                    }
            }
        }
    }
}
