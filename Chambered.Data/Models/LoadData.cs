namespace Chambered.Data.Models
{
    /// <summary>
    /// Represents a tested, reproducible reloading recipe/load data.
    /// </summary>
    public class LoadData : ModelBase<int>, IItemIdentifier
    {
        #region IItemIdentifier

        /// <inheritdoc/>
        public string Name { get; set; } = string.Empty;

        /// <inheritdoc/>
        public string? Description { get; set; } = string.Empty;

        #endregion

        #region Component FKs (Products)

        public int CasingId { get; set; }
        public Casing Casing { get; set; } = null!;

        public int PowderId { get; set; }
        public Powder Powder { get; set; } = null!;

        public int ProjectileId { get; set; }
        public Projectile Projectile { get; set; } = null!;

        public int PrimerId { get; set; }
        public Primer Primer { get; set; } = null!;

        #endregion

        #region Load Data Specifications

        public string Notes { get; set; }
        
        /// <summary>
        /// checked if the load has been verified or if it's a work in progress load
        /// </summary>
        public bool Proven { get; set; }

        /// <summary>
        /// Powder charge weight in grains (e.g., 42.5 gr).
        /// </summary>
        public decimal PowderChargeGrains { get; set; }

        /// <summary>
        /// Cartridge Overall Length (COAL) in inches.
        /// </summary>
        public decimal CoalInches { get; set; }

        /// <summary>
        /// Distance to lands / Ogive length measurement in inches (optional precision metric).
        /// </summary>
        public decimal? CbtoInches { get; set; }

        /// <summary>
        /// Estimated or measured muzzle velocity in FPS.
        /// </summary>
        public int? EstimatedVelocityFps { get; set; }

        public int? MeasuredVelocityFps { get; set; }
        public int? MeasuredPressurePsi { get; set; }

        /// <summary>
        /// Estimated chamber pressure in PSI / CUP.
        /// </summary>
        public int? EstimatedPressurePsi { get; set; }

        #endregion

        ICollection<PewArmoryItem> PewArmoryItems { get; set; } = new List<PewArmoryItem>();
        ICollection<PowderLadder> PowderLadders { get; set; } = new List<PowderLadder>();
        ICollection<SeatingDepths> SeatingDepths { get; set; } = new List<SeatingDepths>();
    }

    public class PowderLadder : ModelBase<int>, IItemIdentifier
    {
        #region IItemIdentifier

        /// <inheritdoc/>
        public string Name { get; set; } = string.Empty;

        /// <inheritdoc/>
        public string? Description { get; set; } = string.Empty;

        #endregion

        public decimal PowderChargeGrains { get; set; }

        public int LoadDataId { get; set; }
        public LoadData LoadData { get; set; }
    }

    public class SeatingDepths : ModelBase<int>, IItemIdentifier
    {
        #region IItemIdentifier

        /// <inheritdoc/>
        public string Name { get; set; } = string.Empty;

        /// <inheritdoc/>
        public string? Description { get; set; } = string.Empty;

        #endregion

        public decimal CoalInches { get; set; }

        public int LoadDataId { get; set; }
        public LoadData LoadData { get; set; }
    }
}
