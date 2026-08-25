using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Chambered.Core.Services.Models
{
    /// <summary>
    /// Represents the resolved image bytes and metadata of a favicon.
    /// </summary>
    public class FaveIconResult
    {
        /// <summary>
        /// Gets or sets the image raw byte data.
        /// </summary>
        public byte[] ImageBytes { get; set; } = Array.Empty<byte>();
        /// <summary>
        /// Gets or sets the HTTP content type (e.g., image/x-icon, image/png).
        /// </summary>
        public string ContentType { get; set; } = "image/x-icon";
    }
}
