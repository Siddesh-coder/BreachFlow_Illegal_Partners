import { useEffect, useState } from "react";
import { useApp } from "@/state/AppContext";

export function ApiSetupModal() {
  const { hasApiKeys, saveApiKeys } = useApp();
  const [open, setOpen] = useState(!hasApiKeys);
  const [gemini, setGemini] = useState("");
  const [ldh, setLdh] = useState("sFf4KDTWTAVUKsL6lfdkN7WWlkqoZW0O1fHE6F4I-5k");

  useEffect(() => {
    setOpen(!hasApiKeys);
  }, [hasApiKeys]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-[2px] p-6 animate-fade-in">
      <div className="w-full max-w-[520px] bg-card border border-border shadow-card p-12 animate-fade-in">
        <h2 className="font-serif text-[28px] leading-tight">Welcome to BreachGuard</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Please enter your API keys to activate the platform.
        </p>

        <div className="mt-10 space-y-8">
          <Field
            label="Gemini API Key"
            value={gemini}
            onChange={setGemini}
            placeholder="AIza..."
            type="password"
          />
          <Field
            label="Otto Schmidt API Token"
            value={ldh}
            onChange={setLdh}
            placeholder="Token"
            type="password"
          />
        </div>

        <button
          onClick={() => {
            saveApiKeys(gemini.trim(), ldh.trim());
            setOpen(false);
          }}
          disabled={!gemini.trim() || !ldh.trim()}
          className="mt-10 w-full bg-primary text-primary-foreground py-3 text-xs uppercase tracking-[0.18em] hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors rounded-sm"
        >
          Activate BreachGuard
        </button>

        <p className="mt-6 text-[11px] text-muted-foreground text-center">
          Keys are stored locally in your browser only.
        </p>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, type = "text",
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full bg-transparent border-0 border-b border-border focus:border-primary outline-none py-2 text-base text-foreground placeholder:text-muted-foreground/50 transition-colors"
      />
    </label>
  );
}
