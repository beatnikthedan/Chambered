using Chambered.Data;
using Chambered.Data.Models;
using Chambered.Data.Enums;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;


namespace Chambered.Data
{
    public class ChamberedDbContext : IdentityDbContext<ChamberedUser>
    {
        //builder.Services.AddDbContext<ChamberedDbContext>(options =>options.UseSqlite("Data Source=chambered.db"));
        
        public ChamberedDbContext(DbContextOptions<ChamberedDbContext> options)
            : base(options)
        {
        }

        public DbSet<ArmoryItem> ArmoryItems { get; set; }
        public DbSet<Arsenal> Arsenals { get; set; }
        public DbSet<Caliber> Calibers { get; set; }
        public DbSet<Document> Documents { get; set; }
        public DbSet<Manufacturer> Manufacturers { get; set; }
        public DbSet<Product> Products { get; set; }
        public DbSet<Vault> Vaults { get; set; }
        public DbSet<VaultCategory> VaultCategories { get; set; }
        




        public DbSet<Projectile> Projectiles { get; set; }
        public DbSet<Cartridge> Cartridges { get; set; }
        public DbSet<FactoryAmmo> FactoryAmmo { get; set; }
        
        public DbSet<ExternalSourceMap> ExternalSourceMaps { get; set; }
        public DbSet<Powder> Powders { get; set; }
        
        public DbSet<CartridgeLot> CartridgeLots { get; set; }
        public DbSet<AmmoLot> AmmoLots { get; set; }
        public DbSet<Primer> Primers { get; set; }
        public DbSet<OidcConfig> OidcConfigs { get; set; }
        public DbSet<ApiKey> ApiKeys { get; set; }
        
        

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Apply your own entity configurations
            builder.ApplyConfigurationsFromAssembly(typeof(ChamberedDbContext).Assembly);
        }

        protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
        {
            configurationBuilder.Properties<ActionType>().HaveConversion<int>();
            configurationBuilder.Properties<DocumentType>().HaveConversion<int>();
            configurationBuilder.Properties<ItemCondition>().HaveConversion<int>();
            configurationBuilder.Properties<LockType>().HaveConversion<int>();
            configurationBuilder.Properties<NfaFormType>().HaveConversion<int>();
            configurationBuilder.Properties<ProductCategory>().HaveConversion<int>();
        }
    }

    public class Projectile
    {
        public int Id { get; set; }

        public int ManufacturerId { get; set; }
        public Manufacturer Manufacturer { get; set; }

        public string Name { get; set; }
        public string Caliber { get; set; }
        public decimal Diameter { get; set; }
        public decimal WeightGrains { get; set; }

        public string Type { get; set; }

        // Ballistic coefficients
        public decimal? BallisticCoefficientG1 { get; set; }
        public decimal? BallisticCoefficientG7 { get; set; }

        public decimal? SectionalDensity { get; set; }

        public string Notes { get; set; }
    }

    public class Cartridge
    {
        public int Id { get; set; }

        public string Name { get; set; }               // "9mm Luger"
        public string ParentCase { get; set; }         // optional

        public decimal CaseLength { get; set; }
        public decimal OverallLength { get; set; }
        public decimal RimDiameter { get; set; }
        public decimal BaseDiameter { get; set; }
        public decimal NeckDiameter { get; set; }
        public decimal? ShoulderAngle { get; set; }

        public int MaxPressurePsi { get; set; }
        public string PrimerType { get; set; }         // "Small Pistol", etc.

        public string Notes { get; set; }
    }

    public class FactoryAmmo
    {
        public int Id { get; set; }

        public int ManufacturerId { get; set; }
        public Manufacturer Manufacturer { get; set; }

        public int CartridgeId { get; set; }
        public Cartridge Cartridge { get; set; }

        public int ProjectileId { get; set; }
        public Projectile Projectile { get; set; }

        public decimal BulletWeightGrains { get; set; }
        public int? AdvertisedVelocityFps { get; set; }
        public int? AdvertisedEnergyFtLbs { get; set; }
        public decimal? TestBarrelLengthInches { get; set; }

        public string Sku { get; set; }
        public string Upc { get; set; }

        public string Notes { get; set; }
    }

    public class ExternalSourceMap
    {
        public int Id { get; set; }

        public string EntityType { get; set; }     // "Projectile", "Cartridge", etc.
        public int EntityId { get; set; }

        public string SourceName { get; set; }     // "GRT", "Ammolytics"
        public string SourceId { get; set; }

        public string RawJson { get; set; }        // optional for debugging imports
    }

    public class Powder
    {
        public int Id { get; set; }

        public string Manufacturer { get; set; }     // Hodgdon, Alliant, Vihtavuori
        public string Name { get; set; }             // "H4350", "Titegroup"
        public string Type { get; set; }             // Extruded, Ball, Flake

        public decimal? BurnRateRank { get; set; }   // Optional: relative burn rate index
        public string Notes { get; set; }
    }

    

    public class CartridgeLot
    {
        public int Id { get; set; }

        public int CartridgeId { get; set; }
        public Cartridge? Cartridge { get; set; }

        public string LotNumber { get; set; }        // User-defined or manufacturer lot
        public int Quantity { get; set; }

        public int? TimesFired { get; set; }
        public bool? Annealed { get; set; }

        public string Notes { get; set; }
    }

    public class AmmoLot
    {
        public int Id { get; set; }

        public int CartridgeId { get; set; }
        public Cartridge? Cartridge { get; set; }

        public int? ProjectileId { get; set; }       // Nullable for factory ammo lots
        public Projectile? Projectile { get; set; }

        public int? PowderId { get; set; }
        public Powder? Powder { get; set; }

        public decimal? PowderChargeGrains { get; set; }
        public decimal? CartridgeOverallLength { get; set; }

        public int? FactoryAmmoId { get; set; }       // Optional, links to factory ammo catalog
        public FactoryAmmo? FactoryAmmo { get; set; }

        public int Quantity { get; set; }

        public string LotNumber { get; set; }        // User-defined or factory lot
        public DateTime DateLoaded { get; set; }

        public string Notes { get; set; }

        public int? ArsenalId { get; set; }
        public Arsenal? Arsenal { get; set; }
    }

    public class Primer
    {
        public int Id { get; set; }

        public string Manufacturer { get; set; }     // CCI, Federal, Winchester
        public string Name { get; set; }             // "CCI 450", "Federal 205"
        public string Type { get; set; }             // Small Rifle, Large Pistol, etc.

        public string Notes { get; set; }
    }
    
    public class PrimerConfiguration : IEntityTypeConfiguration<Primer>
    {
        public void Configure(EntityTypeBuilder<Primer> builder)
        {
            builder.Property(p => p.Manufacturer)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(p => p.Name)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(p => p.Type)
                .HasMaxLength(50);

            builder.Property(p => p.Notes)
                .HasMaxLength(500);
        }
    }

    public class ProjectileConfiguration : IEntityTypeConfiguration<Projectile>
    {
        public void Configure(EntityTypeBuilder<Projectile> builder)
        {
            builder.Property(p => p.Name)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(p => p.Caliber)
                .IsRequired()
                .HasMaxLength(20);

            builder.Property(p => p.Type)
                .HasMaxLength(50);

            builder.Property(p => p.BallisticCoefficientG1)
                .HasPrecision(6, 4);

            builder.Property(p => p.BallisticCoefficientG7)
                .HasPrecision(6, 4);

            builder.Property(p => p.SectionalDensity)
                .HasPrecision(6, 4);

            builder.Property(p => p.Notes)
                .HasMaxLength(500);
        }
    }

    public class CartridgeConfiguration : IEntityTypeConfiguration<Cartridge>
    {
        public void Configure(EntityTypeBuilder<Cartridge> builder)
        {
            builder.Property(c => c.Name)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(c => c.PrimerType)
                .HasMaxLength(50);

            builder.Property(c => c.ParentCase)
                .HasMaxLength(100);

            builder.Property(c => c.Notes)
                .HasMaxLength(500);
        }
    }

    public class FactoryAmmoConfiguration : IEntityTypeConfiguration<FactoryAmmo>
    {
        public void Configure(EntityTypeBuilder<FactoryAmmo> builder)
        {
            builder.Property(f => f.Sku)
                .HasMaxLength(50);

            builder.Property(f => f.Upc)
                .HasMaxLength(50);

            builder.Property(f => f.Notes)
                .HasMaxLength(500);
        }
    }

    public class ExternalSourceMapConfiguration : IEntityTypeConfiguration<ExternalSourceMap>
    {
        public void Configure(EntityTypeBuilder<ExternalSourceMap> builder)
        {
            builder.Property(e => e.EntityType)
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(e => e.SourceName)
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(e => e.SourceId)
                .HasMaxLength(100);

            builder.Property(e => e.RawJson)
                .HasMaxLength(4000);
        }
    }

    public class PowderConfiguration : IEntityTypeConfiguration<Powder>
    {
        public void Configure(EntityTypeBuilder<Powder> builder)
        {
            builder.Property(p => p.Manufacturer)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(p => p.Name)
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(p => p.Type)
                .HasMaxLength(50);

            builder.Property(p => p.Notes)
                .HasMaxLength(500);
        }
    }

    public class CartridgeLotConfiguration : IEntityTypeConfiguration<CartridgeLot>
    {
        public void Configure(EntityTypeBuilder<CartridgeLot> builder)
        {
            builder.Property(c => c.LotNumber)
                .HasMaxLength(100);

            builder.Property(c => c.Notes)
                .HasMaxLength(500);
        }
    }

    public class AmmoLotConfiguration : IEntityTypeConfiguration<AmmoLot>
    {
        public void Configure(EntityTypeBuilder<AmmoLot> builder)
        {
            builder.Property(a => a.LotNumber)
                .HasMaxLength(100);

            builder.Property(a => a.Notes)
                .HasMaxLength(500);

            builder.Property(a => a.DateLoaded)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            builder.HasOne(a => a.FactoryAmmo)
                .WithMany()
                .HasForeignKey(a => a.FactoryAmmoId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasOne(a => a.Projectile)
                .WithMany()
                .HasForeignKey(a => a.ProjectileId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }

    public class OidcConfig
    {
        public int Id { get; set; }
        public bool IsEnabled { get; set; } = false;
        public string ClientId { get; set; } = "";
        public string ClientSecret { get; set; } = "";
        public string IssuerUrl { get; set; } = "";
        public string AuthUrl { get; set; } = "";
        public string TokenUrl { get; set; } = "";
        public string UserinfoUrl { get; set; } = "";
        public string JwksUrl { get; set; } = "";
        public bool AutoCreateUser { get; set; } = true;
    }

    public class ApiKey
    {
        public int Id { get; set; }
        public string Name { get; set; } = "";
        public string UserId { get; set; } = "";
        public ChamberedUser User { get; set; }
        public string TokenHash { get; set; } = "";
        public string TokenPreview { get; set; } = "";
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class OidcConfigConfiguration : IEntityTypeConfiguration<OidcConfig>
    {
        public void Configure(EntityTypeBuilder<OidcConfig> builder)
        {
            builder.Property(o => o.ClientId).HasMaxLength(250);
            builder.Property(o => o.ClientSecret).HasMaxLength(250);
            builder.Property(o => o.IssuerUrl).HasMaxLength(500);
            builder.Property(o => o.AuthUrl).HasMaxLength(500);
            builder.Property(o => o.TokenUrl).HasMaxLength(500);
            builder.Property(o => o.UserinfoUrl).HasMaxLength(500);
            builder.Property(o => o.JwksUrl).HasMaxLength(500);
        }
    }

    public class ApiKeyConfiguration : IEntityTypeConfiguration<ApiKey>
    {
        public void Configure(EntityTypeBuilder<ApiKey> builder)
        {
            builder.Property(a => a.Name).IsRequired().HasMaxLength(150);
            builder.Property(a => a.UserId).IsRequired();
            builder.Property(a => a.TokenHash).IsRequired().HasMaxLength(250);
            builder.Property(a => a.TokenPreview).HasMaxLength(20);

            builder.HasOne(a => a.User)
                .WithMany()
                .HasForeignKey(a => a.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
