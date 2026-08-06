using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using System.Security.Cryptography;
using System.Text;

namespace Chambered.Data.Utility
{
    /// <summary>
    /// Reusable EF Core ValueConverter that transparently encrypts strings on database write 
    /// and decrypts them on database read using AES-256-CBC with an embedded IV.
    /// </summary>
    public class SymmetricEncryptionConverter : ValueConverter<string?, string?>
    {
        public SymmetricEncryptionConverter()
            : base(
                v => EncryptPasscode(v),
                v => DecryptPasscode(v))
        {
        }

        private static string? EncryptPasscode(string? plainText)
        {
            if (string.IsNullOrEmpty(plainText))
            {
                return null;
            }

            byte[] key = GetMasterKey();

            using var aes = Aes.Create();
            aes.Key = key;
            aes.GenerateIV();

            using var encryptor = aes.CreateEncryptor();
            byte[] plainBytes = Encoding.UTF8.GetBytes(plainText);
            byte[] cipherBytes = encryptor.TransformFinalBlock(plainBytes, 0, plainBytes.Length);

            byte[] combinedResult = new byte[aes.IV.Length + cipherBytes.Length];
            Buffer.BlockCopy(aes.IV, 0, combinedResult, 0, aes.IV.Length);
            Buffer.BlockCopy(cipherBytes, 0, combinedResult, aes.IV.Length, cipherBytes.Length);

            return Convert.ToBase64String(combinedResult);
        }

        private static string? DecryptPasscode(string? combinedBase64)
        {
            if (string.IsNullOrEmpty(combinedBase64))
            {
                return null;
            }

            byte[] combinedResult = Convert.FromBase64String(combinedBase64);
            byte[] key = GetMasterKey();

            using var aes = Aes.Create();
            aes.Key = key;

            byte[] iv = new byte[16];
            byte[] cipherBytes = new byte[combinedResult.Length - 16];

            Buffer.BlockCopy(combinedResult, 0, iv, 0, 16);
            Buffer.BlockCopy(combinedResult, 16, cipherBytes, 0, cipherBytes.Length);

            aes.IV = iv;

            using var decryptor = aes.CreateDecryptor();
            byte[] plainBytes = decryptor.TransformFinalBlock(cipherBytes, 0, cipherBytes.Length);

            return Encoding.UTF8.GetString(plainBytes);
        }

        private static byte[] GetMasterKey()
        {
            string? keyString = Environment.GetEnvironmentVariable("ARMORY_ENCRYPTION_KEY");

            if (string.IsNullOrEmpty(keyString))
            {
                keyString = "4A7F92B0C81D3E5F6A8B0C2D4E6F8A1B3C5D7E9F0A2B4C6D8E0F1A3B5C7D9E1F";
            }

            return Convert.FromHexString(keyString);
        }
    }
}
