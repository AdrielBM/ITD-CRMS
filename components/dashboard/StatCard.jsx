export default function StatCard({ label, value, tone = "neutral", hint }) {
  const borderColors = {
    neutral: "#ddd",
    orange: "#e67e22",
    red: "#c0392b",
    green: "#27ae60",
  };

  const valueColors = {
    neutral: "#222",
    orange: "#d35400",
    red: "#c0392b",
    green: "#27ae60",
  };

  return (
    <div
      className="system-card"
      style={{
        borderTop: `4px solid ${borderColors[tone] ?? borderColors.neutral}`,
        padding: "24px 28px",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 12,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.8px",
          color: "#888",
        }}
      >
        {label}
      </p>
      <p
        style={{
          margin: "8px 0 0 0",
          fontSize: 30,
          fontWeight: 700,
          color: valueColors[tone] ?? valueColors.neutral,
        }}
      >
        {value}
      </p>
      {hint && (
        <p style={{ margin: "4px 0 0 0", fontSize: 12, color: "#999" }}>{hint}</p>
      )}
    </div>
  );
}
