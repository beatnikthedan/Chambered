using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Text;
using System.Text.Encodings.Web;
using System.Threading.Tasks;
using Chambered.Core.Security;
using Chambered.Core.Utility;
using Chambered.Data;
using Chambered.Data.Models;
using Chambered.Infrastructure.Authorization;
using Chambered.Infrastructure.Security;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace Chambered.Tests.Security
{
    /// <summary>
    /// Isolated unit and integration tests for the custom dynamic authorization handlers, permission policies, and secure API Key authentication handler.
    /// </summary>
    public class SecurityHandlerTests : IDisposable
    {
        private readonly SqliteConnection _connection;
        private readonly ChamberedDbContext _db;

        public SecurityHandlerTests()
        {
            _connection = new SqliteConnection("Filename=:memory:");
            _connection.Open();

            var options = new DbContextOptionsBuilder<ChamberedDbContext>()
                .UseSqlite(_connection)
                .Options;

            _db = new ChamberedDbContext(options);
            _db.Database.EnsureCreated();
        }

        public void Dispose()
        {
            _db.Dispose();
            _connection.Close();
            _connection.Dispose();
        }

        [Fact]
        public async Task PermissionAuthorizationHandler_ShouldSucceed_ForAdminRole()
        {
            // Arrange
            var handler = new PermissionAuthorizationHandler();
            var requirement = new PermissionRequirement(ChamberedAuthorization.Permissions.VaultCreate);

            // User belongs to Admin role
            var claims = new[] { new Claim(ClaimTypes.Role, ChamberedAuthorization.Roles.Admin) };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var principal = new ClaimsPrincipal(identity);

            var context = new AuthorizationHandlerContext(new[] { requirement }, principal, null);

            // Act
            await handler.HandleAsync(context);

            // Assert
            Assert.True(context.HasSucceeded);
        }

        [Fact]
        public async Task PermissionAuthorizationHandler_ShouldSucceed_WithGranularPermissionClaim()
        {
            // Arrange
            var handler = new PermissionAuthorizationHandler();
            var requirement = new PermissionRequirement(ChamberedAuthorization.Permissions.VaultCreate);

            // User has granular permission claim
            var claims = new[] { new Claim(ChamberedAuthorization.PermissionClaimType, ChamberedAuthorization.Permissions.VaultCreate) };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var principal = new ClaimsPrincipal(identity);

            var context = new AuthorizationHandlerContext(new[] { requirement }, principal, null);

            // Act
            await handler.HandleAsync(context);

            // Assert
            Assert.True(context.HasSucceeded);
        }

        [Fact]
        public async Task PermissionAuthorizationHandler_ShouldFail_WithoutRequiredClaims()
        {
            // Arrange
            var handler = new PermissionAuthorizationHandler();
            var requirement = new PermissionRequirement(ChamberedAuthorization.Permissions.VaultCreate);

            // User lacks permission and is NOT admin
            var claims = new[] { new Claim(ClaimTypes.Role, "StandardUser") };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var principal = new ClaimsPrincipal(identity);

            var context = new AuthorizationHandlerContext(new[] { requirement }, principal, null);

            // Act
            await handler.HandleAsync(context);

            // Assert
            Assert.False(context.HasSucceeded);
        }

        [Fact]
        public async Task ApiKeyAuthenticationHandler_ShouldAuthenticate_ValidApiKey()
        {
            // Arrange
            // 1. Generate a real API key and hash it
            string rawKey = "test_api_key_abc_123";
            string hashedKey = ApiKeyGenerator.HashKey(rawKey);

            var keyRecord = new ApiKey
            {
                Id = 1,
                KeyHash = hashedKey,
                Name = "Unit Test Key",
                OwnerId = "admin-user-id",
                IsRevoked = false,
                ExpiresAt = DateTime.UtcNow.AddDays(1),
                CreatedAt = DateTime.UtcNow,
                Claims = new List<ApiKeyClaim>
                {
                    new ApiKeyClaim
                    {
                        Id = 11,
                        Type = ChamberedAuthorization.PermissionClaimType,
                        Value = ChamberedAuthorization.Permissions.ArsenalView
                    }
                }
            };

            _db.Set<ApiKey>().Add(keyRecord);
            await _db.SaveChangesAsync();

            // 2. Setup standard authentication handler constructor arguments
            var optionsMonitorMock = new Mock<IOptionsMonitor<AuthenticationSchemeOptions>>();
            optionsMonitorMock.Setup(x => x.Get(It.IsAny<string>()))
                .Returns(new AuthenticationSchemeOptions());

            var loggerMock = new Mock<ILogger<ApiKeyAuthenticationHandler>>();
            var loggerFactoryMock = new Mock<ILoggerFactory>();
            loggerFactoryMock.Setup(x => x.CreateLogger(It.IsAny<string>()))
                .Returns(loggerMock.Object);

            var handler = new ApiKeyAuthenticationHandler(
                optionsMonitorMock.Object,
                loggerFactoryMock.Object,
                UrlEncoder.Default,
                _db
            );

            // 3. Mock dynamic HttpContext with custom headers
            var httpContext = new DefaultHttpContext();
            httpContext.Request.Headers["X-API-KEY"] = rawKey;

            // Initialize the schemes inside authentication handler context
            var scheme = new AuthenticationScheme("ApiKey", "ApiKey", typeof(ApiKeyAuthenticationHandler));
            await handler.InitializeAsync(scheme, httpContext);

            // Act
            var result = await handler.AuthenticateAsync();

            // Assert
            Assert.NotNull(result);
            Assert.True(result.Succeeded);
            Assert.NotNull(result.Principal);
            
            // Check that claims parsed cleanly from database key configuration
            Assert.True(result.Principal.HasClaim(ChamberedAuthorization.PermissionClaimType, ChamberedAuthorization.Permissions.ArsenalView));
            Assert.True(result.Principal.HasClaim(ClaimTypes.NameIdentifier, "admin-user-id"));
        }

        [Fact]
        public async Task ApiKeyAuthenticationHandler_ShouldFail_ForRevokedApiKey()
        {
            // Arrange
            string rawKey = "revoked_key";
            string hashedKey = ApiKeyGenerator.HashKey(rawKey);

            var keyRecord = new ApiKey
            {
                Id = 2,
                KeyHash = hashedKey,
                Name = "Revoked Test Key",
                IsRevoked = true, // REVOKED!
                ExpiresAt = DateTime.UtcNow.AddDays(1),
                CreatedAt = DateTime.UtcNow
            };

            _db.Set<ApiKey>().Add(keyRecord);
            await _db.SaveChangesAsync();

            var optionsMonitorMock = new Mock<IOptionsMonitor<AuthenticationSchemeOptions>>();
            optionsMonitorMock.Setup(x => x.Get(It.IsAny<string>()))
                .Returns(new AuthenticationSchemeOptions());

            var loggerMock = new Mock<ILogger<ApiKeyAuthenticationHandler>>();
            var loggerFactoryMock = new Mock<ILoggerFactory>();
            loggerFactoryMock.Setup(x => x.CreateLogger(It.IsAny<string>()))
                .Returns(loggerMock.Object);

            var handler = new ApiKeyAuthenticationHandler(
                optionsMonitorMock.Object,
                loggerFactoryMock.Object,
                UrlEncoder.Default,
                _db
            );

            var httpContext = new DefaultHttpContext();
            httpContext.Request.Headers["X-API-KEY"] = rawKey;

            var scheme = new AuthenticationScheme("ApiKey", "ApiKey", typeof(ApiKeyAuthenticationHandler));
            await handler.InitializeAsync(scheme, httpContext);

            // Act
            var result = await handler.AuthenticateAsync();

            // Assert
            Assert.NotNull(result);
            Assert.False(result.Succeeded);
        }
    }
}
