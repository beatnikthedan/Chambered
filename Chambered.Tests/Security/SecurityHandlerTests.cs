using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Text.Encodings.Web;
using System.Threading.Tasks;
using Chambered.Core.Security;
using Chambered.Infrastructure.Services.Identity;
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
    /// Contains unit and integration tests for security authorization handlers.
    /// </summary>
    public class SecurityHandlerTests : IDisposable
    {
        private readonly SqliteConnection _connection;
        private readonly ChamberedDbContext _db;

        /// <summary>
        /// Initializes a new instance of the <see cref="SecurityHandlerTests"/> class.
        /// </summary>
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

        /// <summary>
        /// Verifies that the PermissionAuthorizationHandler successfully authorizes a user belonging to the Admin role.
        /// </summary>
        [Fact]
        public async Task PermissionAuthorizationHandler_ShouldSucceed_ForAdminRole()
        {
            var handler = new PermissionAuthorizationHandler(new ChamberedRulebook());
            var requirement = new PermissionRequirement(ChamberedRulebook.Permissions.VaultCreate);

            var claims = new[] { new Claim(ClaimTypes.Role, ChamberedRulebook.Roles.Admin) };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var principal = new ClaimsPrincipal(identity);

            var context = new AuthorizationHandlerContext(new[] { requirement }, principal, null);

            await handler.HandleAsync(context);

            Assert.True(context.HasSucceeded);
        }

        /// <summary>
        /// Verifies that the PermissionAuthorizationHandler successfully authorizes a user having the direct target granular permission claim.
        /// </summary>
        [Fact]
        public async Task PermissionAuthorizationHandler_ShouldSucceed_WithGranularPermissionClaim()
        {
            var handler = new PermissionAuthorizationHandler(new ChamberedRulebook());
            var requirement = new PermissionRequirement(ChamberedRulebook.Permissions.VaultCreate);

            var claims = new[] { new Claim(ChamberedRulebook.PermissionClaimTypeConstant, ChamberedRulebook.Permissions.VaultCreate) };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var principal = new ClaimsPrincipal(identity);

            var context = new AuthorizationHandlerContext(new[] { requirement }, principal, null);

            await handler.HandleAsync(context);

            Assert.True(context.HasSucceeded);
        }

        /// <summary>
        /// Verifies that the PermissionAuthorizationHandler fails authorization when the user lacks required permission claims and roles.
        /// </summary>
        [Fact]
        public async Task PermissionAuthorizationHandler_ShouldFail_WithoutRequiredClaims()
        {
            var handler = new PermissionAuthorizationHandler(new ChamberedRulebook());
            var requirement = new PermissionRequirement(ChamberedRulebook.Permissions.VaultCreate);

            var claims = new[] { new Claim(ClaimTypes.Role, "StandardUser") };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var principal = new ClaimsPrincipal(identity);

            var context = new AuthorizationHandlerContext(new[] { requirement }, principal, null);

            await handler.HandleAsync(context);

            Assert.False(context.HasSucceeded);
        }

        /// <summary>
        /// Verifies that the ApiKeyAuthenticationHandler successfully authenticates requests with a valid, non-expired API Key header.
        /// </summary>
        [Fact]
        public async Task ApiKeyAuthenticationHandler_ShouldAuthenticate_ValidApiKey()
        {
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
                        Type = ChamberedRulebook.PermissionClaimTypeConstant,
                        Value = ChamberedRulebook.Permissions.ArsenalView
                    }
                }
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

            var result = await handler.AuthenticateAsync();

            Assert.NotNull(result);
            Assert.True(result.Succeeded);
            Assert.NotNull(result.Principal);
            
            Assert.True(result.Principal.HasClaim(ChamberedRulebook.PermissionClaimTypeConstant, ChamberedRulebook.Permissions.ArsenalView));
            Assert.True(result.Principal.HasClaim(ClaimTypes.NameIdentifier, "admin-user-id"));
        }

        /// <summary>
        /// Verifies that the ApiKeyAuthenticationHandler fails to authenticate requests with a revoked API Key.
        /// </summary>
        [Fact]
        public async Task ApiKeyAuthenticationHandler_ShouldFail_ForRevokedApiKey()
        {
            string rawKey = "revoked_key";
            string hashedKey = ApiKeyGenerator.HashKey(rawKey);

            var keyRecord = new ApiKey
            {
                Id = 2,
                KeyHash = hashedKey,
                Name = "Revoked Test Key",
                IsRevoked = true,
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

            var result = await handler.AuthenticateAsync();

            Assert.NotNull(result);
            Assert.False(result.Succeeded);
        }

        /// <summary>
        /// Disposes standard active database resources.
        /// </summary>
        public void Dispose()
        {
            _db.Dispose();
            _connection.Close();
            _connection.Dispose();
        }
    }
}
