using BeatnikToolKit.EntityFramework.Services.Identity;
using BeatnikToolKit.EntityFramework.Services.Identity.Dto;
using BeatnikToolKit.Services;
using Chambered.Core.Security;
using Chambered.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using System;
using System.Collections.Generic;
using System.Net.Mail;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace Chambered.Tests.Integration
{
    /// <summary>
    /// Integration tests for IdentityService and AuthenticationService using a real SQLite in-memory database to isolate and verify password checks, username overrides, and role claim assignments.
    /// </summary>
    public class IdentityServiceIntegrationTests : IDisposable
    {
        private readonly SqliteConnection _connection;
        private readonly ServiceProvider _serviceProvider;
        private readonly ChamberedDbContext _db;

        /// <summary>
        /// Initializes a new instance of the <see cref="IdentityServiceIntegrationTests"/> class.
        /// </summary>
        public IdentityServiceIntegrationTests()
        {
            _connection = new SqliteConnection("Filename=:memory:");
            _connection.Open();

            var services = new ServiceCollection();

            services.AddLogging(builder => builder.AddConsole());

            services.AddDbContext<ChamberedDbContext>(options =>
                options.UseSqlite(_connection));

            services.AddIdentity<ChamberedUser, IdentityRole>(options =>
            {
                options.Password.RequireDigit = false;
                options.Password.RequiredLength = 6;
                options.Password.RequireNonAlphanumeric = false;
                options.Password.RequireUppercase = false;
                options.Password.RequireLowercase = false;
                options.User.RequireUniqueEmail = false;
            })
            .AddEntityFrameworkStores<ChamberedDbContext>()
            .AddDefaultTokenProviders();

            var inMemorySettings = new Dictionary<string, string?>
            {
                {"Jwt:Key", "AntigravitySuperSecureDevSecretKey123!"},
                {"Jwt:Issuer", "ChamberedServer"},
                {"Jwt:ExpireDays", "7"},
                {"ADMIN_EMAIL", "admin@chambered.com"},
                {"ADMIN_PASSWORD", "SecurePassword123!"}
            };
            var configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(inMemorySettings)
                .Build();
            services.AddSingleton<IConfiguration>(configuration);

            var mockEmailService = new Mock<IEmailService>();
            mockEmailService.Setup(e => e.SendEmailAsync(
                It.IsAny<MailMessage>(),
                It.IsAny<CancellationToken>()))
                .ReturnsAsync(true);
            services.AddSingleton(mockEmailService.Object);

            var httpContext = new Microsoft.AspNetCore.Http.DefaultHttpContext();
            var mockHttpContextAccessor = new Mock<Microsoft.AspNetCore.Http.IHttpContextAccessor>();
            mockHttpContextAccessor.Setup(h => h.HttpContext).Returns(httpContext);
            services.AddSingleton<Microsoft.AspNetCore.Http.IHttpContextAccessor>(mockHttpContextAccessor.Object);

            services.AddSingleton<IAuthorizationRulebook, ChamberedRulebook>();
            services.AddScoped<IdentityService<ChamberedDbContext, ChamberedUser>>();
            services.AddScoped<AuthenticationService<ChamberedUser>>();

            _serviceProvider = services.BuildServiceProvider();
            
            httpContext.RequestServices = _serviceProvider;

            _db = _serviceProvider.GetRequiredService<ChamberedDbContext>();

            _db.Database.EnsureCreated();
        }

        /// <summary>
        /// Verifies that CreateUserAsync successfully writes an alphanumeric username to the database.
        /// </summary>
        [Fact]
        public async Task CreateUserAsync_ShouldWriteAlphanumericUsernameToDatabase()
        {
            await _serviceProvider.SeedIdentityData<ChamberedDbContext, ChamberedUser>();

            var identityService = _serviceProvider.GetRequiredService<IdentityService<ChamberedDbContext, ChamberedUser>>();
            var createDto = new CreateUserRequestDto(
                Email: "admin@chambered.com",
                Roles: new[] { "Admin" },
                Password: "Password123!",
                Username: "admin"
            );

            var result = await identityService.CreateUserAsync(createDto);

            Assert.NotNull(result);
            Assert.Equal("admin", result.Username);
            Assert.Equal("admin@chambered.com", result.Email);

            var dbUser = await _db.Users.FirstOrDefaultAsync(u => u.Id == result.Id);
            Assert.NotNull(dbUser);
            Assert.Equal("admin", dbUser.UserName);
            Assert.Equal("admin@chambered.com", dbUser.Email);
        }

        /// <summary>
        /// Verifies that the seeding process and LoginAsync successfully run together using a real SQLite provider, authenticating the seeded admin user with correct roles.
        /// </summary>
        [Fact]
        public async Task Seeding_And_LoginAsync_ShouldSucceedWithRealPasswordHashingAndClaims()
        {
            var authenticationService = _serviceProvider.GetRequiredService<AuthenticationService<ChamberedUser>>();
            var roleManager = _serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();

            Environment.SetEnvironmentVariable("ADMIN_EMAIL", "admin@chambered.com");
            Environment.SetEnvironmentVariable("ADMIN_PASSWORD", "SecurePassword123!");

            await _serviceProvider.SeedIdentityData<ChamberedDbContext, ChamberedUser>();

            await _serviceProvider.SeedAdminUser<ChamberedDbContext, ChamberedUser>();

            var loginRequest = new LoginRequestDto("admin", "SecurePassword123!", false);
            var loginResult = await authenticationService.LoginAsync(loginRequest);

            Assert.NotNull(loginResult);
            Assert.Equal("admin", loginResult.Username);
            Assert.Empty(loginResult.AccessToken);
            Assert.Contains("Admin", loginResult.Roles);
        }

        /// <summary>
        /// Disposes standard SQLite in-memory connections and dependency container.
        /// </summary>
        public void Dispose()
        {
            _serviceProvider.Dispose();
            _connection.Close();
            _connection.Dispose();
        }
    }
}
