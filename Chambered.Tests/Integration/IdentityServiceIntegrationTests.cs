using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Chambered.Core.Services.Identity.Dto;
using Chambered.Data;
using Chambered.Infrastructure.Extensions;
using Chambered.Infrastructure.Services.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
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

        public IdentityServiceIntegrationTests()
        {
            // Set up a real isolated SQLite in-memory connection
            _connection = new SqliteConnection("Filename=:memory:");
            _connection.Open();

            var services = new ServiceCollection();

            // 1. Register Logging
            services.AddLogging(builder => builder.AddConsole());

            // 2. Register real EF Core context on open SQLite connection
            services.AddDbContext<ChamberedDbContext>(options =>
                options.UseSqlite(_connection));

            // 3. Register standard Identity services
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

            // 4. Mock Configuration for JWT keys
            var inMemorySettings = new Dictionary<string, string?>
            {
                {"Jwt:Key", "AntigravitySuperSecureDevSecretKey123!"},
                {"Jwt:Issuer", "ChamberedServer"},
                {"Jwt:ExpireDays", "7"}
            };
            var configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(inMemorySettings)
                .Build();
            services.AddSingleton<IConfiguration>(configuration);

            // 5. Mock EmailService
            var mockEmailService = new Mock<Chambered.Core.Services.IEmailService>();
            mockEmailService.Setup(e => e.SendEmailAsync(
                It.IsAny<System.Net.Mail.MailMessage>(),
                It.IsAny<System.Threading.CancellationToken>()))
                .ReturnsAsync(true);
            services.AddSingleton(mockEmailService.Object);

            // HttpContextAccessor with a real DefaultHttpContext for Cookie writing support
            var httpContext = new Microsoft.AspNetCore.Http.DefaultHttpContext();
            var mockHttpContextAccessor = new Mock<Microsoft.AspNetCore.Http.IHttpContextAccessor>();
            mockHttpContextAccessor.Setup(h => h.HttpContext).Returns(httpContext);
            services.AddSingleton<Microsoft.AspNetCore.Http.IHttpContextAccessor>(mockHttpContextAccessor.Object);

            // 6. Register Services under test
            services.AddScoped<IdentityService>();
            services.AddScoped<AuthenticationService>();

            _serviceProvider = services.BuildServiceProvider();
            
            // Link HttpContext request services to the built service provider
            httpContext.RequestServices = _serviceProvider;

            _db = _serviceProvider.GetRequiredService<ChamberedDbContext>();

            // Ensure schema is fully generated
            _db.Database.EnsureCreated();
        }

        public void Dispose()
        {
            _serviceProvider.Dispose();
            _connection.Close();
            _connection.Dispose();
        }

        [Fact]
        public async Task CreateUserAsync_ShouldWriteAlphanumericUsernameToDatabase()
        {
            // Arrange
            // Seed database roles so the "Admin" role exists before adding the user
            await _serviceProvider.SeedIdentityData();

            var identityService = _serviceProvider.GetRequiredService<IdentityService>();
            var createDto = new CreateUserRequestDto(
                Email: "admin@chambered.com",
                Roles: new[] { "Admin" },
                Password: "Password123!",
                Username: "admin"
            );

            // Act
            var result = await identityService.CreateUserAsync(createDto);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("admin", result.Username);
            Assert.Equal("admin@chambered.com", result.Email);

            // Double check underlying database values directly
            var dbUser = await _db.Users.FirstOrDefaultAsync(u => u.Id == result.Id);
            Assert.NotNull(dbUser);
            Assert.Equal("admin", dbUser.UserName); // VERIFIES IT IS WRITTEN TO USERNAME
            Assert.Equal("admin@chambered.com", dbUser.Email);
        }

        [Fact]
        public async Task Seeding_And_LoginAsync_ShouldSucceedWithRealPasswordHashingAndClaims()
        {
            // Arrange
            var authenticationService = _serviceProvider.GetRequiredService<AuthenticationService>();
            var roleManager = _serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();

            // Configure Environment Variables for Seeding Extensions
            Environment.SetEnvironmentVariable("ADMIN_EMAIL", "admin@chambered.com");
            Environment.SetEnvironmentVariable("ADMIN_PASSWORD", "SecurePassword123!");

            // 1. Seed dynamic roles and permissions
            await _serviceProvider.SeedIdentityData();

            // 2. Seed administrative user dynamically using the new seeding extension
            await _serviceProvider.SeedAdminUser();

            // Act
            var loginRequest = new LoginRequestDto("admin", "SecurePassword123!", false);
            var loginResult = await authenticationService.LoginAsync(loginRequest);

            // Assert
            Assert.NotNull(loginResult);
            Assert.Equal("admin", loginResult.Username);
            Assert.Empty(loginResult.AccessToken);
            Assert.Contains("Admin", loginResult.Roles);

            // Verify claims assigned to the role
            var role = await roleManager.FindByNameAsync("Admin");
            Assert.NotNull(role);
            var roleClaims = await roleManager.GetClaimsAsync(role);
            Assert.NotEmpty(roleClaims);
            Assert.Contains(roleClaims, c => c.Value == "vault:create");
        }
    }
}
