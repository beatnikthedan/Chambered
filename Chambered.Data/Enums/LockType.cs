using System.ComponentModel.DataAnnotations;

namespace Chambered.Data.Enums
{
    /// <summary>
    /// Specifies the physical locking mechanism type used on a storage vault.
    /// </summary>
    public enum LockType
    {
        [Display(Name = "None")]
        None = 0,
        [Display(Name = "Electronic Keypad")]
        ElectronicKeypad = 1,
        [Display(Name = "Mechanical Dial")]
        MechanicalDial = 2,
        [Display(Name = "Biometric Scanner")]
        BiometricScanner = 3,
        [Display(Name = "Dual Key System")]
        DualKeySystem = 4,
        [Display(Name = "Physical Key Lock")]
        PhysicalKeyLock = 5,
        [Display(Name = "RFID Transponder")]
        RfidTransponder = 6,
        [Display(Name = "Open Cabinet")]
        OpenCabinet = 7,
        [Display(Name = "Action Lock")]
        ActionLock = 8
    }
}
