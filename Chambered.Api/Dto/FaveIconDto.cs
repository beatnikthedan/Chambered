namespace Chambered.Api.Dto
{
    /// <summary>
    /// Represents the resolved favicon file transfer object.
    /// </summary>
    public class FaveIconDto
    {
        /// <summary>
        /// Gets or sets the base64-encoded binary data of the favicon.
        /// </summary>
        public string Base64Data { get; set; } = string.Empty;
        /// <summary>
        /// Gets or sets the media content type of the image.
        /// </summary>
        public string ContentType { get; set; } = "image/x-icon";
    }
}
