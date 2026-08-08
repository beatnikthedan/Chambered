using Chambered.Core.Extensions;
using System.Net.Mail;

namespace Chambered.Core.Services
{
    /// <summary>
    /// Provides an abstraction for sending email messages asynchronously.
    /// </summary>
    public interface IEmailService
    {
        /// <summary>
        /// Sends an email message asynchronously using the configured mail provider.
        /// </summary>
        /// <param name="message">The composed <see cref="MailMessage"/> containing recipients, subject, body, and attachments.</param>
        /// <param name="cancellationToken">An optional token to monitor for cancellation requests.</param>
        /// <returns>
        /// A task representing the asynchronous operation. The task result is <c>true</c> if the message was sent successfully; otherwise, <c>false</c>.
        /// </returns>
        Task<bool> SendEmailAsync(MailMessage message, CancellationToken cancellationToken = default);
    }

    /// <summary>
    /// Extension methods for <see cref="IEmailService"/>
    /// </summary>
    public static class EmailServiceExtensions
    {
        /// <summary>
        /// Send email
        /// </summary>
        /// <param name="service"></param>
        /// <param name="from"></param>
        /// <param name="to"></param>
        /// <param name="subject"></param>
        /// <param name="body"></param>
        /// <param name="isHtml"></param>
        /// <param name="priority"></param>
        /// <param name="notificationOptions"></param>
        /// <returns></returns>
        public static async Task<bool> SendEmailAsync(this IEmailService service,
                                                MailAddress from,
                                                MailAddress to,
                                                string subject,
                                                string body,
                                                bool isHtml = false,
                                                MailPriority priority = MailPriority.Normal,
                                                DeliveryNotificationOptions notificationOptions = DeliveryNotificationOptions.None)
        {
            var message = new MailMessage()
            {
                From = from,
                Subject = subject,
                Body = body,
                IsBodyHtml = isHtml,
                Priority = priority,
                DeliveryNotificationOptions = notificationOptions
            };

            message.To.Add(to);

            return await service.SendEmailAsync(message);
        }

        /// <summary>
        /// Send email
        /// </summary>
        /// <param name="service"></param>
        /// <param name="from"></param>
        /// <param name="to"></param>
        /// <param name="subject"></param>
        /// <param name="body"></param>
        /// <param name="isHtml"></param>
        /// <param name="priority"></param>
        /// <param name="notificationOptions"></param>
        /// <returns></returns>
        public static async Task<bool> SendEmailAsync(this IEmailService service,
                                                MailAddress from,
                                                IEnumerable<MailAddress> to,
                                                string subject,
                                                string body,
                                                bool isHtml = false,
                                                MailPriority priority = MailPriority.Normal,
                                                DeliveryNotificationOptions notificationOptions = DeliveryNotificationOptions.None)
        {
            var message = new MailMessage()
            {
                From = from,
                Subject = subject,
                Body = body,
                IsBodyHtml = isHtml,
                Priority = priority,
                DeliveryNotificationOptions = notificationOptions
            };

            message.To.AddRange(to);

            return await service.SendEmailAsync(message);
        }
    }
}
