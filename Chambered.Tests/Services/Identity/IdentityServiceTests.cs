using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Chambered.Core.Services.Identity.Dto;
using Chambered.Data;
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
    /// Contains unit tests for the <see cref="IdentityService"/> class.
    /// </summary>
    public class IdentityServiceTests : IDisposable
    {
        private readonly SqliteConnection _connection;
        private readonly ChamberedDbContext _db;
        private readonly Mock<UserManager<ChamberedUser>> _userManagerMock;
        private readonly Mock<ILogger<IdentityService>> _loggerMock;
        private readonly IdentityService _identityService;

        public IdentityServiceTests()
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

            _loggerMock = new Mock<ILogger<IdentityService>>();
            _identityService = new IdentityService(_userManagerMock.Object, _db, _loggerMock.Object);
        }

        [Fact]
        public async Task CreateUserAsync_ShouldInvokeUserManager()
        {
            // Arrange
            var createDto = new CreateUserRequestDto(
                "john@test.com", "John", "Doe",
                new List<string> { "User" }
            );

            _userManagerMock.Setup(u => u.CreateAsync(It.IsAny<ChamberedUser>(), It.IsAny<string>()))
                .ReturnsAsync(IdentityResult.Success)
                .Callback<ChamberedUser, string>((user, password) => user.Id = "new-user-id");

            _userManagerMock.Setup(u => u.AddToRolesAsync(It.IsAny<ChamberedUser>(), createDto.Roles))
                .ReturnsAsync(IdentityResult.Success);

            // Act
            var result = await _identityService.CreateUserAsync(createDto);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("new-user-id", result.Id);
            Assert.Equal(createDto.Email, result.Email);
            _userManagerMock.Verify(u => u.CreateAsync(It.IsAny<ChamberedUser>(), It.IsAny<string>()), Times.Once);
        }

        [Fact]
        public async Task GetUserByIdAsync_ShouldReturnUserDetailsWithRoles()
        {
            // Arrange
            var userId = "user-123";
            var user = new ChamberedUser
            {
                Id = userId,
                Email = "john@test.com",
                FirstName = "John",
                LastName = "Doe",
                UserName = "john@test.com"
            };

            _userManagerMock.Setup(u => u.FindByIdAsync(userId))
                .ReturnsAsync(user);

            _userManagerMock.Setup(u => u.GetRolesAsync(user))
                .ReturnsAsync(new List<string> { "User", "Admin" });

            // Act
            var result = await _identityService.GetUserByIdAsync(userId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(userId, result.Id);
            Assert.Contains("User", result.Roles);
            Assert.Contains("Admin", result.Roles);
        }

        public void Dispose()
        {
            _db.Dispose();
            _connection.Dispose();
        }
    }
}
