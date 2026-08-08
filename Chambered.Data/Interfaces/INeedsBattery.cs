using Chambered.Data.Enums;

namespace Chambered.Data.Interfaces
{
    /// <summary>
    /// Represents a catalog product type that requires physical battery power configurations.
    /// </summary>
    public interface INeedsBattery
    {
        bool HasBattery { get; set; }
        BatteryType BatteryType { get; set; }
    }
}
