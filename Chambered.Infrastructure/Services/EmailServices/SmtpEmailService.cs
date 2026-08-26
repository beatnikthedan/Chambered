using BeatnikToolKit.Services;
using Chambered.Core.Services;
using Chambered.Infrastructure.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;
using System.Net.Mail;
using System.Text.RegularExpressions;

namespace Chambered.Infrastructure.Services.EmailServices
{
    /// <summary>
    /// Provides an SMTP implementation of the <see cref="IEmailService"/> interface using MailKit.
    /// Supports cloud providers (Mailjet, SendGrid, Postmark) and self-hosted SMTP relays.
    /// </summary>
    public class SmtpEmailService : IEmailService
    {
        /// <summary>
        /// The configured email settings retrieved from application configuration.
        /// </summary>
        private readonly EmailConfiguration _options;

        /// <summary>
        /// The logger instance for recording operational diagnostics and errors.
        /// </summary>
        private readonly ILogger<SmtpEmailService> _logger;

        /// <summary>
        /// Initializes a new instance of the <see cref="SmtpEmailService"/> class.
        /// </summary>
        /// <param name="options">The options snapshot used to access <see cref="EmailConfiguration"/> settings.</param>
        /// <param name="logger">The logger instance for operational diagnostics.</param>
        /// <exception cref="ArgumentNullException">
        /// Thrown when <paramref name="options"/> or its <see cref="IOptionsSnapshot{T}.Value"/> is <c>null</c>.
        /// </exception>
        public SmtpEmailService(IOptionsSnapshot<EmailConfiguration> options, ILogger<SmtpEmailService> logger)
        {
            _options = options?.Value ?? throw new ArgumentNullException(nameof(options));
            _logger = logger;
        }

        /// <inheritdoc />
        /// <summary>
        /// Asynchronously sends an email message via SMTP using MailKit.
        /// </summary>
        /// <param name="message">The email message details to send.</param>
        /// <param name="cancellationToken">A token to monitor for cancellation requests.</param>
        /// <returns>
        /// A task representing the asynchronous operation. The task result is <c>true</c> if the email was sent successfully; otherwise, <c>false</c>.
        /// </returns>
        /// <exception cref="ArgumentNullException">Thrown when <paramref name="message"/> is <c>null</c>.</exception>
        public async Task<bool> SendEmailAsync(MailMessage message, CancellationToken cancellationToken = default)
        {
            if (message == null) throw new ArgumentNullException(nameof(message));

            try
            {
                var mimeMessage = ConvertToMimeMessage(message);

                using var smtp = new MailKit.Net.Smtp.SmtpClient();

                // Allow custom certificate validation for self-hosted/homelab endpoints if configured
                if (_options.AllowInvalidCertificates)
                {
                    smtp.ServerCertificateValidationCallback = (s, c, ch, e) => true;
                }

                // Connect using explicit configured socket options (e.g. StartTls for port 587)
                await smtp.ConnectAsync(_options.Host, _options.Port, _options.SecurityOption, cancellationToken);

                // Authenticate if credentials are provided
                if (!string.IsNullOrEmpty(_options.UserName) || !string.IsNullOrEmpty(_options.Password))
                {
                    await smtp.AuthenticateAsync(_options.UserName, _options.Password, cancellationToken);
                }

                // Send message payload
                var response = await smtp.SendAsync(mimeMessage, cancellationToken);

                _logger.LogInformation("Email sent successfully to {Recipients}. Response: {Response}",
                    mimeMessage.To, response);

                await smtp.DisconnectAsync(true, cancellationToken);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send email to {Recipients} via {Host}:{Port}",
                    message.To, _options.Host, _options.Port);
                return false;
            }
        }

        /// <summary>
        /// Converts a .NET <see cref="MailMessage"/> into an RFC 5322 compliant MailKit <see cref="MimeMessage"/>.
        /// Creates a clean <c>multipart/alternative</c> body structure for HTML messages.
        /// </summary>
        /// <param name="message">The source <see cref="MailMessage"/> object.</param>
        /// <returns>A constructed <see cref="MimeMessage"/> containing configured headers and body parts.</returns>
        private MimeMessage ConvertToMimeMessage(MailMessage message)
        {
            var email = new MimeMessage();

            // Explicit RFC Headers
            email.Date = DateTimeOffset.UtcNow;
            email.MessageId = MimeKit.Utils.MimeUtils.GenerateMessageId();

            // Configure From Address
            string fromAddress = message.From?.Address ?? _options.DefaultFromAddress;
            string fromName = message.From?.DisplayName ?? _options.DefaultFromDisplayName;

            email.From.Add(string.IsNullOrWhiteSpace(fromName)
                ? MailboxAddress.Parse(fromAddress)
                : new MailboxAddress(fromName, fromAddress));

            // Configure To Recipients
            foreach (var to in message.To)
            {
                email.To.Add(string.IsNullOrWhiteSpace(to.DisplayName)
                    ? MailboxAddress.Parse(to.Address)
                    : new MailboxAddress(to.DisplayName, to.Address));
            }

            // Configure CC Recipients
            foreach (var cc in message.CC)
            {
                email.Cc.Add(string.IsNullOrWhiteSpace(cc.DisplayName)
                    ? MailboxAddress.Parse(cc.Address)
                    : new MailboxAddress(cc.DisplayName, cc.Address));
            }

            // Configure BCC Recipients
            foreach (var bcc in message.Bcc)
            {
                email.Bcc.Add(string.IsNullOrWhiteSpace(bcc.DisplayName)
                    ? MailboxAddress.Parse(bcc.Address)
                    : new MailboxAddress(bcc.DisplayName, bcc.Address));
            }

            // Sanitize Subject line
            email.Subject = (message.Subject ?? string.Empty).Replace("\r", "").Replace("\n", "").Trim();

            // Construct Body Content
            var builder = new BodyBuilder();
            string rawBody = message.Body ?? string.Empty;

            if (message.IsBodyHtml)
            {
                builder.HtmlBody = rawBody;

                // Provide a clean plain-text fallback by stripping tags
                string plainTextFallback = Regex.Replace(rawBody, "<.*?>", string.Empty).Trim();
                builder.TextBody = plainTextFallback;
            }
            else
            {
                builder.TextBody = rawBody;
            }

            // Add File Attachments if present
            if (message.Attachments != null && message.Attachments.Count > 0)
            {
                foreach (var attachment in message.Attachments)
                {
                    builder.Attachments.Add(attachment.Name, attachment.ContentStream);
                }
            }

            email.Body = builder.ToMessageBody();
            return email;
        }
    }
}