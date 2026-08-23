using System;
using System.Security.Cryptography;
using System.Text;

namespace Chambered.Core.Utility
{
    /// <summary>
    /// Provides utility methods for generating and hashing secure API keys.
    /// </summary>
    public static class ApiKeyGenerator
    {
        /// <summary>
        /// Computes a SHA256 hash of the provided raw API key.
        /// </summary>
        public static string HashKey(string rawKey)
        {
            var inputBytes = Encoding.UTF8.GetBytes(rawKey);
            var hashBytes = SHA256.HashData(inputBytes);
            return Convert.ToBase64String(hashBytes);
        }

        /// <summary>
        /// Creates a new cryptographically secure API key and its corresponding hash.
        /// </summary>
        public static (string RawKey, string Hash) CreateKey()
        {
            var bytes = RandomNumberGenerator.GetBytes(32);
            string rawKey = Convert.ToBase64String(bytes)
                .Replace("/", "").Replace("+", "").Replace("=", "");

            return (rawKey, HashKey(rawKey));
        }
    }
}
