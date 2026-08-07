namespace Chambered.Data.Enums
{
    /// <summary>
    /// Specifies the physical condition rating of an armory item based on Bluebook percentage condition values.
    /// </summary>
    public enum ItemCondition
    {
        Unknown = 0,
        Unfired = 100,
        Excellent = 98,
        VeryGood = 95,
        Good = 90,
        Fair = 80,
        Serviceable = 70,
        Poor = 60,
        Salvage = 50,
    }
}
