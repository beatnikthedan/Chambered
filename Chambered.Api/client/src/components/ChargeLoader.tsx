import React from "react";

export default function ChargeLadder() {
  const data = [
    {
      weight: "40.6 gr",
      value: "2,661",
      sd: "SD 9.4",
      barColor: "#b98a28",
      fillWidth: "58%",
      active: false,
    },
    {
      weight: "41.0 gr",
      value: "2,689",
      sd: "SD 7.1",
      barColor: "#b98a28",
      fillWidth: "65%",
      active: false,
    },
    {
      weight: "41.4 gr",
      value: "2,712",
      sd: "SD 5.2",
      barColor: "#0ea76e",
      fillWidth: "82%",
      active: true,
    },
    {
      weight: "41.8 gr",
      value: "2,741",
      sd: "stiff bolt",
      barColor: "#cb7933",
      fillWidth: "75%",
      active: false,
    },
  ];

  return (
    <div
      style={{
        fontFamily: "monospace",
        padding: "40px",
        backgroundColor: "#09090b",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
      }}
    >
      {/* Outer Box */}
      <div
        style={{
          width: "100%",
          maxWidth: "540px",
          padding: "24px",
          backgroundColor: "#18181b",
          border: "2 border-dashed #3f3f46",
          borderStyle: "dashed",
          borderWidth: "2px",
          borderColor: "rgba(113, 113, 122, 0.6)",
          borderRadius: "24px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        }}
      >
        {/* Header */}
        <h1
          style={{
            color: "#d97706",
            fontSize: "14px",
            fontWeight: "bold",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: "24px",
            marginTop: 0,
          }}
        >
          CHARGE LADDER
        </h1>

        {/* Rows Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "auto 1fr auto auto",
            columnGap: "24px",
            rowGap: "16px",
            alignItems: "center",
          }}
        >
          {data.map((item, index) => (
            <React.Fragment key={index}>
              {/* Column 1: Weight */}
              <span
                style={{
                  fontSize: "16px",
                  fontWeight: 500,
                  color: item.active ? "#facc15" : "#e0e7ff",
                }}
              >
                {item.weight}
              </span>

              {/* Column 2: Bar */}
              <div
                style={{
                  position: "relative",
                  height: "24px",
                  backgroundColor: "#27272a",
                  borderRadius: "9999px",
                  overflow: "hidden",
                  border: "1px solid rgba(63, 63, 70, 0.5)",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    height: "100%",
                    borderRadius: "9999px",
                    backgroundColor: item.barColor,
                    width: item.fillWidth,
                  }}
                />
              </div>

              {/* Column 3: Velocity */}
              <span
                style={{
                  fontSize: "16px",
                  fontWeight: "bold",
                  textAlign: "right",
                  color: item.active ? "#12b981" : "#ffffff",
                }}
              >
                {item.value}
              </span>

              {/* Column 4: SD or Comment */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span style={{ color: "#e0e7ff" }}>•</span>
                <span
                  style={{
                    fontSize: "16px",
                    fontWeight: 500,
                    color:
                      item.sd === "stiff bolt"
                        ? "#fb923c"
                        : item.active
                          ? "#12b981"
                          : "#e0e7ff",
                  }}
                >
                  {item.sd}
                </span>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
