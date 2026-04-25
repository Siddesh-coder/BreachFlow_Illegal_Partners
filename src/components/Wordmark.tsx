import { Link } from "react-router-dom";
import logoMark from "@/assets/breachguard-mark.png";

export function Wordmark({
  className = "",
  size = 22,
  showMark = true,
}: {
  className?: string;
  size?: number;
  showMark?: boolean;
}) {
  return (
    <Link
      to="/"
      className={`inline-flex items-center gap-2 hover:opacity-70 transition-opacity ${className}`}
    >
      {showMark && (
        <img
          src={logoMark}
          alt="BreachGuard logo"
          width={size * 1.6}
          height={size * 1.6}
          style={{ width: size * 1.6, height: size * 1.6 }}
          className="object-contain"
        />
      )}
      <span
        style={{
          fontFamily: "'Jost', sans-serif",
          fontSize: size * 0.78,
          letterSpacing: "0.2em",
          fontWeight: 400,
          textTransform: "uppercase",
          lineHeight: 1,
        }}
      >
        BreachGuard
      </span>
    </Link>
  );
}
