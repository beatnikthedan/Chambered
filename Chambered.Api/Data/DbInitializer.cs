using Chambered.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Chambered.Api.Data
{
    public static class DbInitializer
    {
        public static async Task InitializeAsync(IServiceProvider serviceProvider)
        {
            using var context = serviceProvider.GetRequiredService<ChamberedDbContext>();
            var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();

            // Ensure database is created (this triggers EF Core Fluent API .HasData() configurations!)
            await context.Database.EnsureCreatedAsync();


            // 1. Seed Roles
            string adminRole = "Admin";
            string userRole = "User";

            if (!await roleManager.RoleExistsAsync(adminRole))
                await roleManager.CreateAsync(new IdentityRole(adminRole));
            if (!await roleManager.RoleExistsAsync(userRole))
                await roleManager.CreateAsync(new IdentityRole(userRole));



            // 3. Seed default Products (PewPews) programmatically if none exist
            //if (!await context.Products.AnyAsync())
            //{
            //    context.Products.Add(new PewPew
            //    {
            //        ManufacturerId = 2,
            //        CaliberId = 11,
            //        Model = "10/22 Carbine",
            //        PartNumber = "1103",
            //        Sku = "1103",
            //        PewPewCategory = Chambered.Data.Enums.PewPewCategory.Rimfire,
            //        ActionType = Chambered.Data.Enums.ActionType.SemiAutomatic,
            //        WebPageUrl = "https://ruger.com/products/1022Carbine/models.html"
            //    });

            //    context.Products.Add(new PewPew
            //    {
            //        ManufacturerId = 1,
            //        CaliberId = 1,
            //        Model = "19 Gen 5",
            //        PartNumber = "PA1950203",
            //        Sku = "PA1950203",
            //        PewPewCategory = Chambered.Data.Enums.PewPewCategory.Handgun,
            //        ActionType = Chambered.Data.Enums.ActionType.SemiAutomatic,
            //        WebPageUrl = "https://us.glock.com/en/pistols/g19-gen5"
            //    });

            //    await context.SaveChangesAsync();
            //}

            // 4. Self-heal and fix legacy/orphan records with missing ArsenalIds
            var defaultArsenal = await context.Arsenals.FirstOrDefaultAsync();
            if (defaultArsenal != null)
            {
                var orphanItems = await context.ArmoryItems.Where(i => i.ArsenalId == null).ToListAsync();
                if (orphanItems.Any())
                {
                    foreach (var item in orphanItems)
                    {
                        item.ArsenalId = defaultArsenal.Id;
                    }
                }

                var orphanVaults = await context.Vaults.Where(v => v.ArsenalId == null).ToListAsync();
                if (orphanVaults.Any())
                {
                    foreach (var vault in orphanVaults)
                    {
                        vault.ArsenalId = defaultArsenal.Id;
                    }
                }

                await context.SaveChangesAsync();
            }
        }
    }
}
