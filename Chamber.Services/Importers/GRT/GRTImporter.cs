using Chamber.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace Chamber.Services.Importers.GRT
{
    //   Chamber.Services
    //└── Importers
    //     └── GRT
    //          ├── Base
    //          │    └── GRTImporterBase.cs
    //          ├── GRTImporter.cs
    //          ├── Projectiles
    //          │    ├── GRTProjectileImporter.cs
    //          │    └── GRTProjectileDto.cs
    //          ├── Cartridges
    //          │    ├── GRTCartridgeImporter.cs
    //          │    └── GRTCartridgeDto.cs
    //          ├── Powders
    //          │    ├── GRTPowderImporter.cs
    //          │    └── GRTPowderDto.cs
    //          ├── Primers
    //          │    ├── GRTPrimerImporter.cs
    //          │    └── GRTPrimerDto.cs
    //          ├── Cases
    //          │    ├── GRTCaseImporter.cs
    //          │    └── GRTCaseDto.cs
    //          └── FactoryAmmo
    //               ├── GRTFactoryAmmoImporter.cs
    //               └── GRTFactoryAmmoDto.cs



    public class GRTImporter
    {
        private readonly GRTProjectileImporter _projectiles;
        private readonly GRTCartridgeImporter _cartridges;
        private readonly GRTPowderImporter _powders;
        private readonly GRTPrimerImporter _primers;
        private readonly GRTCaseImporter _cases;
        private readonly GRTFactoryAmmoImporter _factoryAmmo;

        public GRTImporter(
            GRTProjectileImporter projectiles,
            GRTCartridgeImporter cartridges,
            GRTPowderImporter powders,
            GRTPrimerImporter primers,
            GRTCaseImporter cases,
            GRTFactoryAmmoImporter factoryAmmo)
        {
            _projectiles = projectiles;
            _cartridges = cartridges;
            _powders = powders;
            _primers = primers;
            _cases = cases;
            _factoryAmmo = factoryAmmo;
        }

        public async Task ImportAllAsync(string folder, IProgress<string> progress = null)
        {
            await _projectiles.ImportAsync(Path.Combine(folder, "projectiles.json"), progress);
            await _cartridges.ImportAsync(Path.Combine(folder, "cartridges.json"), progress);
            await _powders.ImportAsync(Path.Combine(folder, "powders.json"), progress);
            await _primers.ImportAsync(Path.Combine(folder, "primers.json"), progress);
            await _cases.ImportAsync(Path.Combine(folder, "cases.json"), progress);
            await _factoryAmmo.ImportAsync(Path.Combine(folder, "factory_ammo.json"), progress);
        }
    }

    public abstract class GRTImporterBase<TDto, TEntity>
    where TEntity : class
    {
        protected readonly ChamberDbContext _db;

        protected GRTImporterBase(ChamberDbContext db)
        {
            _db = db;
        }

        public async Task ImportAsync(string jsonPath, IProgress<string> progress = null)
        {
            if (!File.Exists(jsonPath))
            {
                progress?.Report($"Skipping {jsonPath} (not found)");
                return;
            }

            progress?.Report($"Loading {jsonPath}...");

            var json = await File.ReadAllTextAsync(jsonPath);
            var items = JsonSerializer.Deserialize<List<TDto>>(json);

            int processed = 0;

            foreach (var dto in items)
            {
                processed++;

                var entity = await FindExistingAsync(dto);

                if (entity == null)
                {
                    entity = MapNew(dto);
                    _db.Set<TEntity>().Add(entity);
                }
                else
                {
                    Merge(entity, dto);
                }

                AddSourceMap(entity, dto);

                if (processed % 100 == 0)
                    progress?.Report($"{processed} {typeof(TEntity).Name} processed...");
            }

            await _db.SaveChangesAsync();
            progress?.Report($"Finished importing {typeof(TEntity).Name} ({processed} items)");
        }

        protected abstract Task<TEntity> FindExistingAsync(TDto dto);
        protected abstract TEntity MapNew(TDto dto);
        protected abstract void Merge(TEntity entity, TDto dto);
        protected abstract void AddSourceMap(TEntity entity, TDto dto);
    }

    public class GRTProjectileDto
    {
        public string Id { get; set; }
        public string Manufacturer { get; set; }
        public string Name { get; set; }
        public string Caliber { get; set; }
        public decimal Diameter { get; set; }
        public decimal Weight { get; set; }
        public string Type { get; set; }
        public decimal? BC_G1 { get; set; }
        public decimal? BC_G7 { get; set; }
        public decimal? SD { get; set; }
    }

    public class GRTProjectileImporter
    : GRTImporterBase<GRTProjectileDto, Projectile>
    {
        public GRTProjectileImporter(ChamberDbContext db) : base(db) { }

        protected override async Task<Projectile> FindExistingAsync(GRTProjectileDto dto)
        {
            return await _db.Projectiles
                .Include(p => p.Manufacturer)
                .FirstOrDefaultAsync(p =>
                    p.Name == dto.Name &&
                    p.Manufacturer.Name == dto.Manufacturer);
        }

        protected override Projectile MapNew(GRTProjectileDto dto)
        {
            var manufacturer = _db.Manufacturers
                .FirstOrDefault(m => m.Name == dto.Manufacturer)
                ?? new Manufacturer { Name = dto.Manufacturer };

            return new Projectile
            {
                Manufacturer = manufacturer,
                Name = dto.Name,
                Caliber = dto.Caliber,
                Diameter = dto.Diameter,
                WeightGrains = dto.Weight,
                Type = dto.Type,
                BallisticCoefficientG1 = dto.BC_G1,
                BallisticCoefficientG7 = dto.BC_G7,
                SectionalDensity = dto.SD
            };
        }

        protected override void Merge(Projectile entity, GRTProjectileDto dto)
        {
            entity.Diameter = dto.Diameter;
            entity.WeightGrains = dto.Weight;
            entity.BallisticCoefficientG1 = dto.BC_G1;
            entity.BallisticCoefficientG7 = dto.BC_G7;
            entity.SectionalDensity = dto.SD;
        }

        protected override void AddSourceMap(Projectile entity, GRTProjectileDto dto)
        {
            _db.ExternalSourceMaps.Add(new ExternalSourceMap
            {
                EntityType = "Projectile",
                EntityId = entity.Id,
                SourceName = "GRT",
                SourceId = dto.Id,
                RawJson = JsonSerializer.Serialize(dto)
            });
        }
    }

    public class GRTCartridgeDto
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string ParentCase { get; set; }
        public decimal CaseLength { get; set; }
        public decimal OverallLength { get; set; }
        public decimal RimDiameter { get; set; }
        public decimal BaseDiameter { get; set; }
        public decimal NeckDiameter { get; set; }
        public decimal? ShoulderAngle { get; set; }
        public int MaxPressurePsi { get; set; }
        public string PrimerType { get; set; }
    }

    public class GRTCartridgeImporter
    : GRTImporterBase<GRTCartridgeDto, Cartridge>
    {
        public GRTCartridgeImporter(ChamberDbContext db) : base(db) { }

        protected override async Task<Cartridge> FindExistingAsync(GRTCartridgeDto dto)
        {
            return await _db.Cartridges.FirstOrDefaultAsync(c => c.Name == dto.Name);
        }

        protected override Cartridge MapNew(GRTCartridgeDto dto)
        {
            return new Cartridge
            {
                Name = dto.Name,
                ParentCase = dto.ParentCase,
                CaseLength = dto.CaseLength,
                OverallLength = dto.OverallLength,
                RimDiameter = dto.RimDiameter,
                BaseDiameter = dto.BaseDiameter,
                NeckDiameter = dto.NeckDiameter,
                ShoulderAngle = dto.ShoulderAngle,
                MaxPressurePsi = dto.MaxPressurePsi,
                PrimerType = dto.PrimerType
            };
        }

        protected override void Merge(Cartridge entity, GRTCartridgeDto dto)
        {
            entity.ParentCase = dto.ParentCase;
            entity.CaseLength = dto.CaseLength;
            entity.OverallLength = dto.OverallLength;
            entity.RimDiameter = dto.RimDiameter;
            entity.BaseDiameter = dto.BaseDiameter;
            entity.NeckDiameter = dto.NeckDiameter;
            entity.ShoulderAngle = dto.ShoulderAngle;
            entity.MaxPressurePsi = dto.MaxPressurePsi;
            entity.PrimerType = dto.PrimerType;
        }

        protected override void AddSourceMap(Cartridge entity, GRTCartridgeDto dto)
        {
            _db.ExternalSourceMaps.Add(new ExternalSourceMap
            {
                EntityType = "Cartridge",
                EntityId = entity.Id,
                SourceName = "GRT",
                SourceId = dto.Id,
                RawJson = JsonSerializer.Serialize(dto)
            });
        }
    }

    public class GRTPowderDto
    {
        public string Id { get; set; }
        public string Manufacturer { get; set; }
        public string Name { get; set; }
        public string Type { get; set; }
        public decimal? BurnRate { get; set; }
    }

    public class GRTPowderImporter
    : GRTImporterBase<GRTPowderDto, Powder>
    {
        public GRTPowderImporter(ChamberDbContext db) : base(db) { }

        protected override async Task<Powder> FindExistingAsync(GRTPowderDto dto)
        {
            return await _db.Powders.FirstOrDefaultAsync(p =>
                p.Name == dto.Name &&
                p.Manufacturer == dto.Manufacturer);
        }

        protected override Powder MapNew(GRTPowderDto dto)
        {
            return new Powder
            {
                Manufacturer = dto.Manufacturer,
                Name = dto.Name,
                Type = dto.Type,
                BurnRateRank = dto.BurnRate
            };
        }

        protected override void Merge(Powder entity, GRTPowderDto dto)
        {
            entity.Type = dto.Type;
            entity.BurnRateRank = dto.BurnRate;
        }

        protected override void AddSourceMap(Powder entity, GRTPowderDto dto)
        {
            _db.ExternalSourceMaps.Add(new ExternalSourceMap
            {
                EntityType = "Powder",
                EntityId = entity.Id,
                SourceName = "GRT",
                SourceId = dto.Id,
                RawJson = JsonSerializer.Serialize(dto)
            });
        }
    }

    public class GRTPrimerDto
    {
        public string Id { get; set; }
        public string Manufacturer { get; set; }
        public string Name { get; set; }
        public string Type { get; set; } // Small Pistol, Large Rifle, etc.
    }

    public class GRTPrimerImporter
    : GRTImporterBase<GRTPrimerDto, Primer>
    {
        public GRTPrimerImporter(ChamberDbContext db) : base(db) { }

        protected override async Task<Primer> FindExistingAsync(GRTPrimerDto dto)
        {
            return await _db.Set<Primer>().FirstOrDefaultAsync(p =>
                p.Name == dto.Name &&
                p.Manufacturer == dto.Manufacturer);
        }

        protected override Primer MapNew(GRTPrimerDto dto)
        {
            return new Primer
            {
                Manufacturer = dto.Manufacturer,
                Name = dto.Name,
                Type = dto.Type
            };
        }

        protected override void Merge(Primer entity, GRTPrimerDto dto)
        {
            entity.Type = dto.Type;
        }

        protected override void AddSourceMap(Primer entity, GRTPrimerDto dto)
        {
            _db.ExternalSourceMaps.Add(new ExternalSourceMap
            {
                EntityType = "Primer",
                EntityId = entity.Id,
                SourceName = "GRT",
                SourceId = dto.Id,
                RawJson = JsonSerializer.Serialize(dto)
            });
        }
    }

    public class GRTCaseDto
    {
        public string Id { get; set; }
        public string CartridgeName { get; set; }
        public int Quantity { get; set; }
        public int TimesFired { get; set; }
        public bool Annealed { get; set; }
    }

    public class GRTCaseImporter
    : GRTImporterBase<GRTCaseDto, CartridgeLot>
    {
        public GRTCaseImporter(ChamberDbContext db) : base(db) { }

        protected override async Task<CartridgeLot> FindExistingAsync(GRTCaseDto dto)
        {
            return await _db.CartridgeLots
                .Include(c => c.Cartridge)
                .FirstOrDefaultAsync(c =>
                    c.Cartridge.Name == dto.CartridgeName &&
                    c.LotNumber == dto.Id);
        }

        protected override CartridgeLot MapNew(GRTCaseDto dto)
        {
            var cartridge = _db.Cartridges.FirstOrDefault(c => c.Name == dto.CartridgeName);

            return new CartridgeLot
            {
                Cartridge = cartridge,
                LotNumber = dto.Id,
                Quantity = dto.Quantity,
                TimesFired = dto.TimesFired,
                Annealed = dto.Annealed
            };
        }

        protected override void Merge(CartridgeLot entity, GRTCaseDto dto)
        {
            entity.Quantity = dto.Quantity;
            entity.TimesFired = dto.TimesFired;
            entity.Annealed = dto.Annealed;
        }

        protected override void AddSourceMap(CartridgeLot entity, GRTCaseDto dto)
        {
            _db.ExternalSourceMaps.Add(new ExternalSourceMap
            {
                EntityType = "CartridgeLot",
                EntityId = entity.Id,
                SourceName = "GRT",
                SourceId = dto.Id,
                RawJson = JsonSerializer.Serialize(dto)
            });
        }
    }

    public class GRTFactoryAmmoDto
    {
        public string Id { get; set; }
        public string Manufacturer { get; set; }
        public string Cartridge { get; set; }
        public string Projectile { get; set; }
        public decimal BulletWeight { get; set; }
        public int? Velocity { get; set; }
        public int? Energy { get; set; }
    }

    public class GRTFactoryAmmoImporter
    : GRTImporterBase<GRTFactoryAmmoDto, FactoryAmmo>
    {
        public GRTFactoryAmmoImporter(ChamberDbContext db) : base(db) { }

        protected override async Task<FactoryAmmo> FindExistingAsync(GRTFactoryAmmoDto dto)
        {
            return await _db.FactoryAmmo
                .Include(f => f.Manufacturer)
                .Include(f => f.Cartridge)
                .Include(f => f.Projectile)
                .FirstOrDefaultAsync(f =>
                    f.Sku == dto.Id);
        }

        protected override FactoryAmmo MapNew(GRTFactoryAmmoDto dto)
        {
            var manufacturer = _db.Manufacturers.FirstOrDefault(m => m.Name == dto.Manufacturer)
                ?? new Manufacturer { Name = dto.Manufacturer };

            var cartridge = _db.Cartridges.FirstOrDefault(c => c.Name == dto.Cartridge);
            var projectile = _db.Projectiles.FirstOrDefault(p => p.Name == dto.Projectile);

            return new FactoryAmmo
            {
                Manufacturer = manufacturer,
                Cartridge = cartridge,
                Projectile = projectile,
                BulletWeightGrains = dto.BulletWeight,
                AdvertisedVelocityFps = dto.Velocity,
                AdvertisedEnergyFtLbs = dto.Energy,
                Sku = dto.Id
            };
        }

        protected override void Merge(FactoryAmmo entity, GRTFactoryAmmoDto dto)
        {
            entity.BulletWeightGrains = dto.BulletWeight;
            entity.AdvertisedVelocityFps = dto.Velocity;
            entity.AdvertisedEnergyFtLbs = dto.Energy;
        }

        protected override void AddSourceMap(FactoryAmmo entity, GRTFactoryAmmoDto dto)
        {
            _db.ExternalSourceMaps.Add(new ExternalSourceMap
            {
                EntityType = "FactoryAmmo",
                EntityId = entity.Id,
                SourceName = "GRT",
                SourceId = dto.Id,
                RawJson = JsonSerializer.Serialize(dto)
            });
        }
    }
}
