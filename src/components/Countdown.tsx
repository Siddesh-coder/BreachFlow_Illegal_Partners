import { useEffect, useState } from "react";

// 72h GDPR Art. 33 deadline countdown.
export function Countdown({ from }: { from: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const deadline = new Date(from).getTime() + 72 * 3600 * 1000;
  const remaining = deadline - now;
  const expired = remaining <= 0;
  const abs = Math.abs(remaining);
  const hours = Math.floor(abs / 3600000);
  const minutes = Math.floor((abs % 3600000) / 60000);
  const seconds = Math.floor((abs % 60000) / 1000);

  let toneCls = "text-success";
  if (!expired) {
    if (remaining < 6 * 3600 * 1000) toneCls = "text-destructive";
    else if (remaining < 24 * 3600 * 1000) toneCls = "text-warning";
  } else {
    toneCls = "text-destructive";
  }

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="bg-card border border-border shadow-card rounded-sm p-8">
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">GDPR Art. 33 Notification Deadline</div>
      <div className={`mt-3 font-serif text-[56px] leading-none tabular-nums ${toneCls}`}>
        {expired ? "−" : ""}{pad(hours)}:{pad(minutes)}:{pad(seconds)}
      </div>
      <div className="mt-3 text-xs text-muted-foreground">
        {expired ? "Deadline passed. Notification still required if applicable." : "Time remaining from initial discovery."}
      </div>
    </div>
  );
}
