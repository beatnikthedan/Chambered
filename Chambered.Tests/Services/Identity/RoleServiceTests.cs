using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Chambered.Infrastructure.Services.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

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
    }
}
