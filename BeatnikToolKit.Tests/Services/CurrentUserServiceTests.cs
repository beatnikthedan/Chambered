using BeatnikToolKit.EntityFramework.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Moq;
using System.Security.Claims;

namespace BeatnikToolKit.Tests.Services
{
    /// <summary>
    /// Contains unit tests verifying the behaviors of CurrentUserService.
    /// </summary>
    public class CurrentUserServiceTests
    {
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock;
        private readonly Mock<IOptions<CurrentUserServiceOptions<IdentityUser>>> _optionsMock;
        private readonly CurrentUserServiceOptions<IdentityUser> _options;

        /// <summary>
        /// Initializes mock frameworks for CurrentUserService testing.
        /// </summary>
        public CurrentUserServiceTests()
        {
            _httpContextAccessorMock = new Mock<IHttpContextAccessor>();
            _optionsMock = new Mock<IOptions<CurrentUserServiceOptions<IdentityUser>>>();
            _options = new CurrentUserServiceOptions<IdentityUser>();
            _optionsMock.Setup(o => o.Value).Returns(_options);
        }

        /// <summary>
        /// Verifies that GetCurrentUser returns an unpopulated user when HttpContext is null.
        /// </summary>
        [Fact]
        public void GetCurrentUser_ShouldReturnUnpopulatedUser_WhenHttpContextIsNull()
        {
            _httpContextAccessorMock.Setup(h => h.HttpContext).Returns((HttpContext)null!);
            var service = new CurrentUserService<IdentityUser>(_httpContextAccessorMock.Object, _optionsMock.Object);

            var result = service.GetCurrentUser();

            Assert.NotNull(result);
            Assert.Null(result.Id);
            Assert.Null(result.Email);
            Assert.Null(result.UserName);
        }

        /// <summary>
        /// Verifies that GetCurrentUser returns an unpopulated user when the user is not authenticated.
        /// </summary>
        [Fact]
        public void GetCurrentUser_ShouldReturnUnpopulatedUser_WhenUserIsNotAuthenticated()
        {
            var httpContext = new DefaultHttpContext();
            var identity = new ClaimsIdentity();
            httpContext.User = new ClaimsPrincipal(identity);

            _httpContextAccessorMock.Setup(h => h.HttpContext).Returns(httpContext);
            var service = new CurrentUserService<IdentityUser>(_httpContextAccessorMock.Object, _optionsMock.Object);

            var result = service.GetCurrentUser();

            Assert.NotNull(result);
            Assert.Null(result.Id);
        }

        /// <summary>
        /// Verifies that GetCurrentUser successfully extracts standard claims when the user is authenticated.
        /// </summary>
        [Fact]
        public void GetCurrentUser_ShouldReturnPopulatedUser_WhenUserIsAuthenticated()
        {
            var httpContext = new DefaultHttpContext();
            var identity = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, "user-abc"),
                new Claim(ClaimTypes.Email, "user@test.com"),
                new Claim(ClaimTypes.Name, "testuser")
            }, "TestAuth");
            httpContext.User = new ClaimsPrincipal(identity);

            _httpContextAccessorMock.Setup(h => h.HttpContext).Returns(httpContext);
            var service = new CurrentUserService<IdentityUser>(_httpContextAccessorMock.Object, _optionsMock.Object);

            var result = service.GetCurrentUser();

            Assert.NotNull(result);
            Assert.Equal("user-abc", result.Id);
            Assert.Equal("user@test.com", result.Email);
            Assert.Equal("testuser", result.UserName);
        }

        /// <summary>
        /// Verifies that GetCurrentUser successfully executes custom claim mapping delegates when provided.
        /// </summary>
        [Fact]
        public void GetCurrentUser_ShouldInvokeCustomMapping_WhenProvided()
        {
            var httpContext = new DefaultHttpContext();
            var identity = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, "user-abc"),
                new Claim("CustomClaim", "CustomValue")
            }, "TestAuth");
            httpContext.User = new ClaimsPrincipal(identity);

            _options.MapCustomClaims = (principal, user) =>
            {
                user.ConcurrencyStamp = principal.FindFirst("CustomClaim")?.Value;
            };

            _httpContextAccessorMock.Setup(h => h.HttpContext).Returns(httpContext);
            var service = new CurrentUserService<IdentityUser>(_httpContextAccessorMock.Object, _optionsMock.Object);

            var result = service.GetCurrentUser();

            Assert.NotNull(result);
            Assert.Equal("user-abc", result.Id);
            Assert.Equal("CustomValue", result.ConcurrencyStamp);
        }
    }
}
