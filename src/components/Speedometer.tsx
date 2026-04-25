type Tone = "danger" | "warning" | "success";

interface SpeedometerProps {
  count: number;
  total: number;
  tone: Tone;
  label: string;
}

// Single semi-circular gauge with the count rendered at the visual center.
export function Speedometer({ count, total, tone, label }: SpeedometerProps) {
  const ratio = total > 0 ? Math.max(0, Math.min(1, count / total)) : 0;

  // Geometry — viewBox sized so nothing is clipped.
  const w = 220;
  const h = 150;
  const cx = w / 2;
  const cy = 120; // baseline of the semi-circle
  const r = 80;
  const stroke = 14;

  const colorVar =
    tone === "danger"
      ? "hsl(var(--destructive))"
      : tone === "warning"
      ? "hsl(var(--warning))"
      : "hsl(var(--success))";

  // Arc geometry — sweep from left (180°) clockwise to right (360°).
  const startA = Math.PI;
  const endA = Math.PI + ratio * Math.PI;

  const start = { x: cx + r * Math.cos(startA), y: cy + r * Math.sin(startA) };
  const end = { x: cx + r * Math.cos(endA), y: cy + r * Math.sin(endA) };
  const trackEnd = { x: cx + r * Math.cos(2 * Math.PI), y: cy + r * Math.sin(2 * Math.PI) };

  const largeArc = ratio > 0.5 ? 1 : 0;

  return (
    <div className="flex flex-col items-center w-full">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-[220px]">
        {/* Track */}
        <path
          d={`M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${trackEnd.x} ${trackEnd.y}`}
          stroke="hsl(var(--border))"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
        />
        {/* Filled portion */}
        {ratio > 0 && (
          <path
            d={`M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`}
            stroke={colorVar}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
          />
        )}
        {/* Centered count — sits inside the arc */}
        <text
          x={cx}
          y={cy - 14}
          textAnchor="middle"
          fontFamily="Instrument Serif, serif"
          fontSize="48"
          fill="hsl(var(--foreground))"
        >
          {count}
        </text>
      </svg>
      <div className="mt-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
