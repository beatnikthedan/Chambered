using System;
using System.ComponentModel.DataAnnotations;
using System.Reflection;

namespace Chambered.Data.Extensions
{
    public static class EnumExtensions
    {
        public static string GetDisplayName(this Enum enumValue)
        {
            if (enumValue == null) return string.Empty;

            var type = enumValue.GetType();
            var memberInfo = type.GetMember(enumValue.ToString());
            if (memberInfo.Length > 0)
            {
                var displayAttribute = memberInfo[0].GetCustomAttribute<DisplayAttribute>();
                if (displayAttribute != null)
                {
                    return displayAttribute.Name ?? enumValue.ToString();
                }
            }
            return enumValue.ToString();
        }

        public static string GetFlagsDisplayName(this Enum enumValue)
        {
            if (enumValue == null) return string.Empty;

            var parts = new System.Collections.Generic.List<string>();
            foreach (Enum value in Enum.GetValues(enumValue.GetType()))
            {
                // Skip the "None" or 0 flag if other flags are set
                if (Convert.ToInt64(value) == 0) continue;

                if (enumValue.HasFlag(value))
                {
                    parts.Add(value.GetDisplayName());
                }
            }

            if (parts.Count == 0) return "None";
            return string.Join(", ", parts);
        }

        public static T ParseEnumWithDisplay<T>(string value) where T : struct, Enum
        {
            if (string.IsNullOrWhiteSpace(value)) return default;

            // Try standard parsing first
            if (Enum.TryParse<T>(value, true, out var result))
            {
                return result;
            }

            // Fallback to matching with DisplayAttribute names
            foreach (T enumValue in Enum.GetValues<T>())
            {
                if (string.Equals(enumValue.GetDisplayName(), value, StringComparison.OrdinalIgnoreCase))
                {
                    return enumValue;
                }
            }

            return default;
        }

        public static T ParseFlagsEnumWithDisplay<T>(string value) where T : struct, Enum
        {
            if (string.IsNullOrWhiteSpace(value)) return default;

            long result = 0;
            var parts = value.Split(new[] { ',', '|' }, StringSplitOptions.RemoveEmptyEntries);
            foreach (var part in parts)
            {
                var trimmed = part.Trim();
                var parsed = ParseEnumWithDisplay<T>(trimmed);
                result |= Convert.ToInt64(parsed);
            }

            return (T)Enum.ToObject(typeof(T), result);
        }
    }
}
