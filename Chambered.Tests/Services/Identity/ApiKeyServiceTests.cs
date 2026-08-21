using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Chambered.Core.Services.Identity.Dto;
using Chambered.Data;
using Chambered.Data.Models;
using Chambered.Infrastructure.Services.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace Chambered.Tests.Services.Identity
{
    /// <summary>
    /// Contains unit tests for the <see cref="ApiKeyService"/> class.
    /// </summary>
    public class ApiKeyServiceTests : IDisposable
    {
        private readonly SqliteConnection _connection;
        private readonly ChamberedDbContext _db;
        private readonly Mock<UserManager<ChamberedUser>> _userManagerMock;
        private readonly Mock<ILogger<ApiKeyService>> _loggerMock;
        private readonly ApiKeyService _apiKeyService;

        public ApiKeyServiceTests()
        {
            _connection = new SqliteConnection("Filename=:memory:");
            _connection.Open();

            var options = new DbContextOptionsBuilder<ChamberedDbContext>()
                .UseSqlite(_connection)
                .Options;

            _db = new ChamberedDbContext(options);
            _db.Database.EnsureCreated();

            var userStoreMock = new Mock<IUserStore<ChamberedUser>>();
            _userManagerMock = new Mock<UserManager<ChamberedUser>>(
                userStoreMock.Object, null, null, null, null, null, null, null, null);

            _loggerMock = new Mock<ILogger<ApiKeyService>>();
            _apiKeyService = new ApiKeyService(_db, _userManagerMock.Object, _loggerMock.Object);
        }

        [Fact]
        public async Task CreateKeyAsync_ShouldSaveNewKeyAndReturnDetails()
        {
            // Arrange
            var user = new ChamberedUser { Id = "user-123", Email = "user@test.com", UserName = "user@test.com" };
            var claimsPrincipal = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, "user-123"),
                new Claim(ClaimTypes.Role, "Admin")
            }));

            var createDto = new CreateApiKeyDto("Test Key", DateTime.UtcNow.AddDays(30), new List<string> { "Read", "Write" }, null);

            _userManagerMock.Setup(u => u.GetUserAsync(claimsPrincipal))
                .ReturnsAsync(user);

            _userManagerMock.Setup(u => u.GetUserId(claimsPrincipal))
                .Returns("user-123");

            // Act
            var result = await _apiKeyService.CreateKeyAsync(createDto, claimsPrincipal);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("Test Key", result.Name);
            Assert.NotEmpty(result.PlainTextKey);

            var savedKey = _db.ApiKeys.Include(k => k.Claims).FirstOrDefault(k => k.Name == "Test Key");
            Assert.NotNull(savedKey);
            Assert.Equal("Test Key", savedKey.Name);
            Assert.Equal(2, savedKey.Claims.Count);
        }

        [Fact]
        public async Task GetKeysForUserAsync_ShouldReturnActiveKeysForOwner()
        {
            // Arrange
            var claimsPrincipal = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, "user-123")
            }));

            var apiKey = new ApiKey
            {
                Id = 1,
                Name = "Key 1",
                OwnerId = "user-123",
                IsRevoked = false,
                KeyHash = "somehash",
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddDays(1)
            };

            _db.ApiKeys.Add(apiKey);
            await _db.SaveChangesAsync();

            _userManagerMock.Setup(u => u.GetUserId(claimsPrincipal))
                .Returns("user-123");

            // Act
            var result = await _apiKeyService.GetKeysForUserAsync(claimsPrincipal);

            // Assert
            Assert.NotNull(result);
            Assert.Single(result);
            Assert.Equal("Key 1", result.First().Name);
        }

        [Fact]
        public async Task RevokeKeyAsync_ShouldDeactivateKey_WhenKeyExists()
        {
            // Arrange
            var claimsPrincipal = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, "user-123")
            }));

            var apiKey = new ApiKey
            {
                Id = 1,
                Name = "Test Key",
                OwnerId = "user-123",
                IsRevoked = false,
                KeyHash = "somehash",
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddDays(1)
            };

            _db.ApiKeys.Add(apiKey);
            await _db.SaveChangesAsync();

            _userManagerMock.Setup(u => u.GetUserId(claimsPrincipal))
                .Returns("user-123");

            // Act
            var result = await _apiKeyService.RevokeKeyAsync(1, claimsPrincipal);

            // Assert
            Assert.True(result);
            var updatedKey = _db.ApiKeys.FirstOrDefault(k => k.Id == 1);
            Assert.NotNull(updatedKey);
            Assert.True(updatedKey.IsRevoked);
        }

        public void Dispose()
        {
            _db.Dispose();
            _connection.Dispose();
        }
    }
}
