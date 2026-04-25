type Tone = "danger" | "warning" | "success";

interface SpeedometerProps {
  count: number;
  total: number;
  tone: Tone;
  label: string;
}

// Single semi-circular gauge with count centered.
export function Speedometer({ count, total, tone, label }: SpeedometerProps) {
  const ratio = total > 0 ? Math.max(0, Math.min(1, count / total)) : 0;

  const w = 220;
  const h = 140;
  const cx = w / 2;
  const cy = h - 20;
  const r = 90;

  const colorVar =
    tone === "danger" ? "hsl(var(--destructive))"
    : tone === "warning" ? "hsl(var(--warning))"
    : "hsl(var(--success))";

  // Arc geometry
  const startA = Math.PI; // 180°
  const endA = Math.PI + ratio * Math.PI;

  const start = { x: cx + r * Math.cos(startA), y: cy + r * Math.sin(startA) };
  const end = { x: cx + r * Math.cos(endA), y: cy + r * Math.sin(endA) };
  const fullEnd = { x: cx + r * Math.cos(2 * Math.PI), y: cy + r * Math.sin(2 * Math.PI) };

  const largeArc = ratio > 0.5 ? 1 : 0;

  return (
    <div className="flex flex-col items-center">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-[220px]">
        {/* Track */}
        <path
          d={`M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${fullEnd.x} ${fullEnd.y}`}
          stroke="hsl(var(--border))"
          strokeWidth={12}
          fill="none"
          strokeLinecap="round"
        />
        {/* Filled portion */}
        {ratio > 0 && (
          <path
            d={`M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`}
            stroke={colorVar}
            strokeWidth={12}
            fill="none"
            strokeLinecap="round"
          />
        )}
        {/* Centered count */}
        <text
          x={cx}
          y={cy - 18}
          textAnchor="middle"
          fontFamily="Instrument Serif, serif"
          fontSize="44"
          fill="hsl(var(--foreground))"
        >
          {count}
        </text>
        <text
          x={cx}
          y={cy - 2}
          textAnchor="middle"
          fontFamily="Instrument Sans, sans-serif"
          fontSize="9"
          letterSpacing="2"
          fill="hsl(var(--muted-foreground))"
        >
          {label.toUpperCase()}
        </text>
      </svg>
    </div>
  );
}
