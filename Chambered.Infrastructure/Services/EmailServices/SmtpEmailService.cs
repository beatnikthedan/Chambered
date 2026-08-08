using Chambered.Core.Services;
using Chambered.Infrastructure.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;
using System.Net.Mail;

namespace Chambered.Infrastructure.Services.EmailServices
{
    /// <summary>
    /// SMTP-backed implementation of <see cref="IEmailService"/> powered by MailKit.
    /// Supports commercial providers (Mailjet, SendGrid) and self-hosted homelab setups (Mailcow, Mailpit).
    /// </summary>
    public class SmtpEmailService : IEmailService
    {
        private readonly EmailConfiguration _options;
        private readonly ILogger<SmtpEmailService> _logger;

        /// <summary>
        /// Initializes a new instance of the <see cref="SmtpEmailService"/> class.
        /// </summary>
        /// <param name="options">The snapshot options supplier for retrieving <see cref="EmailConfiguration"/>.</param>
        /// <param name="logger">The logger instance for diagnostics and error reporting.</param>
        /// <exception cref="ArgumentNullException">Thrown if <paramref name="options"/> is <c>null</c>.</exception>
        public SmtpEmailService(IOptionsSnapshot<EmailConfiguration> options, ILogger<SmtpEmailService> logger)
        {
            _options = options?.Get(GetType().Name) ?? options?.Value
                       ?? throw new ArgumentNullException(nameof(options));
            _logger = logger;
        }

        /// <inheritdoc/>
        /// <exception cref="ArgumentNullException">Thrown when <paramref name="message"/> is <c>null</c>.</exception>
        public async Task<bool> SendEmailAsync(MailMessage message, CancellationToken cancellationToken = default)
        {
            if (message == null) throw new ArgumentNullException(nameof(message));

            try
            {
                var mimeMessage = ConvertToMimeMessage(message);

                using var smtp = new MailKit.Net.Smtp.SmtpClient();

                // Bypass SSL/TLS certificate validation for self-hosted homelab endpoints if configured
                if (_options.AllowInvalidCertificates)
                {
                    smtp.ServerCertificateValidationCallback = (s, c, ch, e) => true;
                }

                // Establish connection to host
                await smtp.ConnectAsync(_options.Host, _options.Port, _options.SecurityOption, cancellationToken);

                // Perform authentication if credentials are supplied
                if (!string.IsNullOrEmpty(_options.UserName) || !string.IsNullOrEmpty(_options.Password))
                {
                    await smtp.AuthenticateAsync(_options.UserName, _options.Password, cancellationToken);
                }

                // Send the email message
                var response = await smtp.SendAsync(mimeMessage, cancellationToken);
                _logger.LogInformation("Email sent successfully to {Recipients}. Response: {Response}",
                    mimeMessage.To, response);

                // Gracefully disconnect from the server
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
        /// Converts a .NET <see cref="MailMessage"/> into a MailKit <see cref="MimeMessage"/>.
        /// </summary>
        /// <param name="message">The source <see cref="MailMessage"/> object.</param>
        /// <returns>A fully constructed <see cref="MimeMessage"/> including headers, body parts, and attachments.</returns>
        private MimeMessage ConvertToMimeMessage(MailMessage message)
        {
            var email = new MimeMessage();

            // Configure From Address
            if (message.From != null)
            {
                email.From.Add(new MailboxAddress(message.From.DisplayName ?? string.Empty, message.From.Address));
            }
            else if (!string.IsNullOrEmpty(_options.DefaultFromAddress))
            {
                email.From.Add(new MailboxAddress(_options.DefaultFromDisplayName ?? string.Empty, _options.DefaultFromAddress));
            }

            // Map Primary Recipients
            foreach (var to in message.To)
            {
                email.To.Add(new MailboxAddress(to.DisplayName ?? string.Empty, to.Address));
            }

            // Map Carbon Copy (CC) Recipients
            foreach (var cc in message.CC)
            {
                email.Cc.Add(new MailboxAddress(cc.DisplayName ?? string.Empty, cc.Address));
            }

            // Map Blind Carbon Copy (BCC) Recipients
            foreach (var bcc in message.Bcc)
            {
                email.Bcc.Add(new MailboxAddress(bcc.DisplayName ?? string.Empty, bcc.Address));
            }

            // Map Reply-To Addresses
            foreach (var replyTo in message.ReplyToList)
            {
                email.ReplyTo.Add(new MailboxAddress(replyTo.DisplayName ?? string.Empty, replyTo.Address));
            }

            email.Subject = message.Subject ?? string.Empty;

            // Construct Body Content & Attachments
            var builder = new BodyBuilder();
            if (message.IsBodyHtml)
            {
                builder.HtmlBody = message.Body;
            }
            else
            {
                builder.TextBody = message.Body;
            }

            // Map File Attachments
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