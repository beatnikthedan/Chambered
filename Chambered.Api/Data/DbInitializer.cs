using Chambered.Api.Authentication;
using Chambered.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Chambered.Api.Data
{
    public static class DbInitializer
    {
        public static async Task InitializeAsync(IServiceProvider serviceProvider)
        {
            using var context = serviceProvider.GetRequiredService<ChamberedDbContext>();
            var userManager = serviceProvider.GetRequiredService<UserManager<ChamberedUser>>();
            var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();

            // Ensure database is created
            await context.Database.EnsureCreatedAsync();

            // 1. Seed Roles and Users
            string adminRole = "Admin";
            string userRole = "User";

            if (!await roleManager.RoleExistsAsync(adminRole))
                await roleManager.CreateAsync(new IdentityRole(adminRole));
            if (!await roleManager.RoleExistsAsync(userRole))
                await roleManager.CreateAsync(new IdentityRole(userRole));

            // 2. Seed default OIDC Config if none exists
            if (!await context.OidcConfigs.AnyAsync())
            {
                context.OidcConfigs.Add(new OidcConfig
                {
                    IsEnabled = false,
                    ClientId = "",
                    ClientSecret = "",
                    IssuerUrl = "",
                    AuthUrl = "",
                    TokenUrl = "",
                    UserinfoUrl = "",
                    JwksUrl = "",
                    AutoCreateUser = true
                });
                await context.SaveChangesAsync();
            }

            // 3. Seed Manufacturers
            if (!await context.Manufacturers.AnyAsync())
            {
                var manufacturers = new List<Manufacturer>
                {
                    new Manufacturer { Name = "Hornady", Country = "USA", Website = "https://www.hornady.com" },
                    new Manufacturer { Name = "Winchester", Country = "USA", Website = "https://winchester.com" },
                    new Manufacturer { Name = "Federal Premium", Country = "USA", Website = "https://www.federalpremium.com" },
                    new Manufacturer { Name = "Remington", Country = "USA", Website = "https://www.remington.com" },
                    new Manufacturer { Name = "CCI", Country = "USA", Website = "https://www.cci-ammunition.com" },
                    new Manufacturer { Name = "Sierra Bullets", Country = "USA", Website = "https://www.sierrabullets.com" },
                    new Manufacturer { Name = "Glock", Country = "Austria", Website = "https://glock.com" },
                    new Manufacturer { Name = "Sig Sauer", Country = "USA", Website = "https://www.sigsauer.com" },
                    new Manufacturer { Name = "Ruger", Country = "USA", Website = "https://ruger.com" },
                    new Manufacturer { Name = "Hodgdon Powder", Country = "USA", Website = "https://www.hodgdon.com" },
                    new Manufacturer { Name = "Alliant Powder", Country = "USA", Website = "https://www.alliantpowder.com" },
                    new Manufacturer { Name = "Vihtavuori", Country = "Finland", Website = "https://www.vihtavuori.com" }
                };

                context.Manufacturers.AddRange(manufacturers);
                await context.SaveChangesAsync();
            }

            var hornady = await context.Manufacturers.FirstAsync(m => m.Name == "Hornady");
            var winchester = await context.Manufacturers.FirstAsync(m => m.Name == "Winchester");
            var federal = await context.Manufacturers.FirstAsync(m => m.Name == "Federal Premium");
            var sierra = await context.Manufacturers.FirstAsync(m => m.Name == "Sierra Bullets");
            var glock = await context.Manufacturers.FirstAsync(m => m.Name == "Glock");
            var sig = await context.Manufacturers.FirstAsync(m => m.Name == "Sig Sauer");
            var ruger = await context.Manufacturers.FirstAsync(m => m.Name == "Ruger");
            var hodgdon = await context.Manufacturers.FirstAsync(m => m.Name == "Hodgdon Powder");

            // 4. Seed Cartridges
            if (!await context.Cartridges.AnyAsync())
            {
                var cartridges = new List<Cartridge>
                {
                    new Cartridge
                    {
                        Name = "9mm Luger",
                        ParentCase = "9x19mm Parabellum",
                        CaseLength = 0.754m,
                        OverallLength = 1.169m,
                        RimDiameter = 0.394m,
                        BaseDiameter = 0.391m,
                        NeckDiameter = 0.380m,
                        MaxPressurePsi = 35000,
                        PrimerType = "Small Pistol",
                        Notes = "The most popular handgun cartridge worldwide."
                    },
                    new Cartridge
                    {
                        Name = "6.5 Creedmoor",
                        ParentCase = ".30 TC",
                        CaseLength = 1.920m,
                        OverallLength = 2.825m,
                        RimDiameter = 0.473m,
                        BaseDiameter = 0.470m,
                        NeckDiameter = 0.295m,
                        ShoulderAngle = 30.0m,
                        MaxPressurePsi = 62000,
                        PrimerType = "Large Rifle",
                        Notes = "Extremely popular short-action precision rifle cartridge."
                    },
                    new Cartridge
                    {
                        Name = ".223 Remington",
                        ParentCase = ".222 Remington Magnum",
                        CaseLength = 1.760m,
                        OverallLength = 2.260m,
                        RimDiameter = 0.378m,
                        BaseDiameter = 0.376m,
                        NeckDiameter = 0.253m,
                        ShoulderAngle = 23.0m,
                        MaxPressurePsi = 55000,
                        PrimerType = "Small Rifle",
                        Notes = "The civilian standard version of the military 5.56x45mm NATO."
                    },
                    new Cartridge
                    {
                        Name = ".308 Winchester",
                        ParentCase = ".300 Savage",
                        CaseLength = 2.015m,
                        OverallLength = 2.800m,
                        RimDiameter = 0.473m,
                        BaseDiameter = 0.470m,
                        NeckDiameter = 0.343m,
                        ShoulderAngle = 20.0m,
                        MaxPressurePsi = 62000,
                        PrimerType = "Large Rifle",
                        Notes = "Legendary short-action military and hunting cartridge."
                    }
                };

                context.Cartridges.AddRange(cartridges);
                await context.SaveChangesAsync();
            }

            var c9mm = await context.Cartridges.FirstAsync(c => c.Name == "9mm Luger");
            var c65 = await context.Cartridges.FirstAsync(c => c.Name == "6.5 Creedmoor");
            var c223 = await context.Cartridges.FirstAsync(c => c.Name == ".223 Remington");
            var c308 = await context.Cartridges.FirstAsync(c => c.Name == ".308 Winchester");

            // 5. Seed Projectiles
            if (!await context.Projectiles.AnyAsync())
            {
                var projectiles = new List<Projectile>
                {
                    new Projectile
                    {
                        ManufacturerId = hornady.Id,
                        Name = "ELD Match 6.5mm 140gr",
                        Caliber = "6.5mm",
                        Diameter = 0.264m,
                        WeightGrains = 140m,
                        Type = "ELD-M",
                        BallisticCoefficientG1 = 0.658m,
                        BallisticCoefficientG7 = 0.326m,
                        SectionalDensity = 0.287m,
                        Notes = "Extremely high BC projectile designed for match competition."
                    },
                    new Projectile
                    {
                        ManufacturerId = hornady.Id,
                        Name = "Frontier 9mm 115gr FMJ",
                        Caliber = "9mm",
                        Diameter = 0.355m,
                        WeightGrains = 115m,
                        Type = "FMJ",
                        Notes = "Standard bullet for plinking and general handgun shooting."
                    },
                    new Projectile
                    {
                        ManufacturerId = sierra.Id,
                        Name = "HPBT MatchKing .30cal 175gr",
                        Caliber = ".30cal",
                        Diameter = 0.308m,
                        WeightGrains = 175m,
                        Type = "HPBT",
                        BallisticCoefficientG1 = 0.505m,
                        BallisticCoefficientG7 = 0.243m,
                        SectionalDensity = 0.264m,
                        Notes = "The gold standard projectile for long range sniper match configurations."
                    }
                };

                context.Projectiles.AddRange(projectiles);
                await context.SaveChangesAsync();
            }

            var p65 = await context.Projectiles.FirstAsync(p => p.Name.Contains("ELD Match"));
            var p9mm = await context.Projectiles.FirstAsync(p => p.Name.Contains("Frontier 9mm"));
            var p308 = await context.Projectiles.FirstAsync(p => p.Name.Contains("HPBT MatchKing"));

            // 6. Seed Powders
            if (!await context.Powders.AnyAsync())
            {
                var powders = new List<Powder>
                {
                    new Powder { Manufacturer = "Hodgdon", Name = "H4350", Type = "Extruded", BurnRateRank = 110, Notes = "Legendary powder for short-action cartridges like 6.5 Creedmoor." },
                    new Powder { Manufacturer = "Hodgdon", Name = "Titegroup", Type = "Ball", BurnRateRank = 12, Notes = "Extremely versatile, fast-burning pistol powder." },
                    new Powder { Manufacturer = "Alliant", Name = "Unique", Type = "Flake", BurnRateRank = 31, Notes = "Classic powder for pistol and light shotgun loads." },
                    new Powder { Manufacturer = "Vihtavuori", Name = "N140", Type = "Extruded", BurnRateRank = 85, Notes = "Premium mid-range rifle powder, exceptionally clean." }
                };

                context.Powders.AddRange(powders);
                await context.SaveChangesAsync();
            }

            var powH4350 = await context.Powders.FirstAsync(p => p.Name == "H4350");
            var powTitegroup = await context.Powders.FirstAsync(p => p.Name == "Titegroup");

            // 7. Seed Primers
            if (!await context.Primers.AnyAsync())
            {
                var primers = new List<Primer>
                {
                    new Primer { Manufacturer = "CCI", Name = "CCI 450", Type = "Small Rifle Magnum", Notes = "Thick cup, excellent for high pressure 6.5 CM with small primer pockets." },
                    new Primer { Manufacturer = "CCI", Name = "CCI 500", Type = "Small Pistol", Notes = "Standard pistol primer, reliable and soft cup." },
                    new Primer { Manufacturer = "Federal", Name = "Federal 205M", Type = "Small Rifle Match", Notes = "Gold medal match small rifle primer." },
                    new Primer { Manufacturer = "Winchester", Name = "Winchester Large Rifle", Type = "Large Rifle", Notes = "Versatile primers for standard large rifle loadings." }
                };

                context.Primers.AddRange(primers);
                await context.SaveChangesAsync();
            }

            // 7.5 Seed Default Arsenal
            if (!await context.Arsenals.AnyAsync())
            {
                var defaultArsenal = new Arsenal
                {
                    Name = "Primary Arsenal",
                    Description = "Default system owner arsenal"
                };
                context.Arsenals.Add(defaultArsenal);
                await context.SaveChangesAsync();
            }

            var primaryArsenal = await context.Arsenals.FirstAsync(a => a.Name == "Primary Arsenal");

            // 8. Seed Armory Items (Chambered Armory!)
            if (!await context.ArmoryItems.AnyAsync())
            {
                var armoryItems = new List<ArmoryItem>
                {
                    new ArmoryItem
                    {
                        Manufacturer = "Glock",
                        Model = "G19 Gen5",
                        Caliber = "9mm Luger",
                        BarrelLengthInches = 4.02m,
                        TwistRate = "1:9.84",
                        ActionType = "Semi-auto",
                        SerialNumber = "GDK1920485",
                        Notes = "Everyday carry pistol. Extremely reliable and compact.",
                        PurchasePrice = 549.99m,
                        PurchaseDate = DateTime.UtcNow.AddYears(-2),
                        CurrentValue = 499.00m,
                        Condition = "Excellent",
                        ImageUrl = "pistol",
                        RoundCount = 1450,
                        ArsenalId = primaryArsenal.Id
                    },
                    new ArmoryItem
                    {
                        Manufacturer = "Ruger",
                        Model = "Precision Rifle",
                        Caliber = "6.5 Creedmoor",
                        BarrelLengthInches = 24.0m,
                        TwistRate = "1:8",
                        ActionType = "Bolt Action",
                        SerialNumber = "RPR-65CM-908",
                        Notes = "Long range tactical precision rifle. Vortex Viper PST Gen II 5-25x50 mounted.",
                        PurchasePrice = 1399.00m,
                        PurchaseDate = DateTime.UtcNow.AddMonths(-18),
                        CurrentValue = 1200.00m,
                        Condition = "Very Good",
                        ImageUrl = "rifle",
                        RoundCount = 420,
                        ArsenalId = primaryArsenal.Id
                    },
                    new ArmoryItem
                    {
                        Manufacturer = "Sig Sauer",
                        Model = "P365 XL",
                        Caliber = "9mm Luger",
                        BarrelLengthInches = 3.7m,
                        TwistRate = "1:10",
                        ActionType = "Semi-auto",
                        SerialNumber = "SIGXL365203",
                        Notes = "Summer deep-concealment pistol. Mounted with Holosun 507K.",
                        PurchasePrice = 599.99m,
                        PurchaseDate = DateTime.UtcNow.AddMonths(-6),
                        CurrentValue = 549.00m,
                        Condition = "Excellent",
                        ImageUrl = "pistol_compact",
                        RoundCount = 280,
                        ArsenalId = primaryArsenal.Id
                    },
                    new ArmoryItem
                    {
                        Manufacturer = "Winchester",
                        Model = "Model 70",
                        Caliber = ".308 Winchester",
                        BarrelLengthInches = 22.0m,
                        TwistRate = "1:10",
                        ActionType = "Bolt Action",
                        SerialNumber = "WIN70-80128",
                        Notes = "Classic hunting rifle. Wood stock, incredibly smooth action.",
                        PurchasePrice = 849.00m,
                        PurchaseDate = DateTime.UtcNow.AddYears(-5),
                        CurrentValue = 750.00m,
                        Condition = "Good",
                        ImageUrl = "rifle_wood",
                        RoundCount = 120,
                        ArsenalId = primaryArsenal.Id
                    }
                };

                context.ArmoryItems.AddRange(armoryItems);
                await context.SaveChangesAsync();
            }

            // 9. Seed Factory Ammunition catalog
            if (!await context.FactoryAmmo.AnyAsync())
            {
                var ammoList = new List<FactoryAmmo>
                {
                    new FactoryAmmo
                    {
                        ManufacturerId = winchester.Id,
                        CartridgeId = c9mm.Id,
                        ProjectileId = p9mm.Id,
                        BulletWeightGrains = 115m,
                        AdvertisedVelocityFps = 1190,
                        AdvertisedEnergyFtLbs = 362,
                        TestBarrelLengthInches = 4.0m,
                        Sku = "USA9MM",
                        Upc = "020892704153",
                        Notes = "Winchester USA 'White Box' general purpose ball ammo."
                    },
                    new FactoryAmmo
                    {
                        ManufacturerId = hornady.Id,
                        CartridgeId = c65.Id,
                        ProjectileId = p65.Id,
                        BulletWeightGrains = 140m,
                        AdvertisedVelocityFps = 2710,
                        AdvertisedEnergyFtLbs = 2283,
                        TestBarrelLengthInches = 24.0m,
                        Sku = "81500",
                        Upc = "090255815007",
                        Notes = "Hornady ELD Match. Elite precision competition factory ammunition."
                    }
                };

                context.FactoryAmmo.AddRange(ammoList);
                await context.SaveChangesAsync();
            }

            var win9mmAmmo = await context.FactoryAmmo.FirstAsync(f => f.Sku == "USA9MM");
            var horn65Ammo = await context.FactoryAmmo.FirstAsync(f => f.Sku == "81500");

            // 10. Seed Ammunition Lots (Chambered Munitions!)
            if (!await context.AmmoLots.AnyAsync())
            {
                var lots = new List<AmmoLot>
                {
                    new AmmoLot
                    {
                        CartridgeId = c9mm.Id,
                        FactoryAmmoId = win9mmAmmo.Id,
                        ProjectileId = win9mmAmmo.ProjectileId,
                        Quantity = 750, // 15 boxes
                        LotNumber = "W9-BX415",
                        DateLoaded = DateTime.UtcNow.AddMonths(-3),
                        Notes = "Factory ammo bought in bulk for plinking/training.",
                        ArsenalId = primaryArsenal.Id
                    },
                    new AmmoLot
                    {
                        CartridgeId = c65.Id,
                        FactoryAmmoId = horn65Ammo.Id,
                        ProjectileId = horn65Ammo.ProjectileId,
                        Quantity = 140, // 7 boxes
                        LotNumber = "H65-ELD140-5",
                        DateLoaded = DateTime.UtcNow.AddMonths(-1),
                        Notes = "Match factory loads, kept for target practice.",
                        ArsenalId = primaryArsenal.Id
                    },
                    new AmmoLot
                    {
                        CartridgeId = c65.Id,
                        ProjectileId = p65.Id,
                        PowderId = powH4350.Id,
                        PowderChargeGrains = 41.5m,
                        CartridgeOverallLength = 2.800m,
                        Quantity = 180, // Custom reloading batch
                        LotNumber = "RE-65-H4350-052",
                        DateLoaded = DateTime.UtcNow.AddDays(-10),
                        Notes = "Handloads. 41.5gr H4350, Lapua Brass, Federal 205M primer. Extremely tight groups!",
                        ArsenalId = primaryArsenal.Id
                    },
                    new AmmoLot
                    {
                        CartridgeId = c9mm.Id,
                        ProjectileId = p9mm.Id,
                        PowderId = powTitegroup.Id,
                        PowderChargeGrains = 4.2m,
                        CartridgeOverallLength = 1.125m,
                        Quantity = 300,
                        LotNumber = "RE-9-TITE-08",
                        DateLoaded = DateTime.UtcNow.AddDays(-5),
                        Notes = "Pistol practice handloads. Light recoil, very clean burn.",
                        ArsenalId = primaryArsenal.Id
                    }
                };

                context.AmmoLots.AddRange(lots);
                await context.SaveChangesAsync();
            }

            // 11. Seed a Sample API Key for demo
            var firstAdmin = await userManager.Users.FirstOrDefaultAsync();
            if (firstAdmin != null && !await context.ApiKeys.AnyAsync())
            {
                var token = "cham_demokey1234567890abcdefghijklm";
                var hash = ApiKeyAuthHandler.HashToken(token);
                context.ApiKeys.Add(new ApiKey
                {
                    Name = "Home Assistant Integration",
                    UserId = firstAdmin.Id,
                    TokenHash = hash,
                    TokenPreview = "cham_...jklm",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                });
                await context.SaveChangesAsync();
            }
        }
    }
}
