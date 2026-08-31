using BeatnikToolKit.EntityFramework.Services.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using Moq;
using System.Security.Claims;

namespace Chambered.Tests.Services.Identity
{
    /// <summary>
    /// Contains unit tests for the <see cref="RoleService"/> class.
    /// </summary>
    public class RoleServiceTests
    {
        private readonly Mock<RoleManager<IdentityRole>> _roleManagerMock;
        private readonly Mock<ILogger<RoleService>> _loggerMock;
        private readonly RoleService _roleService;

        /// <summary>
        /// Initializes a new instance of the <see cref="RoleServiceTests"/> class.
        /// </summary>
        public RoleServiceTests()
        {
            var roleStoreMock = new Mock<IRoleStore<IdentityRole>>();
            _roleManagerMock = new Mock<RoleManager<IdentityRole>>(
                roleStoreMock.Object, null, null, null, null);

            _loggerMock = new Mock<ILogger<RoleService>>();
            _roleService = new RoleService(_roleManagerMock.Object, _loggerMock.Object);
        }

        /// <summary>
        /// Verifies that CreateRoleAsync invokes the underlying RoleManager create methods if the role does not already exist.
        /// </summary>
        [Fact]
        public async Task CreateRoleAsync_ShouldInvokeRoleManagerCreate()
        {
            var roleName = "NewRole";
            _roleManagerMock.Setup(r => r.RoleExistsAsync(roleName))
                .ReturnsAsync(false);

            _roleManagerMock.Setup(r => r.CreateAsync(It.Is<IdentityRole>(role => role.Name == roleName)))
                .ReturnsAsync(IdentityResult.Success);

            await _roleService.CreateRoleAsync(roleName);

            _roleManagerMock.Verify(r => r.CreateAsync(It.Is<IdentityRole>(role => role.Name == roleName)), Times.Once);
        }

        /// <summary>
        /// Verifies that SyncClaimsToRoleAsync correctly determines which claims to add or remove to sync with the target permissions list.
        /// </summary>
        [Fact]
        public async Task SyncClaimsToRoleAsync_ShouldAddAndRemoveClaimsCorrectly()
        {
            var roleName = "TestRole";
            var role = new IdentityRole(roleName) { Id = "role-123" };

            var currentClaims = new List<Claim>
            {
                new Claim("Permission", "Read"),
                new Claim("Permission", "Delete")
            };

            var permissions = new List<string> { "Read", "Write" };

            _roleManagerMock.Setup(r => r.FindByNameAsync(roleName))
                .ReturnsAsync(role);

            _roleManagerMock.Setup(r => r.GetClaimsAsync(role))
                .ReturnsAsync(currentClaims);

            _roleManagerMock.Setup(r => r.AddClaimAsync(role, It.IsAny<Claim>()))
                .ReturnsAsync(IdentityResult.Success);

            _roleManagerMock.Setup(r => r.RemoveClaimAsync(role, It.IsAny<Claim>()))
                .ReturnsAsync(IdentityResult.Success);

            await _roleService.SyncClaimsToRoleAsync(roleName, permissions);

            _roleManagerMock.Verify(r => r.AddClaimAsync(role, It.Is<Claim>(c => c.Value == "Write")), Times.Once);
            _roleManagerMock.Verify(r => r.RemoveClaimAsync(role, It.Is<Claim>(c => c.Value == "Delete")), Times.Once);
            _roleManagerMock.Verify(r => r.AddClaimAsync(role, It.Is<Claim>(c => c.Value == "Read")), Times.Never);
        }
 
        /// <summary>
        /// Verifies that DeleteRoleAsync retrieves and deletes the specified role successfully.
        /// </summary>
        [Fact]
        public async Task DeleteRoleAsync_ShouldInvokeRoleManagerDelete()
        {
            var roleName = "Admin";
            var role = new IdentityRole(roleName);
 
            _roleManagerMock.Setup(r => r.FindByNameAsync(roleName))
                .ReturnsAsync(role);
 
            _roleManagerMock.Setup(r => r.DeleteAsync(role))
                .ReturnsAsync(IdentityResult.Success);
 
            await _roleService.DeleteRoleAsync(roleName);
 
            _roleManagerMock.Verify(r => r.DeleteAsync(role), Times.Once);
        }
 
        /// <summary>
        /// Verifies that GetAllRolesAsync correctly lists all system roles with their permission claims eagerly mapped.
        /// </summary>
        [Fact]
        public async Task GetAllRolesAsync_ShouldReturnAllRolesWithClaims()
        {
            var roleList = new List<IdentityRole>
            {
                new IdentityRole("Admin"),
                new IdentityRole("User")
            }.AsQueryable();
 
            var mockQueryable = new TestAsyncEnumerable<IdentityRole>(roleList);
            _roleManagerMock.Setup(r => r.Roles).Returns(mockQueryable);
 
            _roleManagerMock.Setup(r => r.GetClaimsAsync(It.Is<IdentityRole>(role => role.Name == "Admin")))
                .ReturnsAsync(new List<Claim> { new Claim("Permission", "SystemAdmin") });
 
            _roleManagerMock.Setup(r => r.GetClaimsAsync(It.Is<IdentityRole>(role => role.Name == "User")))
                .ReturnsAsync(new List<Claim> { new Claim("Permission", "Read") });
 
            var result = await _roleService.GetAllRolesAsync();
 
            Assert.NotNull(result);
            var list = result.ToList();
            Assert.Equal(2, list.Count);
 
            var adminResponse = list.FirstOrDefault(r => r.RoleName == "Admin");
            Assert.NotNull(adminResponse);
            Assert.Contains("SystemAdmin", adminResponse.AssignedPermissions);
 
            var userResponse = list.FirstOrDefault(r => r.RoleName == "User");
            Assert.NotNull(userResponse);
            Assert.Contains("Read", userResponse.AssignedPermissions);
        }
 
        /// <summary>
        /// Verifies that GetClaimsForRoleAsync retrieves all claims registered under the specified role name.
        /// </summary>
        [Fact]
        public async Task GetClaimsForRoleAsync_ShouldReturnClaims()
        {
            var roleName = "Admin";
            var role = new IdentityRole(roleName);
 
            _roleManagerMock.Setup(r => r.FindByNameAsync(roleName))
                .ReturnsAsync(role);
 
            _roleManagerMock.Setup(r => r.GetClaimsAsync(role))
                .ReturnsAsync(new List<Claim> { new Claim("Permission", "Read"), new Claim("Permission", "Write") });
 
            var result = await _roleService.GetClaimsForRoleAsync(roleName);
 
            Assert.NotNull(result);
            var list = result.ToList();
            Assert.Equal(2, list.Count);
            Assert.Contains("Read", list);
            Assert.Contains("Write", list);
        }
 
        /// <summary>
        /// Verifies that GetAllSystemPermissionsAsync lists all distinct claim permission strings defined across any system role.
        /// </summary>
        [Fact]
        public async Task GetAllSystemPermissionsAsync_ShouldReturnDistinctClaimsFromAllRoles()
        {
            var roleList = new List<IdentityRole>
            {
                new IdentityRole("Admin"),
                new IdentityRole("User")
            }.AsQueryable();
 
            var mockQueryable = new TestAsyncEnumerable<IdentityRole>(roleList);
            _roleManagerMock.Setup(r => r.Roles).Returns(mockQueryable);
 
            _roleManagerMock.Setup(r => r.GetClaimsAsync(It.Is<IdentityRole>(role => role.Name == "Admin")))
                .ReturnsAsync(new List<Claim> { new Claim("Permission", "Read"), new Claim("Permission", "Write") });
 
            _roleManagerMock.Setup(r => r.GetClaimsAsync(It.Is<IdentityRole>(role => role.Name == "User")))
                .ReturnsAsync(new List<Claim> { new Claim("Permission", "Read") });
 
            var result = await _roleService.GetAllSystemPermissionsAsync();
 
            Assert.NotNull(result);
            var list = result.ToList();
            Assert.Equal(2, list.Count);
            Assert.Contains("Read", list);
            Assert.Contains("Write", list);
        }
    }
}
