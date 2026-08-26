using BeatnikToolKit.EntityFramework.Services.Identity;
using BeatnikToolKit.EntityFramework.Services.Identity.Dto;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;

namespace Chambered.Tests.Services.Identity
{
    /// <summary>
    /// Contains unit tests for the <see cref="IdentityService"/> class.
    /// </summary>
    public class IdentityServiceTests : IDisposable
    {
        private readonly SqliteConnection _connection;
        private readonly IdentityDbContext<IdentityUser> _db;
        private readonly Mock<UserManager<IdentityUser>> _userManagerMock;
        private readonly Mock<ILogger<IdentityService<IdentityDbContext<IdentityUser>, IdentityUser>>> _loggerMock;
        private readonly IdentityService<IdentityDbContext<IdentityUser>, IdentityUser> _identityService;

        /// <summary>
        /// Initializes a new instance of the <see cref="IdentityServiceTests"/> class.
        /// </summary>
        public IdentityServiceTests()
        {
            _connection = new SqliteConnection("Filename=:memory:");
            _connection.Open();

            var options = new DbContextOptionsBuilder<IdentityDbContext<IdentityUser>>().UseSqlite(_connection).Options;

            _db = new IdentityDbContext<IdentityUser>(options);
            _db.Database.EnsureCreated();

            var userStoreMock = new Mock<IUserStore<IdentityUser>>();
            _userManagerMock = new Mock<UserManager<IdentityUser>>(
                userStoreMock.Object, null, null, null, null, null, null, null, null);

            _loggerMock = new Mock<ILogger<IdentityService<IdentityDbContext<IdentityUser>, IdentityUser>>>();
            _identityService = new IdentityService<IdentityDbContext<IdentityUser>, IdentityUser> (_userManagerMock.Object, _db, _loggerMock.Object);
        }

        /// <summary>
        /// Verifies that CreateUserAsync successfully invokes UserManager methods to create the user and add roles.
        /// </summary>
        [Fact]
        public async Task CreateUserAsync_ShouldInvokeUserManager()
        {
            var createDto = new CreateUserRequestDto(
                "john@test.com",
                new List<string> { "User" }
            );

            _userManagerMock.Setup(u => u.CreateAsync(It.IsAny<IdentityUser>(), It.IsAny<string>()))
                .ReturnsAsync(IdentityResult.Success)
                .Callback<IdentityUser, string>((user, password) => user.Id = "new-user-id");

            _userManagerMock.Setup(u => u.AddToRolesAsync(It.IsAny<IdentityUser>(), createDto.Roles))
                .ReturnsAsync(IdentityResult.Success);

            var result = await _identityService.CreateUserAsync(createDto);

            Assert.NotNull(result);
            Assert.Equal("new-user-id", result.Id);
            Assert.Equal(createDto.Email, result.Email);
            _userManagerMock.Verify(u => u.CreateAsync(It.IsAny<IdentityUser>(), It.IsAny<string>()), Times.Once);
        }

        /// <summary>
        /// Verifies that GetUserByIdAsync successfully returns the user details with associated role names.
        /// </summary>
        [Fact]
        public async Task GetUserByIdAsync_ShouldReturnUserDetailsWithRoles()
        {
            var userId = "user-123";
            var user = new IdentityUser
            {
                Id = userId,
                Email = "john@test.com",
                UserName = "john@test.com"
            };

            _userManagerMock.Setup(u => u.FindByIdAsync(userId))
                .ReturnsAsync(user);

            _userManagerMock.Setup(u => u.GetRolesAsync(user))
                .ReturnsAsync(new List<string> { "User", "Admin" });

            var result = await _identityService.GetUserByIdAsync(userId);

            Assert.NotNull(result);
            Assert.Equal(userId, result.Id);
            Assert.Contains("User", result.Roles);
            Assert.Contains("Admin", result.Roles);
        }

        /// <summary>
        /// Disposes standard database resources.
        /// </summary>
        public void Dispose()
        {
            _db.Dispose();
            _connection.Dispose();
        }
    }
}
