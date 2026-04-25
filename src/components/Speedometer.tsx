// Semi-circular speedometer SVG. value: 0..1
export function Speedometer({ value }: { value: number }) {
  const v = Math.max(0, Math.min(1, value));
  const w = 360;
  const h = 200;
  const cx = w / 2;
  const cy = h - 20;
  const r = 150;

  // Needle angle: 180° at left to 360°/0° at right
  const angleDeg = 180 + v * 180;
  const angleRad = (angleDeg * Math.PI) / 180;
  const nx = cx + (r - 20) * Math.cos(angleRad);
  const ny = cy + (r - 20) * Math.sin(angleRad);

  // Three colored arcs (each 60° of the 180° gauge)
  const arc = (startDeg: number, endDeg: number, color: string) => {
    const a1 = ((180 + startDeg) * Math.PI) / 180;
    const a2 = ((180 + endDeg) * Math.PI) / 180;
    const x1 = cx + r * Math.cos(a1);
    const y1 = cy + r * Math.sin(a1);
    const x2 = cx + r * Math.cos(a2);
    const y2 = cy + r * Math.sin(a2);
    return (
      <path
        d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`}
        stroke={color}
        strokeWidth={14}
        fill="none"
        strokeLinecap="butt"
      />
    );
  };

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-[420px]">
      {/* Track background */}
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        stroke="hsl(var(--border))"
        strokeWidth={14}
        fill="none"
      />
      {arc(0, 60, "hsl(var(--success))")}
      {arc(60, 120, "hsl(var(--warning))")}
      {arc(120, 180, "hsl(var(--destructive))")}

      {/* Tick labels */}
      <text x={cx - r + 8} y={cy + 24} fontSize="10" fill="hsl(var(--muted-foreground))" letterSpacing="2" fontFamily="Instrument Sans">LOW</text>
      <text x={cx - 22} y={28} fontSize="10" fill="hsl(var(--muted-foreground))" letterSpacing="2" fontFamily="Instrument Sans">MEDIUM</text>
      <text x={cx + r - 36} y={cy + 24} fontSize="10" fill="hsl(var(--muted-foreground))" letterSpacing="2" fontFamily="Instrument Sans">HIGH</text>

      {/* Needle */}
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="hsl(var(--primary))" strokeWidth={2.5} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={6} fill="hsl(var(--primary))" />
    </svg>
  );
}
