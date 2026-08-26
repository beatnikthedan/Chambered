using BeatnikToolKit.EntityFramework.Configuration;
using BeatnikToolKit.EntityFramework.Services.Identity;
using BeatnikToolKit.EntityFramework.Services.Identity.Dto;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;

namespace Chambered.Tests.Services.Identity
{
    /// <summary>
    /// Contains unit tests for the <see cref="FederatedAuthService"/> class.
    /// </summary>
    public class FederatedAuthServiceTests
    {
        private readonly Mock<SignInManager<IdentityUser>> _signInManagerMock;
        private readonly Mock<UserManager<IdentityUser>> _userManagerMock;
        private readonly Mock<RoleManager<IdentityRole>> _roleManagerMock;
        private readonly Mock<ILogger<FederatedAuthService<IdentityUser>>> _loggerMock;
        private readonly FederatedAuthenticationConfiguration _fedConfig;
        private readonly FederatedAuthService<IdentityUser> _federatedAuthService;

        /// <summary>
        /// Initializes a new instance of the <see cref="FederatedAuthServiceTests"/> class.
        /// </summary>
        public FederatedAuthServiceTests()
        {
            var userStoreMock = new Mock<IUserStore<IdentityUser>>();
            _userManagerMock = new Mock<UserManager<IdentityUser>>(
                userStoreMock.Object, null, null, null, null, null, null, null, null);

            var contextAccessorMock = new Mock<IHttpContextAccessor>();
            var claimsFactoryMock = new Mock<IUserClaimsPrincipalFactory<IdentityUser>>();
            var optionsMock = new Mock<IOptions<IdentityOptions>>();
            var loggerSignInMock = new Mock<ILogger<SignInManager<IdentityUser>>>();
            var confirmationMock = new Mock<IUserConfirmation<IdentityUser>>();

            var schemeProviderMock = new Mock<IAuthenticationSchemeProvider>();

            _signInManagerMock = new Mock<SignInManager<IdentityUser>>(
                _userManagerMock.Object,
                contextAccessorMock.Object,
                claimsFactoryMock.Object,
                optionsMock.Object,
                loggerSignInMock.Object,
                schemeProviderMock.Object,
                confirmationMock.Object);

            var roleStoreMock = new Mock<IRoleStore<IdentityRole>>();
            _roleManagerMock = new Mock<RoleManager<IdentityRole>>(
                roleStoreMock.Object, null, null, null, null);

            _loggerMock = new Mock<ILogger<FederatedAuthService<IdentityUser>>>();

            _fedConfig = new FederatedAuthenticationConfiguration();
            var provider = new FederatedProviderConfiguration
            {
                ProviderName = "Authentik",
                Authority = "https://authentik.agency.gov/application/o/chambered/",
                ClientId = "chambered-core-api",
                ClientSecret = "SUPER_SECRET_KEY",
                CallbackPath = "/signin-oidc",
                UserProfileClaims = new UserProfileClaimConfiguration
                {
                    Email = "email",
                    UserName = "preferred_username",
                    Roles = "roles"
                }
            };
            _fedConfig.Providers.Add(provider);

            var optionsFedMock = Options.Create(_fedConfig);

            var rulebookMock = new Mock<IAuthorizationRulebook>();
            rulebookMock.Setup(r => r.DefaultUserRoleName).Returns("User");
            rulebookMock.Setup(r => r.AdminRoleName).Returns("Admin");
            rulebookMock.Setup(r => r.PermissionClaimType).Returns("permission");
            rulebookMock.Setup(r => r.RoleClaimsMap).Returns(new Dictionary<string, IEnumerable<string>>());

            _federatedAuthService = new FederatedAuthService<IdentityUser>(
                _signInManagerMock.Object,
                _userManagerMock.Object,
                _roleManagerMock.Object,
                optionsFedMock,
                _loggerMock.Object,
                rulebookMock.Object,
                Enumerable.Empty<IFederatedCustomScopeProcessor<IdentityUser>>());
        }

        /// <summary>
        /// Verifies that PrepareChallengeAsync returns the configured authentication challenge properties.
        /// </summary>
        [Fact]
        public async Task PrepareChallengeAsync_ShouldReturnChallengeProperties()
        {
            var providerName = "Authentik";
            var redirectUri = "/signin-oidc";
            var authProperties = new AuthenticationProperties();
            authProperties.Items["test-key"] = "test-value";

            _signInManagerMock.Setup(s => s.ConfigureExternalAuthenticationProperties(providerName, redirectUri, null))
                .Returns(authProperties);

            var result = await _federatedAuthService.PrepareChallengeAsync(providerName, redirectUri);

            Assert.NotNull(result);
            Assert.Equal(providerName, result.Scheme);
            Assert.Equal(redirectUri, result.RedirectUri);
            Assert.Contains("test-key", result.Properties.Keys);
            Assert.Equal("test-value", result.Properties["test-key"]);
        }

        /// <summary>
        /// Verifies that LinkAccountAsync associates the external SSO identity with the specified user profile.
        /// </summary>
        [Fact]
        public async Task LinkAccountAsync_ShouldAssociateExternalSsoWithUser()
        {
            var userId = "user-123";
            var externalInfo = new ExternalIdentityDto("Authentik", "authentik-key-abc", new Dictionary<string, string>());
            var user = new IdentityUser { Id = userId, Email = "test@authentik.gov" };

            _userManagerMock.Setup(u => u.FindByIdAsync(userId))
                .ReturnsAsync(user);

            _userManagerMock.Setup(u => u.FindByLoginAsync(externalInfo.ProviderName, externalInfo.ProviderKey))
                .ReturnsAsync((IdentityUser?)null);

            _userManagerMock.Setup(u => u.AddLoginAsync(user, It.Is<UserLoginInfo>(li => li.LoginProvider == externalInfo.ProviderName && li.ProviderKey == externalInfo.ProviderKey)))
                .ReturnsAsync(IdentityResult.Success);

            await _federatedAuthService.LinkAccountAsync(userId, externalInfo);

            _userManagerMock.Verify(u => u.AddLoginAsync(user, It.Is<UserLoginInfo>(li => li.LoginProvider == externalInfo.ProviderName && li.ProviderKey == externalInfo.ProviderKey)), Times.Once);
        }

        /// <summary>
        /// Verifies that HandleCallbackAsync performs delta role synchronization correctly on a successful login.
        /// </summary>
        [Fact]
        public async Task HandleCallbackAsync_ShouldDeltaSyncRoles_SuccessfulLogin()
        {
            var providerName = "Authentik";
            var userEmail = "test@authentik.gov";

            var providerConfig = _fedConfig.Providers.First();
            providerConfig.RoleMappings["UsageAdmin"] = "UsageAdmin";
            providerConfig.RoleMappings["DataAdmin"] = "DataAdmin";

            var userClaims = new Dictionary<string, string>
            {
                { "email", userEmail },
                { "preferred_username", "testuser" },
                { "roles", "UsageAdmin,DataAdmin" }
            };

            var externalInfo = new ExternalIdentityDto(providerName, "authentik-external-key-123", userClaims);
            var user = new IdentityUser
            {
                Id = "user-id-999",
                UserName = "testuser",
                Email = userEmail
            };

            var rulebookMock = new Mock<IAuthorizationRulebook>();
            rulebookMock.Setup(r => r.DefaultUserRoleName).Returns("User");
            rulebookMock.Setup(r => r.AdminRoleName).Returns("Admin");
            rulebookMock.Setup(r => r.RoleClaimsMap).Returns(new Dictionary<string, IEnumerable<string>>
            {
                { "UsageAdmin", new[] { "PermissionA" } },
                { "DataAdmin", new[] { "PermissionB" } }
            });

            var localService = new FederatedAuthService<IdentityUser>(
                _signInManagerMock.Object,
                _userManagerMock.Object,
                _roleManagerMock.Object,
                Options.Create(_fedConfig),
                _loggerMock.Object,
                rulebookMock.Object,
                Enumerable.Empty<IFederatedCustomScopeProcessor<IdentityUser>>());

            _userManagerMock.Setup(u => u.FindByEmailAsync(userEmail))
                .ReturnsAsync(user);

            _userManagerMock.Setup(u => u.FindByLoginAsync(providerName, externalInfo.ProviderKey))
                .ReturnsAsync(user);

            _userManagerMock.Setup(u => u.UpdateAsync(user))
                .ReturnsAsync(IdentityResult.Success);

            _userManagerMock.Setup(u => u.GetRolesAsync(user))
                .ReturnsAsync(new List<string> { "UsageAdmin", "Viewer" });

            _userManagerMock.Setup(u => u.AddToRolesAsync(user, It.Is<IEnumerable<string>>(roles => roles.SequenceEqual(new[] { "DataAdmin" }))))
                .ReturnsAsync(IdentityResult.Success);

            _userManagerMock.Setup(u => u.RemoveFromRolesAsync(user, It.Is<IEnumerable<string>>(roles => roles.SequenceEqual(new[] { "Viewer" }))))
                .ReturnsAsync(IdentityResult.Success);

            _signInManagerMock.Setup(s => s.SignInAsync(user, false, null))
                .Returns(Task.CompletedTask);

            var result = await localService.HandleCallbackAsync(providerName, externalInfo);

            Assert.NotNull(result);
            Assert.True(result.IsSuccess);

            _userManagerMock.Verify(u => u.AddToRolesAsync(user, It.Is<IEnumerable<string>>(roles => roles.SequenceEqual(new[] { "DataAdmin" }))), Times.Once);
            _userManagerMock.Verify(u => u.RemoveFromRolesAsync(user, It.Is<IEnumerable<string>>(roles => roles.SequenceEqual(new[] { "Viewer" }))), Times.Once);
            _signInManagerMock.Verify(s => s.SignInAsync(user, false, null), Times.Once);
        }

        /// <summary>
        /// Verifies that HandleCallbackAsync defaults to the standard user role when no mapped roles match.
        /// </summary>
        [Fact]
        public async Task HandleCallbackAsync_ShouldDefaultToUserRole_WhenNoMappedGroupsMatch()
        {
            var providerName = "Authentik";
            var userEmail = "test@authentik.gov";
            var userClaims = new Dictionary<string, string>
            {
                { "email", userEmail },
                { "preferred_username", "testuser" },
                { "roles", "UnmappedGroup1,UnmappedGroup2" }
            };

            var externalInfo = new ExternalIdentityDto(providerName, "authentik-external-key-123", userClaims);
            var user = new IdentityUser
            {
                Id = "user-id-999",
                UserName = "testuser",
                Email = userEmail
            };

            _userManagerMock.Setup(u => u.FindByEmailAsync(userEmail))
                .ReturnsAsync(user);

            _userManagerMock.Setup(u => u.FindByLoginAsync(providerName, externalInfo.ProviderKey))
                .ReturnsAsync(user);

            _userManagerMock.Setup(u => u.GetRolesAsync(user))
                .ReturnsAsync(new List<string> { "Viewer" });

            _userManagerMock.Setup(u => u.AddToRolesAsync(user, It.Is<IEnumerable<string>>(roles => roles.SequenceEqual(new[] { "User" }))))
                .ReturnsAsync(IdentityResult.Success);

            _userManagerMock.Setup(u => u.RemoveFromRolesAsync(user, It.Is<IEnumerable<string>>(roles => roles.SequenceEqual(new[] { "Viewer" }))))
                .ReturnsAsync(IdentityResult.Success);

            _signInManagerMock.Setup(s => s.SignInAsync(user, false, null))
                .Returns(Task.CompletedTask);

            var result = await _federatedAuthService.HandleCallbackAsync(providerName, externalInfo);

            Assert.NotNull(result);
            Assert.True(result.IsSuccess);

            _userManagerMock.Verify(u => u.AddToRolesAsync(user, It.Is<IEnumerable<string>>(roles => roles.SequenceEqual(new[] { "User" }))), Times.Once);
            _userManagerMock.Verify(u => u.RemoveFromRolesAsync(user, It.Is<IEnumerable<string>>(roles => roles.SequenceEqual(new[] { "Viewer" }))), Times.Once);
        }

        /// <summary>
        /// Verifies that HandleCallbackAsync defaults to the standard user role when role synchronization is disabled.
        /// </summary>
        [Fact]
        public async Task HandleCallbackAsync_ShouldDefaultToUserRole_WhenRoleSyncIsDisabled()
        {
            var providerName = "Authentik";
            var userEmail = "test@authentik.gov";

            var providerConfig = _fedConfig.Providers.First();
            providerConfig.EnableRoleSynchronization = false;

            var userClaims = new Dictionary<string, string>
            {
                { "email", userEmail },
                { "preferred_username", "testuser" },
                { "roles", "UsageAdmin" }
            };

            var externalInfo = new ExternalIdentityDto(providerName, "authentik-external-key-123", userClaims);
            var user = new IdentityUser
            {
                Id = "user-id-999",
                UserName = "testuser",
                Email = userEmail
            };

            _userManagerMock.Setup(u => u.FindByEmailAsync(userEmail))
                .ReturnsAsync(user);

            _userManagerMock.Setup(u => u.FindByLoginAsync(providerName, externalInfo.ProviderKey))
                .ReturnsAsync(user);

            _userManagerMock.Setup(u => u.GetRolesAsync(user))
                .ReturnsAsync(new List<string> { "Viewer" });

            _userManagerMock.Setup(u => u.AddToRolesAsync(user, It.Is<IEnumerable<string>>(roles => roles.SequenceEqual(new[] { "User" }))))
                .ReturnsAsync(IdentityResult.Success);

            _userManagerMock.Setup(u => u.RemoveFromRolesAsync(user, It.Is<IEnumerable<string>>(roles => roles.SequenceEqual(new[] { "Viewer" }))))
                .ReturnsAsync(IdentityResult.Success);

            _signInManagerMock.Setup(s => s.SignInAsync(user, false, null))
                .Returns(Task.CompletedTask);

            var result = await _federatedAuthService.HandleCallbackAsync(providerName, externalInfo);

            Assert.NotNull(result);
            Assert.True(result.IsSuccess);

            _userManagerMock.Verify(u => u.AddToRolesAsync(user, It.Is<IEnumerable<string>>(roles => roles.SequenceEqual(new[] { "User" }))), Times.Once);
            _userManagerMock.Verify(u => u.RemoveFromRolesAsync(user, It.Is<IEnumerable<string>>(roles => roles.SequenceEqual(new[] { "Viewer" }))), Times.Once);
        }

        /// <summary>
        /// Verifies that HandleCallbackAsync skips role mappings that are not defined in the authorization rulebook.
        /// </summary>
        [Fact]
        public async Task HandleCallbackAsync_ShouldSkipInvalidRoleMappings()
        {
            var providerName = "Authentik";
            var userEmail = "test@authentik.gov";

            var providerConfig = _fedConfig.Providers.First();
            providerConfig.RoleMappings["GroupA"] = "ValidRole";
            providerConfig.RoleMappings["GroupB"] = "InvalidRole";

            var userClaims = new Dictionary<string, string>
            {
                { "email", userEmail },
                { "preferred_username", "testuser" },
                { "roles", "GroupA,GroupB" }
            };

            var externalInfo = new ExternalIdentityDto(providerName, "authentik-external-key-123", userClaims);
            var user = new IdentityUser
            {
                Id = "user-id-999",
                UserName = "testuser",
                Email = userEmail
            };

            var rulebookMock = new Mock<IAuthorizationRulebook>();
            rulebookMock.Setup(r => r.DefaultUserRoleName).Returns("User");
            rulebookMock.Setup(r => r.AdminRoleName).Returns("Admin");
            rulebookMock.Setup(r => r.RoleClaimsMap).Returns(new Dictionary<string, IEnumerable<string>>
            {
                { "ValidRole", new[] { "Permission1" } }
            });

            var localService = new FederatedAuthService<IdentityUser>(
                _signInManagerMock.Object,
                _userManagerMock.Object,
                _roleManagerMock.Object,
                Options.Create(_fedConfig),
                _loggerMock.Object,
                rulebookMock.Object,
                Enumerable.Empty<IFederatedCustomScopeProcessor<IdentityUser>>());

            _userManagerMock.Setup(u => u.FindByEmailAsync(userEmail))
                .ReturnsAsync(user);

            _userManagerMock.Setup(u => u.FindByLoginAsync(providerName, externalInfo.ProviderKey))
                .ReturnsAsync(user);

            _userManagerMock.Setup(u => u.GetRolesAsync(user))
                .ReturnsAsync(new List<string>());

            _userManagerMock.Setup(u => u.AddToRolesAsync(user, It.Is<IEnumerable<string>>(roles => roles.SequenceEqual(new[] { "ValidRole" }))))
                .ReturnsAsync(IdentityResult.Success);

            _signInManagerMock.Setup(s => s.SignInAsync(user, false, null))
                .Returns(Task.CompletedTask);

            var result = await localService.HandleCallbackAsync(providerName, externalInfo);

            Assert.NotNull(result);
            Assert.True(result.IsSuccess);
            _userManagerMock.Verify(u => u.AddToRolesAsync(user, It.Is<IEnumerable<string>>(roles => roles.Contains("ValidRole"))), Times.Once);
            _userManagerMock.Verify(u => u.AddToRolesAsync(user, It.Is<IEnumerable<string>>(roles => roles.Contains("InvalidRole"))), Times.Never);
        }

        /// <summary>
        /// Verifies that HandleCallbackAsync invokes the registered custom scope processors during user authentication.
        /// </summary>
        [Fact]
        public async Task HandleCallbackAsync_ShouldExecuteCustomScopeProcessors()
        {
            var providerName = "Authentik";
            var userEmail = "test@authentik.gov";
            var userClaims = new Dictionary<string, string>
            {
                { "email", userEmail },
                { "preferred_username", "testuser" },
                { "roles", "User" },
                { "arsenals", "arsenal-123,arsenal-456" }
            };

            var externalInfo = new ExternalIdentityDto(providerName, "authentik-external-key-123", userClaims);
            var user = new IdentityUser
            {
                Id = "user-id-999",
                UserName = "testuser",
                Email = userEmail
            };

            var rulebookMock = new Mock<IAuthorizationRulebook>();
            rulebookMock.Setup(r => r.DefaultUserRoleName).Returns("User");
            rulebookMock.Setup(r => r.AdminRoleName).Returns("Admin");
            rulebookMock.Setup(r => r.RoleClaimsMap).Returns(new Dictionary<string, IEnumerable<string>>
            {
                { "User", new[] { "Permission1" } }
            });

            var processorMock = new Mock<IFederatedCustomScopeProcessor<IdentityUser>>();
            processorMock.Setup(p => p.TargetScope).Returns("arsenals");
            processorMock.Setup(p => p.ProcessScopeAsync(user, "arsenal-123,arsenal-456"))
                .Returns(Task.CompletedTask)
                .Verifiable();

            var localService = new FederatedAuthService<IdentityUser>(
                _signInManagerMock.Object,
                _userManagerMock.Object,
                _roleManagerMock.Object,
                Options.Create(_fedConfig),
                _loggerMock.Object,
                rulebookMock.Object,
                new[] { processorMock.Object });

            _userManagerMock.Setup(u => u.FindByEmailAsync(userEmail))
                .ReturnsAsync(user);

            _userManagerMock.Setup(u => u.FindByLoginAsync(providerName, externalInfo.ProviderKey))
                .ReturnsAsync(user);

            _userManagerMock.Setup(u => u.GetRolesAsync(user))
                .ReturnsAsync(new List<string> { "User" });

            _userManagerMock.Setup(u => u.UpdateAsync(user))
                .ReturnsAsync(IdentityResult.Success);

            _signInManagerMock.Setup(s => s.SignInAsync(user, false, null))
                .Returns(Task.CompletedTask);

            var result = await localService.HandleCallbackAsync(providerName, externalInfo);

            Assert.NotNull(result);
            Assert.True(result.IsSuccess);
            processorMock.Verify();
            _userManagerMock.Verify(u => u.UpdateAsync(user), Times.Once);
        }
    }
}
