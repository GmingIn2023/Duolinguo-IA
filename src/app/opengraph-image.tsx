import { ImageResponse } from "next/og";

export const alt = "Gusgus.ia — Apprends l'IA comme une langue";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const CHIPS = [
  { label: "Cours à pratiquer", color: "#ffd43b" },
  { label: "Quiz qui expliquent", color: "#ff6b2c" },
  { label: "Révisions espacées", color: "#3bd671" },
];

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f1f1ee",
          padding: "64px 72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "baseline", fontSize: 44, letterSpacing: "-0.03em", color: "#000000" }}>
            gusgus<span style={{ fontSize: 28 }}>.ia</span>
          </div>
          <div style={{ display: "flex", fontSize: 24, color: "#66665f" }}>Way of Learning AI</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 82, lineHeight: 1.05, letterSpacing: "-0.035em", color: "#000000", maxWidth: 980 }}>
            Apprends l&apos;IA comme une langue.
          </div>
          <div style={{ display: "flex", marginTop: 26, fontSize: 30, lineHeight: 1.35, color: "#3a3a37", maxWidth: 900 }}>
            Des cours courts, des quiz qui expliquent tes erreurs et des révisions qui reviennent avant que tu oublies.
          </div>
        </div>

        <div style={{ display: "flex", gap: 16 }}>
          {CHIPS.map((chip) => (
            <div
              key={chip.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: "#ffffff",
                border: "2px solid #d3d3cc",
                borderRadius: 999,
                padding: "14px 24px",
                fontSize: 24,
                color: "#000000",
              }}
            >
              <div style={{ display: "flex", width: 16, height: 16, borderRadius: 999, background: chip.color }} />
              {chip.label}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
