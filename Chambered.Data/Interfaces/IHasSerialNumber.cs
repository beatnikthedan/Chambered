using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Chambered.Data.Interfaces
{
    public interface IHasSerialNumber
    {
        /// <summary>
        /// Gets or sets the manufacturer-stamped unique serial number.
        /// </summary>
        string SerialNumber { get; set; }
    }
}
