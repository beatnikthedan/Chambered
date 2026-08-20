using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Chambered.Data.Utility
{
    /// <summary>
    /// <see cref="ValueConverter"/> used to convert a database string to an assembly type
    /// </summary>
    internal class TypeConverter : ValueConverter<Type, string>
    {
        /// <summary>
        /// <see cref="ValueConverter"/> used to convert a database string to an assembly type
        /// </summary>
        /// <param name="nameSpace">Namespace of class to convert to/from</param>
        /// <param name="assembly">Assembly of class to convert to/from</param>
        public TypeConverter(string nameSpace, string assembly) : base(v => v.Name, v => Type.GetType($"{nameSpace}.{v}, {assembly}")) { }
    }
}
