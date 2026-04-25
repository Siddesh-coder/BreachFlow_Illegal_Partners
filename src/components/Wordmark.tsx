import { Link } from "react-router-dom";

export function Wordmark({ className = "", size = 22 }: { className?: string; size?: number }) {
  return (
    <Link
      to="/"
      className={`font-serif tracking-wide hover:opacity-70 transition-opacity ${className}`}
      style={{ fontSize: size, letterSpacing: "0.04em" }}
    >
      BreachGuard
    </Link>
  );
}
