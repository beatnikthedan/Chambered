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
        /// Verifies that GetAllUsersAsync successfully lists all database users with their roles mapped.
        /// </summary>
        [Fact]
        public async Task GetAllUsersAsync_ShouldReturnAllUsersWithMappedRoles()
        {
            var user1 = new IdentityUser { Id = "user-a", Email = "a@test.com", UserName = "a@test.com" };
            var user2 = new IdentityUser { Id = "user-b", Email = "b@test.com", UserName = "b@test.com" };
            _db.Users.AddRange(user1, user2);

            var role = new IdentityRole { Id = "role-1", Name = "User", NormalizedName = "USER" };
            _db.Roles.Add(role);

            var userRole = new IdentityUserRole<string> { UserId = "user-a", RoleId = "role-1" };
            _db.UserRoles.Add(userRole);

            await _db.SaveChangesAsync();

            var usersQueryable = _db.Users;
            _userManagerMock.Setup(u => u.Users).Returns(usersQueryable);

            var result = await _identityService.GetAllUsersAsync();

            Assert.NotNull(result);
            var list = result.ToList();
            Assert.Equal(2, list.Count);

            var returnedUserA = list.FirstOrDefault(u => u.Id == "user-a");
            Assert.NotNull(returnedUserA);
            Assert.Contains("User", returnedUserA.Roles);

            var returnedUserB = list.FirstOrDefault(u => u.Id == "user-b");
            Assert.NotNull(returnedUserB);
            Assert.Empty(returnedUserB.Roles);
        }

        /// <summary>
        /// Verifies that UpdateUserAsync successfully modifies user parameters and syncs role adjustments.
        /// </summary>
        [Fact]
        public async Task UpdateUserAsync_ShouldUpdateEmailAndSyncRoles()
        {
            var user = new IdentityUser { Id = "user-123", Email = "old@test.com", UserName = "old@test.com" };
            var request = new UpdateUserRequestDto("new@test.com", new List<string> { "Admin", "User" });

            _userManagerMock.Setup(u => u.FindByIdAsync("user-123"))
                .ReturnsAsync(user);

            _userManagerMock.Setup(u => u.UpdateAsync(user))
                .ReturnsAsync(IdentityResult.Success);

            _userManagerMock.Setup(u => u.GetRolesAsync(user))
                .ReturnsAsync(new List<string> { "User", "Viewer" });

            _userManagerMock.Setup(u => u.AddToRolesAsync(user, It.IsAny<IEnumerable<string>>()))
                .ReturnsAsync(IdentityResult.Success);

            _userManagerMock.Setup(u => u.RemoveFromRolesAsync(user, It.IsAny<IEnumerable<string>>()))
                .ReturnsAsync(IdentityResult.Success);

            await _identityService.UpdateUserAsync("user-123", request);

            Assert.Equal("new@test.com", user.Email);
            Assert.Equal("new@test.com", user.UserName);
            _userManagerMock.Verify(u => u.UpdateAsync(user), Times.Once);
            _userManagerMock.Verify(u => u.AddToRolesAsync(user, It.Is<IEnumerable<string>>(r => r.SequenceEqual(new[] { "Admin" }))), Times.Once);
            _userManagerMock.Verify(u => u.RemoveFromRolesAsync(user, It.Is<IEnumerable<string>>(r => r.SequenceEqual(new[] { "Viewer" }))), Times.Once);
        }

        /// <summary>
        /// Verifies that UpdateUserAsync throws an InvalidOperationException when UpdateAsync fails.
        /// </summary>
        [Fact]
        public async Task UpdateUserAsync_ShouldThrowException_WhenUpdateFails()
        {
            var user = new IdentityUser { Id = "user-123", Email = "old@test.com" };
            var request = new UpdateUserRequestDto("new@test.com", new List<string>());

            _userManagerMock.Setup(u => u.FindByIdAsync("user-123"))
                .ReturnsAsync(user);

            _userManagerMock.Setup(u => u.UpdateAsync(user))
                .ReturnsAsync(IdentityResult.Failed(new IdentityError { Description = "Update error" }));

            await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _identityService.UpdateUserAsync("user-123", request));
        }

        /// <summary>
        /// Verifies that DeleteUserAsync successfully deletes the specified user identity.
        /// </summary>
        [Fact]
        public async Task DeleteUserAsync_ShouldInvokeDelete_WhenUserExists()
        {
            var user = new IdentityUser { Id = "user-123" };
            _userManagerMock.Setup(u => u.FindByIdAsync("user-123"))
                .ReturnsAsync(user);

            _userManagerMock.Setup(u => u.DeleteAsync(user))
                .ReturnsAsync(IdentityResult.Success);

            await _identityService.DeleteUserAsync("user-123");

            _userManagerMock.Verify(u => u.DeleteAsync(user), Times.Once);
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
