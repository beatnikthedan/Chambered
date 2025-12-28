using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;


namespace Chamber.Data
{
    public class ChamberDbContext : IdentityDbContext<ChamberUser>
    {
        //builder.Services.AddDbContext<ChamberDbContext>(options =>options.UseSqlite("Data Source=chamber.db"));
        
        public ChamberDbContext(DbContextOptions<ChamberDbContext> options)
            : base(options)
        {
        }

        public DbSet<Projectile> Projectiles { get; set; }
        public DbSet<Cartridge> Cartridges { get; set; }
        public DbSet<FactoryAmmo> FactoryAmmo { get; set; }
        public DbSet<Manufacturer> Manufacturers { get; set; }
        public DbSet<ExternalSourceMap> ExternalSourceMaps { get; set; }
        public DbSet<Powder> Powders { get; set; }
        public DbSet<Firearm> Firearms { get; set; }
        public DbSet<CartridgeLot> CartridgeLots { get; set; }
        public DbSet<AmmoLot> AmmoLots { get; set; }
        public DbSet<Primer> Primers { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Apply your own entity configurations
            builder.ApplyConfigurationsFromAssembly(typeof(ChamberDbContext).Assembly);
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

    public class Manufacturer
    {
        public int Id { get; set; }

        public string Name { get; set; }
        public string Country { get; set; }
        public string Website { get; set; }

        public ICollection<Projectile> Projectiles { get; set; }
        public ICollection<FactoryAmmo> FactoryAmmo { get; set; }
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

    public class Firearm
    {
        public int Id { get; set; }

        public string Manufacturer { get; set; }
        public string Model { get; set; }

        public string Caliber { get; set; }
        public decimal BarrelLengthInches { get; set; }
        public string TwistRate { get; set; }        // e.g., "1:10"
        public string ActionType { get; set; }       // Bolt, Semi-auto, Revolver, etc.

        public string SerialNumber { get; set; }     // Optional, user-controlled
        public string Notes { get; set; }
    }

    public class CartridgeLot
    {
        public int Id { get; set; }

        public int CartridgeId { get; set; }
        public Cartridge Cartridge { get; set; }

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
        public Cartridge Cartridge { get; set; }

        public int ProjectileId { get; set; }
        public Projectile Projectile { get; set; }

        public int? PowderId { get; set; }
        public Powder Powder { get; set; }

        public decimal? PowderChargeGrains { get; set; }
        public decimal? CartridgeOverallLength { get; set; }

        public int Quantity { get; set; }

        public string LotNumber { get; set; }        // User-defined or factory lot
        public DateTime DateLoaded { get; set; }

        public string Notes { get; set; }
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

    public class ManufacturerConfiguration : IEntityTypeConfiguration<Manufacturer>
    {
        public void Configure(EntityTypeBuilder<Manufacturer> builder)
        {
            builder.Property(m => m.Name)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(m => m.Country)
                .HasMaxLength(50);

            builder.Property(m => m.Website)
                .HasMaxLength(200);
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

    public class FirearmConfiguration : IEntityTypeConfiguration<Firearm>
    {
        public void Configure(EntityTypeBuilder<Firearm> builder)
        {
            builder.Property(f => f.Manufacturer)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(f => f.Model)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(f => f.Caliber)
                .HasMaxLength(20);

            builder.Property(f => f.TwistRate)
                .HasMaxLength(20);

            builder.Property(f => f.ActionType)
                .HasMaxLength(50);

            builder.Property(f => f.SerialNumber)
                .HasMaxLength(100);

            builder.Property(f => f.Notes)
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
        }
    }
}
