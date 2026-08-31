using BeatnikToolKit.GitVersioning.Configuration;
using BeatnikToolKit.GitVersioning.Exceptions;
using BeatnikToolKit.GitVersioning.Services;
using BeatnikToolKit.GitVersioning.ValueObjects;
using Microsoft.Extensions.Caching.Hybrid;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Moq.Protected;
using System.Net;
using System.Text.Json;

namespace BeatnikToolKit.Tests.GitVersioning
{
    /// <summary>
    /// Contains unit tests verifying the caching, API parsing, and HTTP mapping behaviors of GitHubReleaseService.
    /// </summary>
    public class GitHubReleaseServiceTests
    {
        private readonly Mock<HttpMessageHandler> _httpMessageHandlerMock;
        private readonly Mock<IOptions<GitHubReleaseConfiguration>> _optionsMock;
        private readonly Mock<ILogger<GitHubReleaseService>> _loggerMock;
        private readonly Mock<HybridCache> _cacheMock;
        private readonly GitHubReleaseConfiguration _config;

        /// <summary>
        /// Initializes mocks and transparent HybridCache configurations.
        /// </summary>
        public GitHubReleaseServiceTests()
        {
            _httpMessageHandlerMock = new Mock<HttpMessageHandler>();
            _optionsMock = new Mock<IOptions<GitHubReleaseConfiguration>>();
            _loggerMock = new Mock<ILogger<GitHubReleaseService>>();
            _cacheMock = new Mock<HybridCache>();

            _config = new GitHubReleaseConfiguration
            {
                RepositoryOwner = "owner",
                RepositoryName = "repo",
                UserAgent = "TestUserAgent"
            };
            _optionsMock.Setup(o => o.Value).Returns(_config);

            // Transparent factory execution for HybridCache mock
            _cacheMock.Setup(c => c.GetOrCreateAsync(
                It.IsAny<string>(),
                It.IsAny<Func<CancellationToken, ValueTask<GitHubRelease>>>(),
                It.IsAny<HybridCacheEntryOptions>(),
                It.IsAny<IEnumerable<string>>(),
                It.IsAny<CancellationToken>()))
                .Returns(async (string key, Func<CancellationToken, ValueTask<GitHubRelease>> factory, HybridCacheEntryOptions options, IEnumerable<string> tags, CancellationToken token) =>
                    await factory(token));

            _cacheMock.Setup(c => c.GetOrCreateAsync(
                It.IsAny<string>(),
                It.IsAny<Func<CancellationToken, ValueTask<List<GitHubRelease>>>>(),
                It.IsAny<HybridCacheEntryOptions>(),
                It.IsAny<IEnumerable<string>>(),
                It.IsAny<CancellationToken>()))
                .Returns(async (string key, Func<CancellationToken, ValueTask<List<GitHubRelease>>> factory, HybridCacheEntryOptions options, IEnumerable<string> tags, CancellationToken token) =>
                    await factory(token));
        }

        private HttpClient CreateHttpClient()
        {
            return new HttpClient(_httpMessageHandlerMock.Object);
        }

        private GitHubRelease CreateSampleRelease(string tag, bool prerelease = false)
        {
            return new GitHubRelease
            {
                TagName = tag,
                Name = $"Release {tag}",
                Url = "https://api.github.com/release/1",
                AssetsUrl = "https://api.github.com/release/1/assets",
                UploadUrl = "https://api.github.com/release/1/assets",
                HtmlUrl = "https://github.com/release/1",
                NodeId = "node_1",
                TargetCommitish = "main",
                TarballUrl = "https://api.github.com/tarball",
                ZipballUrl = "https://api.github.com/zipball",
                Body = "Release body content",
                Prerelease = prerelease,
                Author = new GitHubAuthor
                {
                    Login = "author",
                    AvatarUrl = "https://avatar",
                    HtmlUrl = "https://github/author",
                    NodeId = "author_node",
                    Type = "User",
                    UserViewType = "public"
                },
                Assets = new List<GitHubAsset>()
            };
        }

        /// <summary>
        /// Verifies that GetReleaseByTag returns the parsed release with IsLatest mapped correctly when the API succeeds.
        /// </summary>
        [Fact]
        public async Task GetReleaseByTag_ShouldReturnRelease_WhenApiSucceeds()
        {
            var expectedRelease = CreateSampleRelease("v1.0.0");
            var json = JsonSerializer.Serialize(expectedRelease);

            _httpMessageHandlerMock.Protected()
                .Setup<Task<HttpResponseMessage>>("SendAsync",
                    ItExpr.Is<HttpRequestMessage>(req => req.RequestUri!.ToString().Contains("/tags/v1.0.0")),
                    ItExpr.IsAny<CancellationToken>())
                .ReturnsAsync(new HttpResponseMessage
                {
                    StatusCode = HttpStatusCode.OK,
                    Content = new StringContent(json)
                });

            var latestStable = CreateSampleRelease("v1.0.0");
            var latestJson = JsonSerializer.Serialize(latestStable);
            _httpMessageHandlerMock.Protected()
                .Setup<Task<HttpResponseMessage>>("SendAsync",
                    ItExpr.Is<HttpRequestMessage>(req => req.RequestUri!.ToString().EndsWith("/latest")),
                    ItExpr.IsAny<CancellationToken>())
                .ReturnsAsync(new HttpResponseMessage
                {
                    StatusCode = HttpStatusCode.OK,
                    Content = new StringContent(latestJson)
                });

            var service = new GitHubReleaseService(CreateHttpClient(), _optionsMock.Object, _loggerMock.Object, _cacheMock.Object);

            var result = await service.GetReleaseByTag("v1.0.0");

            Assert.NotNull(result);
            Assert.Equal("v1.0.0", result.TagName);
            Assert.True(result.IsLatest);
        }

        /// <summary>
        /// Verifies that GetReleaseByTag throws a GitHubReleaseNotFoundException when the API returns HTTP 404.
        /// </summary>
        [Fact]
        public async Task GetReleaseByTag_ShouldThrowNotFoundException_WhenApiReturns404()
        {
            _httpMessageHandlerMock.Protected()
                .Setup<Task<HttpResponseMessage>>("SendAsync",
                    ItExpr.IsAny<HttpRequestMessage>(),
                    ItExpr.IsAny<CancellationToken>())
                .ReturnsAsync(new HttpResponseMessage
                {
                    StatusCode = HttpStatusCode.NotFound
                });

            var service = new GitHubReleaseService(CreateHttpClient(), _optionsMock.Object, _loggerMock.Object, _cacheMock.Object);

            await Assert.ThrowsAsync<GitHubReleaseNotFoundException>(() =>
                service.GetReleaseByTag("v9.9.9"));
        }

        /// <summary>
        /// Verifies that GetLatestRelease returns the parsed release when includePrerelease is false.
        /// </summary>
        [Fact]
        public async Task GetLatestRelease_ShouldReturnRelease_WhenIncludePrereleaseIsFalse()
        {
            var expectedRelease = CreateSampleRelease("v2.0.0");
            var json = JsonSerializer.Serialize(expectedRelease);

            _httpMessageHandlerMock.Protected()
                .Setup<Task<HttpResponseMessage>>("SendAsync",
                    ItExpr.Is<HttpRequestMessage>(req => req.RequestUri!.ToString().EndsWith("/latest")),
                    ItExpr.IsAny<CancellationToken>())
                .ReturnsAsync(new HttpResponseMessage
                {
                    StatusCode = HttpStatusCode.OK,
                    Content = new StringContent(json)
                });

            var service = new GitHubReleaseService(CreateHttpClient(), _optionsMock.Object, _loggerMock.Object, _cacheMock.Object);

            var result = await service.GetLatestRelease(includePrerelease: false);

            Assert.NotNull(result);
            Assert.Equal("v2.0.0", result.TagName);
            Assert.True(result.IsLatest);
        }

        /// <summary>
        /// Verifies that GetReleaseHistory filters out prereleases when includePrerelease is false.
        /// </summary>
        [Fact]
        public async Task GetReleaseHistory_ShouldFilterPrereleases_WhenRequested()
        {
            var releaseList = new List<GitHubRelease>
            {
                CreateSampleRelease("v2.0.0-beta", prerelease: true),
                CreateSampleRelease("v1.5.0", prerelease: false)
            };
            var json = JsonSerializer.Serialize(releaseList);

            _httpMessageHandlerMock.Protected()
                .Setup<Task<HttpResponseMessage>>("SendAsync",
                    ItExpr.Is<HttpRequestMessage>(req => req.RequestUri!.ToString().EndsWith("/releases")),
                    ItExpr.IsAny<CancellationToken>())
                .ReturnsAsync(new HttpResponseMessage
                {
                    StatusCode = HttpStatusCode.OK,
                    Content = new StringContent(json)
                });

            var service = new GitHubReleaseService(CreateHttpClient(), _optionsMock.Object, _loggerMock.Object, _cacheMock.Object);

            var result = await service.GetReleaseHistory(includePrerelease: false);

            Assert.NotNull(result);
            var list = result.ToList();
            Assert.Single(list);
            Assert.Equal("v1.5.0", list.First().TagName);
            Assert.True(list.First().IsLatest);
        }
    }
}
