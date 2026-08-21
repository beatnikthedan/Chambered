using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Chambered.Core.Services.Identity.Dto;
using Chambered.Data;
using Chambered.Infrastructure.Configuration;
using Chambered.Infrastructure.Services.Identity;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace Chambered.Tests.Services.Identity
{
    /// <summary>
    /// Contains unit tests for the <see cref="FederatedAuthService"/> class.
    /// </summary>
    public class FederatedAuthServiceTests
    {
        private readonly Mock<SignInManager<ChamberedUser>> _signInManagerMock;
        private readonly Mock<UserManager<ChamberedUser>> _userManagerMock;
        private readonly Mock<RoleManager<IdentityRole>> _roleManagerMock;
        private readonly Mock<IConfiguration> _configurationMock;
        private readonly Mock<ILogger<FederatedAuthService>> _loggerMock;
        private readonly FederatedAuthenticationConfiguration _fedConfig;
        private readonly FederatedAuthService _federatedAuthService;

        public FederatedAuthServiceTests()
        {
            var userStoreMock = new Mock<IUserStore<ChamberedUser>>();
            _userManagerMock = new Mock<UserManager<ChamberedUser>>(
                userStoreMock.Object, null, null, null, null, null, null, null, null);

            var contextAccessorMock = new Mock<IHttpContextAccessor>();
            var claimsFactoryMock = new Mock<IUserClaimsPrincipalFactory<ChamberedUser>>();
            var optionsMock = new Mock<IOptions<IdentityOptions>>();
            var loggerSignInMock = new Mock<ILogger<SignInManager<ChamberedUser>>>();
            var confirmationMock = new Mock<IUserConfirmation<ChamberedUser>>();

            _signInManagerMock = new Mock<SignInManager<ChamberedUser>>(
                _userManagerMock.Object,
                contextAccessorMock.Object,
                claimsFactoryMock.Object,
                optionsMock.Object,
                loggerSignInMock.Object,
                null,
                confirmationMock.Object);

            var roleStoreMock = new Mock<IRoleStore<IdentityRole>>();
            _roleManagerMock = new Mock<RoleManager<IdentityRole>>(
                roleStoreMock.Object, null, null, null, null);

            _configurationMock = new Mock<IConfiguration>();
            _loggerMock = new Mock<ILogger<FederatedAuthService>>();

            _configurationMock.Setup(c => c["Jwt:Key"]).Returns("super-secret-key-32-chars-long-12345");
            _configurationMock.Setup(c => c["Jwt:Issuer"]).Returns("ChamberedIssuer");
            _configurationMock.Setup(c => c["Jwt:ExpireDays"]).Returns("7");

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
                    FirstName = "given_name",
                    LastName = "family_name",
                    Roles = "roles"
                }
            };
            _fedConfig.Providers.Add(provider);

            var optionsFedMock = Options.Create(_fedConfig);

            _federatedAuthService = new FederatedAuthService(
                _signInManagerMock.Object,
                _userManagerMock.Object,
                _roleManagerMock.Object,
                optionsFedMock,
                _configurationMock.Object,
                _loggerMock.Object);
        }

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

        [Fact]
        public async Task LinkAccountAsync_ShouldAssociateExternalSsoWithUser()
        {
            var userId = "user-123";
            var externalInfo = new ExternalIdentityDto("Authentik", "authentik-key-abc", new Dictionary<string, string>());
            var user = new ChamberedUser { Id = userId, Email = "test@authentik.gov" };

            _userManagerMock.Setup(u => u.FindByIdAsync(userId))
                .ReturnsAsync(user);

            _userManagerMock.Setup(u => u.FindByLoginAsync(externalInfo.ProviderName, externalInfo.ProviderKey))
                .ReturnsAsync((ChamberedUser?)null);

            _userManagerMock.Setup(u => u.AddLoginAsync(user, It.Is<UserLoginInfo>(li => li.LoginProvider == externalInfo.ProviderName && li.ProviderKey == externalInfo.ProviderKey)))
                .ReturnsAsync(IdentityResult.Success);

            await _federatedAuthService.LinkAccountAsync(userId, externalInfo);

            _userManagerMock.Verify(u => u.AddLoginAsync(user, It.Is<UserLoginInfo>(li => li.LoginProvider == externalInfo.ProviderName && li.ProviderKey == externalInfo.ProviderKey)), Times.Once);
        }

        [Fact]
        public async Task HandleCallbackAsync_ShouldDeltaSyncRoles_SuccessfulLogin()
        {
            var providerName = "Authentik";
            var userEmail = "test@authentik.gov";
            var userClaims = new Dictionary<string, string>
            {
                { "email", userEmail },
                { "given_name", "Test" },
                { "family_name", "User" },
                { "roles", "UsageAdmin,DataAdmin" }
            };

            var externalInfo = new ExternalIdentityDto(providerName, "authentik-external-key-123", userClaims);
            var user = new ChamberedUser
            {
                Id = "user-id-999",
                Email = userEmail,
                FirstName = "Test",
                LastName = "User"
            };

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

            var result = await _federatedAuthService.HandleCallbackAsync(providerName, externalInfo);

            Assert.NotNull(result);
            Assert.True(result.IsSuccess);

            _userManagerMock.Verify(u => u.AddToRolesAsync(user, It.Is<IEnumerable<string>>(roles => roles.SequenceEqual(new[] { "DataAdmin" }))), Times.Once);
            _userManagerMock.Verify(u => u.RemoveFromRolesAsync(user, It.Is<IEnumerable<string>>(roles => roles.SequenceEqual(new[] { "Viewer" }))), Times.Once);
            _signInManagerMock.Verify(s => s.SignInAsync(user, false, null), Times.Once);
        }
    }
}
