using BeatnikToolKit.EntityFramework.Configuration;
using BeatnikToolKit.EntityFramework.Services.Identity;
using BeatnikToolKit.EntityFramework.Services.Identity.Dto;
using BeatnikToolKit.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;

namespace Chambered.Tests.Services.Identity
{
    /// <summary>
    /// Contains unit tests for the <see cref="AuthenticationService"/> class.
    /// </summary>
    public class AuthenticationServiceTests
    {
        private readonly Mock<UserManager<IdentityUser>> _userManagerMock;
        private readonly Mock<SignInManager<IdentityUser>> _signInManagerMock;
        private readonly Mock<RoleManager<IdentityRole>> _roleManagerMock;
        private readonly Mock<IEmailService> _emailServiceMock;
        private readonly Mock<IOptions<IdentityConfiguration>> _identityOptionsMock;
        private readonly Mock<ILogger<AuthenticationService<IdentityUser>>> _loggerMock;
        private readonly AuthenticationService<IdentityUser> _authenticationService;

        /// <summary>
        /// Initializes a new instance of the <see cref="AuthenticationServiceTests"/> class.
        /// </summary>
        public AuthenticationServiceTests()
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

            _emailServiceMock = new Mock<IEmailService>();
            _identityOptionsMock = new Mock<IOptions<IdentityConfiguration>>();
            _loggerMock = new Mock<ILogger<AuthenticationService<IdentityUser>>>();

            _identityOptionsMock.Setup(o => o.Value).Returns(new IdentityConfiguration
            {
                Website = "https://localhost"
            });

            _authenticationService = new AuthenticationService<IdentityUser>(
                _signInManagerMock.Object,
                _userManagerMock.Object,
                _roleManagerMock.Object,
                _emailServiceMock.Object,
                _identityOptionsMock.Object,
                _loggerMock.Object);
        }

        /// <summary>
        /// Verifies that LoginAsync throws an UnauthorizedAccessException when the specified user email is not found.
        /// </summary>
        [Fact]
        public async Task LoginAsync_ShouldThrowUnauthorizedException_WhenUserDoesNotExist()
        {
            var request = new LoginRequestDto("nonexistent@test.com", "Password123!", false);
            _userManagerMock.Setup(u => u.FindByEmailAsync(request.Email))
                .ReturnsAsync((IdentityUser?)null);

            await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _authenticationService.LoginAsync(request));
        }

        /// <summary>
        /// Verifies that LoginAsync returns a valid response details DTO when valid credentials are provided.
        /// </summary>
        [Fact]
        public async Task LoginAsync_ShouldReturnResponseDto_WhenCredentialsAreValid()
        {
            var user = new IdentityUser
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

            var response = await _authenticationService.LoginAsync(request);

            Assert.NotNull(response);
            Assert.Equal(user.Id, response.UserId);
            Assert.Equal(user.Email, response.Email);
            Assert.Empty(response.AccessToken);
            _signInManagerMock.Verify(s => s.SignInAsync(user, false, null), Times.Once);
            Assert.Contains("User", response.Roles);
        }

        /// <summary>
        /// Verifies that LogoutAsync successfully invokes SignOutAsync on the underlying sign-in manager.
        /// </summary>
        [Fact]
        public async Task LogoutAsync_ShouldSignOutSuccessfully()
        {
            await _authenticationService.LogoutAsync("user-123");

            _signInManagerMock.Verify(s => s.SignOutAsync(), Times.Once);
        }

        /// <summary>
        /// Verifies that IsInitializedAsync returns false when there are no users in the database.
        /// </summary>
        [Fact]
        public async Task IsInitializedAsync_ShouldReturnFalse_WhenNoUsersExist()
        {
            var users = new List<IdentityUser>().AsQueryable();
            var mockQueryable = new TestAsyncEnumerable<IdentityUser>(users);
            _userManagerMock.Setup(u => u.Users).Returns(mockQueryable);

            var result = await _authenticationService.IsInitializedAsync();

            Assert.False(result);
        }

        /// <summary>
        /// Verifies that IsInitializedAsync returns true when at least one user exists in the database.
        /// </summary>
        [Fact]
        public async Task IsInitializedAsync_ShouldReturnTrue_WhenAtLeastOneUserExists()
        {
            var users = new List<IdentityUser> { new IdentityUser() }.AsQueryable();
            var mockQueryable = new TestAsyncEnumerable<IdentityUser>(users);
            _userManagerMock.Setup(u => u.Users).Returns(mockQueryable);

            var result = await _authenticationService.IsInitializedAsync();

            Assert.True(result);
        }

        /// <summary>
        /// Verifies that InitiateForgotPasswordAsync generates a password reset token and sends a reset email.
        /// </summary>
        [Fact]
        public async Task InitiateForgotPasswordAsync_ShouldGenerateTokenAndSendEmail_WhenUserExists()
        {
            var user = new IdentityUser { Id = "user-123", UserName = "testuser", Email = "test@user.com" };
            var request = new ForgotPasswordRequestDto("test@user.com");
 
            _userManagerMock.Setup(u => u.FindByEmailAsync(request.Email))
                .ReturnsAsync(user);
 
            _userManagerMock.Setup(u => u.GeneratePasswordResetTokenAsync(user))
                .ReturnsAsync("reset-token-abc");
 
            _emailServiceMock.Setup(e => e.SendEmailAsync(It.IsAny<System.Net.Mail.MailMessage>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(true);
 
            await _authenticationService.InitiateForgotPasswordAsync(request);
 
            _userManagerMock.Verify(u => u.GeneratePasswordResetTokenAsync(user), Times.Once);
            _emailServiceMock.Verify(e => e.SendEmailAsync(It.Is<System.Net.Mail.MailMessage>(m =>
                m.To.Count == 1 &&
                m.To[0].Address == request.Email &&
                m.Subject == "Reset Password" &&
                m.Body.Contains("change-password") &&
                m.Body.Contains("testuser")
            ), It.IsAny<CancellationToken>()), Times.Once);
        }
 
        /// <summary>
        /// Verifies that InitiateForgotPasswordAsync throws an InvalidOperationException when email sending fails.
        /// </summary>
        [Fact]
        public async Task InitiateForgotPasswordAsync_ShouldThrowException_WhenEmailServiceFails()
        {
            var user = new IdentityUser { Id = "user-123", UserName = "testuser", Email = "test@user.com" };
            var request = new ForgotPasswordRequestDto("test@user.com");
 
            _userManagerMock.Setup(u => u.FindByEmailAsync(request.Email))
                .ReturnsAsync(user);
 
            _userManagerMock.Setup(u => u.GeneratePasswordResetTokenAsync(user))
                .ReturnsAsync("reset-token-abc");
 
            _emailServiceMock.Setup(e => e.SendEmailAsync(It.IsAny<System.Net.Mail.MailMessage>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(false);
 
            await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _authenticationService.InitiateForgotPasswordAsync(request));
        }
 
        /// <summary>
        /// Verifies that ResetPasswordAsync successfully invokes UserManager password reset.
        /// </summary>
        [Fact]
        public async Task ResetPasswordAsync_ShouldInvokeReset_WhenTokenAndUserAreValid()
        {
            var user = new IdentityUser { Id = "user-123", Email = "test@user.com" };
            var request = new ResetPasswordRequestDto("test@user.com", "cmVzZXQtdG9rZW4tYWJj", "NewPassword123!");
 
            _userManagerMock.Setup(u => u.FindByEmailAsync(request.Email))
                .ReturnsAsync(user);
 
            _userManagerMock.Setup(u => u.ResetPasswordAsync(user, "reset-token-abc", request.NewPassword))
                .ReturnsAsync(IdentityResult.Success);
 
            await _authenticationService.ResetPasswordAsync(request);
 
            _userManagerMock.Verify(u => u.ResetPasswordAsync(user, "reset-token-abc", request.NewPassword), Times.Once);
        }
 
        /// <summary>
        /// Verifies that ResetPasswordAsync throws an InvalidOperationException when the reset fails.
        /// </summary>
        [Fact]
        public async Task ResetPasswordAsync_ShouldThrowException_WhenResetFails()
        {
            var user = new IdentityUser { Id = "user-123", Email = "test@user.com" };
            var request = new ResetPasswordRequestDto("test@user.com", "cmVzZXQtdG9rZW4tYWJj", "NewPassword123!");
 
            _userManagerMock.Setup(u => u.FindByEmailAsync(request.Email))
                .ReturnsAsync(user);
 
            _userManagerMock.Setup(u => u.ResetPasswordAsync(user, "reset-token-abc", request.NewPassword))
                .ReturnsAsync(IdentityResult.Failed(new IdentityError { Description = "Reset Error" }));
 
            await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _authenticationService.ResetPasswordAsync(request));
        }
 
        /// <summary>
        /// Verifies that VerifyPasswordAsync returns true when the credentials match.
        /// </summary>
        [Fact]
        public async Task VerifyPasswordAsync_ShouldReturnTrue_WhenPasswordIsValid()
        {
            var user = new IdentityUser { Id = "user-123" };
            _userManagerMock.Setup(u => u.FindByIdAsync("user-123"))
                .ReturnsAsync(user);
 
            _userManagerMock.Setup(u => u.CheckPasswordAsync(user, "Secret123!"))
                .ReturnsAsync(true);
 
            var result = await _authenticationService.VerifyPasswordAsync("user-123", "Secret123!");
 
            Assert.True(result);
        }
 
        /// <summary>
        /// Verifies that ChangePasswordAsync successfully updates the user password.
        /// </summary>
        [Fact]
        public async Task ChangePasswordAsync_ShouldInvokeChange_WhenPasswordsAreValid()
        {
            var user = new IdentityUser { Id = "user-123" };
            var request = new ChangePasswordRequestDto("OldPassword123!", "NewPassword123!");
 
            _userManagerMock.Setup(u => u.FindByIdAsync("user-123"))
                .ReturnsAsync(user);
 
            _userManagerMock.Setup(u => u.ChangePasswordAsync(user, request.OldPassword, request.NewPassword))
                .ReturnsAsync(IdentityResult.Success);
 
            await _authenticationService.ChangePasswordAsync("user-123", request);
 
            _userManagerMock.Verify(u => u.ChangePasswordAsync(user, request.OldPassword, request.NewPassword), Times.Once);
        }
 
        /// <summary>
        /// Verifies that ChangePasswordAsync throws an InvalidOperationException when the change operation fails.
        /// </summary>
        [Fact]
        public async Task ChangePasswordAsync_ShouldThrowException_WhenChangeFails()
        {
            var user = new IdentityUser { Id = "user-123" };
            var request = new ChangePasswordRequestDto("OldPassword123!", "NewPassword123!");
 
            _userManagerMock.Setup(u => u.FindByIdAsync("user-123"))
                .ReturnsAsync(user);
 
            _userManagerMock.Setup(u => u.ChangePasswordAsync(user, request.OldPassword, request.NewPassword))
                .ReturnsAsync(IdentityResult.Failed(new IdentityError { Description = "Update Error" }));
 
            await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _authenticationService.ChangePasswordAsync("user-123", request));
        }
    }

    /// <summary>
    /// Provides an asynchronous query provider implementation for unit testing.
    /// </summary>
    /// <typeparam name="TEntity">The type of entity in the query.</typeparam>
    internal class TestAsyncQueryProvider<TEntity> : Microsoft.EntityFrameworkCore.Query.IAsyncQueryProvider
    {
        private readonly IQueryProvider _inner;

        /// <summary>
        /// Initializes a new instance of the <see cref="TestAsyncQueryProvider{TEntity}"/> class.
        /// </summary>
        internal TestAsyncQueryProvider(IQueryProvider inner)
        {
            _inner = inner;
        }

        /// <inheritdoc/>
        public IQueryable CreateQuery(System.Linq.Expressions.Expression expression)
        {
            return new TestAsyncEnumerable<TEntity>(expression);
        }

        /// <inheritdoc/>
        public IQueryable<TElement> CreateQuery<TElement>(System.Linq.Expressions.Expression expression)
        {
            return new TestAsyncEnumerable<TElement>(expression);
        }

        /// <inheritdoc/>
        public object Execute(System.Linq.Expressions.Expression expression)
        {
            return _inner.Execute(expression);
        }

        /// <inheritdoc/>
        public TResult Execute<TResult>(System.Linq.Expressions.Expression expression)
        {
            return _inner.Execute<TResult>(expression);
        }

        /// <inheritdoc/>
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

    /// <summary>
    /// Represents an in-memory asynchronous enumerable collection for testing.
    /// </summary>
    /// <typeparam name="T">The collection item type.</typeparam>
    internal class TestAsyncEnumerable<T> : EnumerableQuery<T>, IAsyncEnumerable<T>, IQueryable<T>
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="TestAsyncEnumerable{T}"/> class.
        /// </summary>
        public TestAsyncEnumerable(IEnumerable<T> enumerable)
            : base(enumerable)
        { }

        /// <summary>
        /// Initializes a new instance of the <see cref="TestAsyncEnumerable{T}"/> class.
        /// </summary>
        public TestAsyncEnumerable(System.Linq.Expressions.Expression expression)
            : base(expression)
        { }

        /// <inheritdoc/>
        public IAsyncEnumerator<T> GetAsyncEnumerator(System.Threading.CancellationToken cancellationToken = default)
        {
            return new TestAsyncEnumerator<T>(this.AsEnumerable().GetEnumerator());
        }

        /// <inheritdoc/>
        IQueryProvider IQueryable.Provider => new TestAsyncQueryProvider<T>(this);
    }

    /// <summary>
    /// Represents an asynchronous enumerator wrapper over standard enumerator instances for testing.
    /// </summary>
    /// <typeparam name="T">The type of elements to enumerate.</typeparam>
    internal class TestAsyncEnumerator<T> : IAsyncEnumerator<T>
    {
        private readonly IEnumerator<T> _inner;

        /// <summary>
        /// Initializes a new instance of the <see cref="TestAsyncEnumerator{T}"/> class.
        /// </summary>
        public TestAsyncEnumerator(IEnumerator<T> inner)
        {
            _inner = inner;
        }

        /// <inheritdoc/>
        public T Current => _inner.Current;

        /// <inheritdoc/>
        public ValueTask DisposeAsync()
        {
            _inner.Dispose();
            return ValueTask.CompletedTask;
        }

        /// <inheritdoc/>
        public ValueTask<bool> MoveNextAsync()
        {
            return new ValueTask<bool>(_inner.MoveNext());
        }
    }
}
