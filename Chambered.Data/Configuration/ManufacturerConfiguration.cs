using Chambered.Data.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Chambered.Data.Configuration
{
    /// <summary>
    /// Entity Framework Core Fluent API configuration for the <see cref="Manufacturer"/> entity.
    /// </summary>
    public class ManufacturerConfiguration : IEntityTypeConfiguration<Manufacturer>
    {
        public void Configure(EntityTypeBuilder<Manufacturer> builder)
        {
            builder.ToTable("Manufacturers");

            builder.HasKey(m => m.Id);

            builder.Property(m => m.Name)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(m => m.WebPageUrl)
                .HasMaxLength(2048);

            builder.Property(m => m.PhoneNumber)
                .HasMaxLength(30);

            builder.Property(m => m.StreetAddress)
                .HasMaxLength(200);

            builder.Property(m => m.City)
                .HasMaxLength(100);

            builder.Property(m => m.StateOrProvince)
                .HasMaxLength(100);

            builder.Property(m => m.PostalCode)
                .HasMaxLength(20);

            builder.Property(m => m.Country)
                .HasMaxLength(100);

            builder.HasData(
                new Manufacturer
                {
                    Id = 1,
                    Name = "Glock",
                    WebPageUrl = "https://us.glock.com",
                    PhoneNumber = "770-432-1202",
                    StreetAddress = "6000 Highlands Pkwy SE",
                    City = "Smyrna",
                    StateOrProvince = "GA",
                    PostalCode = "30082",
                    Country = "United States"
                },
                new Manufacturer
                {
                    Id = 2,
                    Name = "Sturm, Ruger & Co.",
                    WebPageUrl = "https://ruger.com",
                    PhoneNumber = "336-949-5200",
                    StreetAddress = "1 Lacey Place",
                    City = "Southport",
                    StateOrProvince = "CT",
                    PostalCode = "06890",
                    Country = "United States"
                },
                new Manufacturer
                {
                    Id = 3,
                    Name = "Sig Sauer",
                    WebPageUrl = "https://www.sigsauer.com",
                    PhoneNumber = "603-610-3000",
                    StreetAddress = "72 Pease Boulevard",
                    City = "Newington",
                    StateOrProvince = "NH",
                    PostalCode = "03801",
                    Country = "United States"
                },
                new Manufacturer
                {
                    Id = 4,
                    Name = "Smith & Wesson",
                    WebPageUrl = "https://www.smith-wesson.com",
                    PhoneNumber = "800-331-0852",
                    StreetAddress = "1800 Maryville Pike",
                    City = "Maryville",
                    StateOrProvince = "TN",
                    PostalCode = "37801",
                    Country = "United States"
                },
                new Manufacturer
                {
                    Id = 5,
                    Name = "Daniel Defense",
                    WebPageUrl = "https://danieldefense.com",
                    PhoneNumber = "866-554-4867",
                    StreetAddress = "101 Warfighter Way",
                    City = "Black Creek",
                    StateOrProvince = "GA",
                    PostalCode = "31308",
                    Country = "United States"
                },
                new Manufacturer
                {
                    Id = 6,
                    Name = "Springfield Armory",
                    WebPageUrl = "https://www.springfield-armory.com",
                    PhoneNumber = "800-680-6866",
                    StreetAddress = "420 West Main Street",
                    City = "Geneseo",
                    StateOrProvince = "IL",
                    PostalCode = "61254",
                    Country = "United States"
                },
                new Manufacturer
                {
                    Id = 7,
                    Name = "Beretta",
                    WebPageUrl = "https://www.beretta.com",
                    PhoneNumber = "800-237-3882",
                    StreetAddress = "17601 Beretta Drive",
                    City = "Accokeek",
                    StateOrProvince = "MD",
                    PostalCode = "20607",
                    Country = "United States"
                },
                new Manufacturer
                {
                    Id = 8,
                    Name = "CZ-USA",
                    WebPageUrl = "https://cz-usa.com",
                    PhoneNumber = "800-955-4486",
                    StreetAddress = "P.O. Box 171073",
                    City = "Kansas City",
                    StateOrProvince = "KS",
                    PostalCode = "66117",
                    Country = "United States"
                }
            );
        }
    }
}
