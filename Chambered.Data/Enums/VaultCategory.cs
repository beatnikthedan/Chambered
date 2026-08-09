using System.ComponentModel.DataAnnotations;

namespace Chambered.Data.Enums
{
    /// <summary>
    /// Specifies the category or type of secure storage unit or locking mechanism.
    /// </summary>
    public enum VaultCategory
    {
        /// <summary>
        /// Default or unknown vault category.
        /// </summary>
        [Display(Name = "Unknown", Description = "Default or unspecified vault category.")]
        Unknown,

        /// <summary>
        /// A safe installed into or flush with a floor.
        /// </summary>
        [Display(Name = "Floor Safe", Description = "A safe built into the flooring structure.")]
        FloorSafe,

        /// <summary>
        /// A safe mounted inside or flush with a wall.
        /// </summary>
        [Display(Name = "Wall Safe", Description = "A safe mounted within a wall cavity.")]
        WallSafe,

        /// <summary>
        /// A small, portable, or mountable locking storage box.
        /// </summary>
        [Display(Name = "Lock Box", Description = "A compact, portable lockable storage box.")]
        LockBox,

        /// <summary>
        /// A secure storage unit installed within a vehicle.
        /// </summary>
        [Display(Name = "Vehicle Safe", Description = "A secure container mounted inside a vehicle.")]
        Vehicle,

        /// <summary>
        /// A locked cabinet, such as a metal gun cabinet.
        /// </summary>
        [Display(Name = "Cabinet", Description = "A locked storage cabinet.")]
        Cabinet,

        /// <summary>
        /// A reinforced room or vault door area designed for secure storage.
        /// </summary>
        [Display(Name = "Secure Room", Description = "A dedicated secure room or walk-in vault.")]
        SecureRoom,

        /// <summary>
        /// A soft-sided padded case equipped with a locking mechanism.
        /// </summary>
        [Display(Name = "Soft Case", Description = "A padded, flexible case with lockable closures.")]
        SoftCase,

        /// <summary>
        /// A hard-shell protective case equipped with latches or padlock points.
        /// </summary>
        [Display(Name = "Hard Case", Description = "A rigid protective case with locking capability.")]
        HardCase,

        /// <summary>
        /// A physical lock that secures the action or mechanism of a firearm or device.
        /// </summary>
        [Display(Name = "Action Lock", Description = "A locking mechanism that prevents the action from operating.")]
        ActionLock,

        /// <summary>
        /// A lock attached around a trigger guard to prevent pulling the trigger.
        /// </summary>
        [Display(Name = "Trigger Lock", Description = "A lock fitted over a trigger guard to block access to the trigger.")]
        TriggerLock
    }
}
