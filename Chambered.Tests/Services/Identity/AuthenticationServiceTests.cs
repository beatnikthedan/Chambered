using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Chambered.Core.Services;
using Chambered.Core.Services.Identity.Dto;
using Chambered.Data;
using Chambered.Infrastructure.Configuration;
using Chambered.Infrastructure.Services.Identity;
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
    /// Contains unit tests for the <see cref="AuthenticationService"/> class.
    /// </summary>
    public class AuthenticationServiceTests
    {
        private readonly Mock<UserManager<ChamberedUser>> _userManagerMock;
        private readonly Mock<SignInManager<ChamberedUser>> _signInManagerMock;
        private readonly Mock<RoleManager<IdentityRole>> _roleManagerMock;
        private readonly Mock<IEmailService> _emailServiceMock;
        private readonly Mock<IConfiguration> _configurationMock;
        private readonly Mock<IOptions<IdentityConfiguration>> _identityOptionsMock;
        private readonly Mock<ILogger<AuthenticationService>> _loggerMock;
        private readonly AuthenticationService _authenticationService;

        public AuthenticationServiceTests()
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

            _emailServiceMock = new Mock<IEmailService>();
            _configurationMock = new Mock<IConfiguration>();
            _identityOptionsMock = new Mock<IOptions<IdentityConfiguration>>();
            _loggerMock = new Mock<ILogger<AuthenticationService>>();

            _identityOptionsMock.Setup(o => o.Value).Returns(new IdentityConfiguration
            {
                Website = "https://localhost",
                DefaultEmailAddress = "no-reply@test.com"
            });

            _configurationMock.Setup(c => c["Jwt:Key"]).Returns("super-secret-key-32-chars-long-12345");
            _configurationMock.Setup(c => c["Jwt:Issuer"]).Returns("ChamberedIssuer");
            _configurationMock.Setup(c => c["Jwt:ExpireDays"]).Returns("7");

            _authenticationService = new AuthenticationService(
                _signInManagerMock.Object,
                _userManagerMock.Object,
                _roleManagerMock.Object,
                _emailServiceMock.Object,
                _configurationMock.Object,
                _identityOptionsMock.Object,
                _loggerMock.Object);
        }

        [Fact]
        public async Task LoginAsync_ShouldThrowUnauthorizedException_WhenUserDoesNotExist()
        {
            // Arrange
            var request = new LoginRequestDto("nonexistent@test.com", "Password123!", false);
            _userManagerMock.Setup(u => u.FindByEmailAsync(request.Email))
                .ReturnsAsync((ChamberedUser?)null);

            // Act & Assert
            await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _authenticationService.LoginAsync(request));
        }

        [Fact]
        public async Task LoginAsync_ShouldReturnResponseDto_WhenCredentialsAreValid()
        {
            // Arrange
            var user = new ChamberedUser
            {
                Id = "user-123",
                Email = "user@test.com",
                UserName = "user@test.com"
            };

            var request = new LoginRequestDto("user@test.com", "Password123!", false);

            _userManagerMock.Setup(u => u.FindByEmailAsync(request.Email))
                .ReturnsAsync(user);

            _signInManagerMock.Setup(s => s.CheckPasswordSignInAsync(user, request.Password, false))
                .ReturnsAsync(SignInResult.Success);

            _userManagerMock.Setup(u => u.GetRolesAsync(user))
                .ReturnsAsync(new List<string> { "User" });

            // Act
            var response = await _authenticationService.LoginAsync(request);

            // Assert
            Assert.NotNull(response);
            Assert.Equal(user.Id, response.UserId);
            Assert.Equal(user.Email, response.Email);
            Assert.Empty(response.AccessToken);
            _signInManagerMock.Verify(s => s.SignInAsync(user, false, null), Times.Once);
            Assert.Contains("User", response.Roles);
        }

        [Fact]
        public async Task LogoutAsync_ShouldSignOutSuccessfully()
        {
            // Act
            await _authenticationService.LogoutAsync("user-123");

            // Assert
            _signInManagerMock.Verify(s => s.SignOutAsync(), Times.Once);
        }

        [Fact]
        public async Task IsInitializedAsync_ShouldReturnFalse_WhenNoUsersExist()
        {
            // Arrange
            var users = new List<ChamberedUser>().AsQueryable();
            var mockQueryable = new TestAsyncEnumerable<ChamberedUser>(users);
            _userManagerMock.Setup(u => u.Users).Returns(mockQueryable);

            // Act
            var result = await _authenticationService.IsInitializedAsync();

            // Assert
            Assert.False(result);
        }

        [Fact]
        public async Task IsInitializedAsync_ShouldReturnTrue_WhenAtLeastOneUserExists()
        {
            // Arrange
            var users = new List<ChamberedUser> { new ChamberedUser() }.AsQueryable();
            var mockQueryable = new TestAsyncEnumerable<ChamberedUser>(users);
            _userManagerMock.Setup(u => u.Users).Returns(mockQueryable);

            // Act
            var result = await _authenticationService.IsInitializedAsync();

            // Assert
            Assert.True(result);
        }
    }

    internal class TestAsyncQueryProvider<TEntity> : Microsoft.EntityFrameworkCore.Query.IAsyncQueryProvider
    {
        private readonly IQueryProvider _inner;

        internal TestAsyncQueryProvider(IQueryProvider inner)
        {
            _inner = inner;
        }

        public IQueryable CreateQuery(System.Linq.Expressions.Expression expression)
        {
            return new TestAsyncEnumerable<TEntity>(expression);
        }

        public IQueryable<TElement> CreateQuery<TElement>(System.Linq.Expressions.Expression expression)
        {
            return new TestAsyncEnumerable<TElement>(expression);
        }

        public object Execute(System.Linq.Expressions.Expression expression)
        {
            return _inner.Execute(expression);
        }

        public TResult Execute<TResult>(System.Linq.Expressions.Expression expression)
        {
            return _inner.Execute<TResult>(expression);
        }

        public TResult ExecuteAsync<TResult>(System.Linq.Expressions.Expression expression, System.Threading.CancellationToken cancellationToken = default)
        {
            var expectedResultType = typeof(TResult).GetGenericArguments()[0];
            var executionResult = typeof(IQueryProvider)
                .GetMethods()
                .First(method => method.Name == nameof(IQueryProvider.Execute) && method.IsGenericMethod)
                .MakeGenericMethod(expectedResultType)
                .Invoke(_inner, new object[] { expression });

            return (TResult)typeof(Task).GetMethod(nameof(Task.FromResult))
                .MakeGenericMethod(expectedResultType)
                .Invoke(null, new[] { executionResult });
        }
    }

    internal class TestAsyncEnumerable<T> : EnumerableQuery<T>, IAsyncEnumerable<T>, IQueryable<T>
    {
        public TestAsyncEnumerable(IEnumerable<T> enumerable)
            : base(enumerable)
        { }

        public TestAsyncEnumerable(System.Linq.Expressions.Expression expression)
            : base(expression)
        { }

        public IAsyncEnumerator<T> GetAsyncEnumerator(System.Threading.CancellationToken cancellationToken = default)
        {
            return new TestAsyncEnumerator<T>(this.AsEnumerable().GetEnumerator());
        }

        IQueryProvider IQueryable.Provider => new TestAsyncQueryProvider<T>(this);
    }

    internal class TestAsyncEnumerator<T> : IAsyncEnumerator<T>
    {
        private readonly IEnumerator<T> _inner;

        public TestAsyncEnumerator(IEnumerator<T> inner)
        {
            _inner = inner;
        }

        public T Current => _inner.Current;

        public ValueTask DisposeAsync()
        {
            _inner.Dispose();
            return ValueTask.CompletedTask;
        }

        public ValueTask<bool> MoveNextAsync()
        {
            return new ValueTask<bool>(_inner.MoveNext());
        }
    }
}
