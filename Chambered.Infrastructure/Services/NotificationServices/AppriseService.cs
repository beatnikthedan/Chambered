using Chambered.Core.Services;
using Chambered.Core.Services.Models;
using Chambered.Infrastructure.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Net.Http.Json;

namespace Chambered.Infrastructure.Services.NotificationServices
{
    /// <summary>
    /// Apprise API implementation of <see cref="IAppriseService"/>.
    /// Dispatches multi-channel alerts to self-hosted Apprise containers.
    /// </summary>
    public class AppriseService : IAppriseService
    {
        private readonly AppriseConfiguration _options;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<AppriseService> _logger;

        /// <summary>
        /// Initializes a new instance of the <see cref="AppriseService"/> class.
        /// </summary>
        /// <param name="options">The options snapshot supplier for retrieving <see cref="AppriseConfiguration"/>.</param>
        /// <param name="httpClientFactory">The HTTP client factory instance for creating outbound web requests.</param>
        /// <param name="logger">The logger instance for diagnostics and error reporting.</param>
        /// <exception cref="ArgumentNullException">Thrown if <paramref name="options"/> or <paramref name="httpClientFactory"/> is <c>null</c>.</exception>
        public AppriseService(
            IOptionsSnapshot<AppriseConfiguration> options,
            IHttpClientFactory httpClientFactory,
            ILogger<AppriseService> logger)
        {
            _options = _options = options?.Value ?? throw new ArgumentNullException(nameof(options));
            _httpClientFactory = httpClientFactory ?? throw new ArgumentNullException(nameof(httpClientFactory));
            _logger = logger;
        }

        /// <inheritdoc/>
        /// <exception cref="ArgumentNullException">Thrown when <paramref name="message"/> is <c>null</c>.</exception>
        public async Task<bool> SendNotificationAsync(AppriseNotificationMessage message, CancellationToken cancellationToken = default)
        {
            if (message == null) throw new ArgumentNullException(nameof(message));

            try
            {
                var endpointUri = BuildRequestEndpoint(_options.HostUrl, _options.NotificationKey);

                using var client = CreateHttpClient();

                // Construct payload supported by Apprise REST API
                var payload = new Dictionary<string, object>
                {
                    { "title", message.Title ?? string.Empty },
                    { "body", message.Body ?? string.Empty },
                    { "type", message.Type ?? "info" }
                };

                // Add optional target services (stateless mode)
                if (!string.IsNullOrWhiteSpace(_options.TargetUrls))
                {
                    payload.Add("urls", _options.TargetUrls);
                }

                // Add optional tagging filtering
                if (message.Tags != null && message.Tags.Any())
                {
                    payload.Add("tag", string.Join(",", message.Tags));
                }

                _logger.LogDebug("Sending notification via Apprise to endpoint: {Endpoint}", endpointUri);

                var response = await client.PostAsJsonAsync(endpointUri, payload, cancellationToken);

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("Successfully dispatched notification via Apprise to {Endpoint}", endpointUri);
                    return true;
                }

                var errorDetails = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogWarning("Apprise returned non-success status code {StatusCode}. Details: {Details}",
                    response.StatusCode, errorDetails);

                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send notification via Apprise server at {HostUrl}", _options.HostUrl);
                return false;
            }
        }

        /// <summary>
        /// Builds the appropriate Apprise REST endpoint based on host URL and state keys.
        /// </summary>
        private static Uri BuildRequestEndpoint(string hostUrl, string notificationKey)
        {
            if (string.IsNullOrWhiteSpace(hostUrl))
            {
                throw new InvalidOperationException("Apprise HostUrl must be configured.");
            }

            var baseUri = new Uri(hostUrl.TrimEnd('/') + "/");

            if (!string.IsNullOrWhiteSpace(notificationKey))
            {
                return new Uri(baseUri, $"notify/{notificationKey.Trim('/')}");
            }

            // Fallback: If hostUrl doesn't end with /notify and no key provided, append /notify
            if (!baseUri.AbsolutePath.EndsWith("/notify", StringComparison.OrdinalIgnoreCase) &&
                !baseUri.AbsolutePath.EndsWith("/notify/", StringComparison.OrdinalIgnoreCase))
            {
                return new Uri(baseUri, "notify");
            }

            return baseUri;
        }

        /// <summary>
        /// Instantiates an <see cref="HttpClient"/> instance, optionally relaxing SSL/TLS certificate validation.
        /// </summary>
        private HttpClient CreateHttpClient()
        {
            HttpClient client;

            if (_options.AllowInvalidCertificates)
            {
                var handler = new HttpClientHandler
                {
                    ServerCertificateCustomValidationCallback = (sender, cert, chain, sslPolicyErrors) => true
                };
                client = new HttpClient(handler);
            }
            else
            {
                client = _httpClientFactory.CreateClient("AppriseClient");
            }

            client.Timeout = TimeSpan.FromSeconds(_options.TimeoutSeconds > 0 ? _options.TimeoutSeconds : 10);
            return client;
        }
    }
}
