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
                    Name = "Unknown",
                    WebPageUrl = "",
                    PhoneNumber = "",
                    StreetAddress = "",
                    City = "",
                    StateOrProvince = "",
                    PostalCode = "",
                    Country = ""
                },
                new Manufacturer
                {
                    Id = 2,
                    Name = "Generic",
                    WebPageUrl = "",
                    PhoneNumber = "",
                    StreetAddress = "",
                    City = "",
                    StateOrProvince = "",
                    PostalCode = "",
                    Country = ""
                },

                // Major Firearm Manufacturers
                new Manufacturer
                {
                    Id = 3,
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
                    Id = 4,
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
                    Id = 5,
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
                    Id = 6,
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
                    Id = 7,
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
                    Id = 8,
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
                    Id = 9,
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
                    Id = 10,
                    Name = "CZ-USA",
                    WebPageUrl = "https://cz-usa.com",
                    PhoneNumber = "800-955-4486",
                    StreetAddress = "P.O. Box 171073",
                    City = "Kansas City",
                    StateOrProvince = "KS",
                    PostalCode = "66117",
                    Country = "United States"
                },
                new Manufacturer
                {
                    Id = 11,
                    Name = "Colt's Manufacturing Company",
                    WebPageUrl = "https://www.colt.com",
                    PhoneNumber = "800-962-2658",
                    StreetAddress = "545 New Park Avenue",
                    City = "West Hartford",
                    StateOrProvince = "CT",
                    PostalCode = "06110",
                    Country = "United States"
                },
                new Manufacturer
                {
                    Id = 12,
                    Name = "FN America",
                    WebPageUrl = "https://fnamerica.com",
                    PhoneNumber = "800-635-1321",
                    StreetAddress = "797 Old Clemson Road",
                    City = "Columbia",
                    StateOrProvince = "SC",
                    PostalCode = "29229",
                    Country = "United States"
                },
                new Manufacturer
                {
                    Id = 13,
                    Name = "Heckler & Koch",
                    WebPageUrl = "https://hk-usa.com",
                    PhoneNumber = "703-450-1900",
                    StreetAddress = "5675 Transport Boulevard",
                    City = "Columbus",
                    StateOrProvince = "GA",
                    PostalCode = "31907",
                    Country = "United States"
                },
                new Manufacturer
                {
                    Id = 14,
                    Name = "O.F. Mossberg & Sons",
                    WebPageUrl = "https://www.mossberg.com",
                    PhoneNumber = "800-363-3555",
                    StreetAddress = "7 Grasso Avenue",
                    City = "North Haven",
                    StateOrProvince = "CT",
                    PostalCode = "06473",
                    Country = "United States"
                },
                new Manufacturer
                {
                    Id = 15,
                    Name = "Remington Arms",
                    WebPageUrl = "https://www.remarms.com",
                    PhoneNumber = "800-243-9700",
                    StreetAddress = "2502 Triana Boulevard SW",
                    City = "Huntsville",
                    StateOrProvince = "AL",
                    PostalCode = "35805",
                    Country = "United States"
                },
                new Manufacturer
                {
                    Id = 16,
                    Name = "Savage Arms",
                    WebPageUrl = "https://savagearms.com",
                    PhoneNumber = "800-370-0708",
                    StreetAddress = "100 Springdale Road",
                    City = "Westfield",
                    StateOrProvince = "MA",
                    PostalCode = "01085",
                    Country = "United States"
                },
                new Manufacturer
                {
                    Id = 17,
                    Name = "Walther Arms",
                    WebPageUrl = "https://waltherarms.com",
                    PhoneNumber = "479-242-8500",
                    StreetAddress = "7700 Chad Colley Boulevard",
                    City = "Fort Smith",
                    StateOrProvince = "AR",
                    PostalCode = "72916",
                    Country = "United States"
                },
                new Manufacturer
                {
                    Id = 18,
                    Name = "Taurus USA",
                    WebPageUrl = "https://www.taurususa.com",
                    PhoneNumber = "800-327-3776",
                    StreetAddress = "100 Taurus Way",
                    City = "Bainbridge",
                    StateOrProvince = "GA",
                    PostalCode = "39817",
                    Country = "United States"
                },
                new Manufacturer
                {
                    Id = 19,
                    Name = "Kimber Manufacturing",
                    WebPageUrl = "https://www.kimberamerica.com",
                    PhoneNumber = "888-243-4522",
                    StreetAddress = "200 Consumer Square Drive",
                    City = "Troy",
                    StateOrProvince = "AL",
                    PostalCode = "36081",
                    Country = "United States"
                },
                new Manufacturer
                {
                    Id = 20,
                    Name = "Barrett Firearms",
                    WebPageUrl = "https://barrett.net",
                    PhoneNumber = "615-896-2938",
                    StreetAddress = "P.O. Box 1077",
                    City = "Murfreesboro",
                    StateOrProvince = "TN",
                    PostalCode = "37133",
                    Country = "United States"
                },
                new Manufacturer
                {
                    Id = 21,
                    Name = "Palmetto State Armory",
                    WebPageUrl = "https://palmettostatearmory.com",
                    PhoneNumber = "803-724-6950",
                    StreetAddress = "3760 Fernandina Road",
                    City = "Columbia",
                    StateOrProvince = "SC",
                    PostalCode = "29210",
                    Country = "United States"
                },
                new Manufacturer
                {
                    Id = 22,
                    Name = "Aero Precision",
                    WebPageUrl = "https://www.aeroprecisionusa.com",
                    PhoneNumber = "253-272-8188",
                    StreetAddress = "2338 S Holgate St",
                    City = "Tacoma",
                    StateOrProvince = "WA",
                    PostalCode = "98402",
                    Country = "United States"
                },
                new Manufacturer
                {
                    Id = 23,
                    Name = "Bravo Company USA (BCM)",
                    WebPageUrl = "https://bravocompanyusa.com",
                    PhoneNumber = "800-551-8813",
                    StreetAddress = "P.O. Box 341",
                    City = "Hartford",
                    StateOrProvince = "WI",
                    PostalCode = "53027",
                    Country = "United States"
                },

                // Accessories, Optics, Lights & Components
                new Manufacturer
                {
                    Id = 24,
                    Name = "Magpul Industries",
                    WebPageUrl = "https://magpul.com",
                    PhoneNumber = "877-462-4785",
                    StreetAddress = "8226 Bee Caves Rd",
                    City = "Austin",
                    StateOrProvince = "TX",
                    PostalCode = "78746",
                    Country = "United States"
                },
                new Manufacturer
                {
                    Id = 25,
                    Name = "Vortex Optics",
                    WebPageUrl = "https://vortexoptics.com",
                    PhoneNumber = "800-486-7839",
                    StreetAddress = "One Vortex Drive",
                    City = "Barneveld",
                    StateOrProvince = "WI",
                    PostalCode = "53507",
                    Country = "United States"
                },
                new Manufacturer
                {
                    Id = 26,
                    Name = "Trijicon",
                    WebPageUrl = "https://www.trijicon.com",
                    PhoneNumber = "800-338-0563",
                    StreetAddress = "49385 Shafer Avenue",
                    City = "Wixom",
                    StateOrProvince = "MI",
                    PostalCode = "48393",
                    Country = "United States"
                },
                new Manufacturer
                {
                    Id = 27,
                    Name = "Holosun Technologies",
                    WebPageUrl = "https://holosun.com",
                    PhoneNumber = "909-594-2888",
                    StreetAddress = "821 Echelon Ct",
                    City = "City of Industry",
                    StateOrProvince = "CA",
                    PostalCode = "91744",
                    Country = "United States"
                },
                new Manufacturer
                {
                    Id = 28,
                    Name = "Leupold & Stevens",
                    WebPageUrl = "https://www.leupold.com",
                    PhoneNumber = "800-538-7653",
                    StreetAddress = "14400 NW Greenbrier Pkwy",
                    City = "Beaverton",
                    StateOrProvince = "OR",
                    PostalCode = "97006",
                    Country = "United States"
                },
                new Manufacturer
                {
                    Id = 29,
                    Name = "Aimpoint",
                    WebPageUrl = "https://www.aimpoint.com",
                    PhoneNumber = "844-246-7648",
                    StreetAddress = "7309 Gateway Court",
                    City = "Manassas",
                    StateOrProvince = "VA",
                    PostalCode = "20109",
                    Country = "United States"
                },
                new Manufacturer
                {
                    Id = 30,
                    Name = "Streamlight",
                    WebPageUrl = "https://www.streamlight.com",
                    PhoneNumber = "800-523-7488",
                    StreetAddress = "30 Eagleville Road",
                    City = "Eagleville",
                    StateOrProvince = "PA",
                    PostalCode = "19403",
                    Country = "United States"
                },
                new Manufacturer
                {
                    Id = 31,
                    Name = "SureFire",
                    WebPageUrl = "https://www.surefire.com",
                    PhoneNumber = "800-828-8809",
                    StreetAddress = "18300 Mt. Baldy Circle",
                    City = "Fountain Valley",
                    StateOrProvince = "CA",
                    PostalCode = "92708",
                    Country = "United States"
                },
                new Manufacturer
                {
                    Id = 32,
                    Name = "SilencerCo",
                    WebPageUrl = "https://silencerco.com",
                    PhoneNumber = "801-417-5384",
                    StreetAddress = "5511 S 6050 W",
                    City = "West Valley City",
                    StateOrProvince = "UT",
                    PostalCode = "84118",
                    Country = "United States"
                },
                new Manufacturer
                {
                    Id = 33,
                    Name = "Browning Arms Company",
                    WebPageUrl = "https://www.browning.com",
                    PhoneNumber = "801-876-2711",
                    StreetAddress = "One Browning Place",
                    City = "Morgan",
                    StateOrProvince = "UT",
                    PostalCode = "84050",
                    Country = "United States"
                },
                new Manufacturer
                {
                    Id = 34,
                    Name = "Hornady Manufacturing Company",
                    WebPageUrl = "https://www.hornady.com",
                    PhoneNumber = "800-338-3220",
                    StreetAddress = "3625 West Old Potash Highway",
                    City = "Grand Island",
                    StateOrProvince = "NE",
                    PostalCode = "68803",
                    Country = "United States"
                },
                new Manufacturer
                {
                    Id = 35,
                    Name = "Sierra Bullets, LLC",
                    WebPageUrl = "https://www.sierrabullets.com",
                    PhoneNumber = "800-223-8799",
                    StreetAddress = "1400 West Henry Street",
                    City = "Sedalia",
                    StateOrProvince = "MO",
                    PostalCode = "65301",
                    Country = "United States"
                },
                new Manufacturer
                {
                    Id = 36,
                    Name = "Nosler, Inc.",
                    WebPageUrl = "https://www.nosler.com",
                    PhoneNumber = "800-285-3701",
                    StreetAddress = "115 SW Columbia St",
                    City = "Bend",
                    StateOrProvince = "OR",
                    PostalCode = "97702",
                    Country = "United States"
                },
                new Manufacturer
                {
                    Id = 37,
                    Name = "Barnes Bullets, LLC",
                    WebPageUrl = "https://www.barnesbullets.com",
                    PhoneNumber = "800-574-9200",
                    StreetAddress = "38 North Frontage Road",
                    City = "Mona",
                    StateOrProvince = "UT",
                    PostalCode = "84645",
                    Country = "United States"
                },
                new Manufacturer
                {
                    Id = 38,
                    Name = "Berger Bullets",
                    WebPageUrl = "https://www.bergerbullets.com",
                    PhoneNumber = "714-447-5422",
                    StreetAddress = "4042 S. 1875 W.",
                    City = "Salt Lake City",
                    StateOrProvince = "UT",
                    PostalCode = "84104",
                    Country = "United States"
                },
                new Manufacturer
                {
                    Id = 39,
                    Name = "Hodgdon Powder Company",
                    WebPageUrl = "https://www.hodgdon.com",
                    PhoneNumber = "913-362-9455",
                    StreetAddress = "6430 Vista Drive",
                    City = "Shawnee",
                    StateOrProvince = "KS",
                    PostalCode = "66218",
                    Country = "United States"
                },
                new Manufacturer
                {
                    Id = 40,
                    Name = "Alliant Powder",
                    WebPageUrl = "https://www.alliantpowder.com",
                    PhoneNumber = "800-276-9337",
                    StreetAddress = "900 Ehlen Drive",
                    City = "Anoka",
                    StateOrProvince = "MN",
                    PostalCode = "55303",
                    Country = "United States"
                },
                new Manufacturer
                {
                    Id = 41,
                    Name = "IMR Legendary Powders",
                    WebPageUrl = "https://www.imrpowder.com",
                    PhoneNumber = "913-362-9455",
                    StreetAddress = "6430 Vista Drive",
                    City = "Shawnee",
                    StateOrProvince = "KS",
                    PostalCode = "66218",
                    Country = "United States"
                },
                new Manufacturer
                {
                    Id = 42,
                    Name = "Vihtavuori",
                    WebPageUrl = "https://www.vihtavuori.com",
                    PhoneNumber = "",
                    StreetAddress = "",
                    City = "Vihtavuori",
                    StateOrProvince = "",
                    PostalCode = "",
                    Country = "Finland"
                },
                new Manufacturer
                {
                    Id = 43,
                    Name = "Federal Cartridge Company",
                    WebPageUrl = "https://www.federalpremium.com",
                    PhoneNumber = "800-379-1732",
                    StreetAddress = "900 Ehlen Drive",
                    City = "Anoka",
                    StateOrProvince = "MN",
                    PostalCode = "55303",
                    Country = "United States"
                },
                new Manufacturer
                {
                    Id = 44,
                    Name = "Olin Corporation",
                    WebPageUrl = "https://www.winchester.com",
                    PhoneNumber = "618-258-2000",
                    StreetAddress = "600 Powder Mill Road",
                    City = "East Alton",
                    StateOrProvince = "IL",
                    PostalCode = "62024",
                    Country = "United States"
                },
                new Manufacturer
                {
                    Id = 45,
                    Name = "Remington Arms Company, LLC",
                    WebPageUrl = "https://www.remarms.com",
                    PhoneNumber = "800-243-9700",
                    StreetAddress = "2502 Triana Boulevard SW",
                    City = "Huntsville",
                    StateOrProvince = "AL",
                    PostalCode = "35805",
                    Country = "United States"
                },
                new Manufacturer
                {
                    Id = 46,
                    Name = "Cascade Cartridge Inc. (CCI)",
                    WebPageUrl = "https://www.cci-ammunition.com",
                    PhoneNumber = "800-379-1732",
                    StreetAddress = "2299 Snake River Ave",
                    City = "Lewiston",
                    StateOrProvince = "ID",
                    PostalCode = "83501",
                    Country = "United States"
                },
                new Manufacturer
                {
                    Id = 47,
                    Name = "Speer",
                    WebPageUrl = "https://www.speer.com",
                    PhoneNumber = "800-379-1732",
                    StreetAddress = "2299 Snake River Ave",
                    City = "Lewiston",
                    StateOrProvince = "ID",
                    PostalCode = "83501",
                    Country = "United States"
                },
                new Manufacturer
                {
                    Id = 48,
                    Name = "Pan Metal Corporation (PMC)",
                    WebPageUrl = "https://www.pmcammo.com",
                    PhoneNumber = "888-762-7378",
                    StreetAddress = "PO Box 1678",
                    City = "Carson City",
                    StateOrProvince = "NV",
                    PostalCode = "89702",
                    Country = "United States"
                },
                new Manufacturer
                {
                    Id = 49,
                    Name = "Fiocchi of America, Inc.",
                    WebPageUrl = "https://www.fiocchiusa.com",
                    PhoneNumber = "417-449-1039",
                    StreetAddress = "6930 N Fremont Rd",
                    City = "Ozark",
                    StateOrProvince = "MO",
                    PostalCode = "65721",
                    Country = "United States"
                },
                new Manufacturer
                {
                    Id = 50,
                    Name = "Magpul Industries Corp.",
                    WebPageUrl = "https://magpul.com",
                    PhoneNumber = "877-462-4785",
                    StreetAddress = "8226 Bee Caves Rd",
                    City = "Austin",
                    StateOrProvince = "TX",
                    PostalCode = "78746",
                    Country = "United States"
                }

            );
        }
    }
}
