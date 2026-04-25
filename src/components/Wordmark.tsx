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
          width={size * 1.15}
          height={size * 1.15}
          style={{ width: size * 1.15, height: size * 1.15 }}
          className="object-contain"
        />
      )}
      <span
        style={{
          fontFamily: "'Italiana', 'Cormorant Garamond', serif",
          fontSize: size,
          letterSpacing: "0.22em",
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
