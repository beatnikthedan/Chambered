namespace Chambered.Data.Enums
{
    /// <summary>
    /// Specifies the physical locking mechanism type used on a storage vault.
    /// </summary>
    public enum LockType
    {
        None = 0,
        ElectronicKeypad = 1,
        MechanicalDial = 2,
        BiometricScanner = 3,
        DualKeySystem = 4,
        PhysicalKeyLock = 5,
        RfidTransponder = 6,
        OpenCabinet = 7,
        ActionLock = 8
    }
}
