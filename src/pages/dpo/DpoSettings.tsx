import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/state/AppContext";

const DpoSettings = () => {
  const { saveApiKeys, signOutUser, user } = useApp();
  const navigate = useNavigate();
  const [ldh, setLdh] = useState(localStorage.getItem("LDH_TOKEN") ?? "");

  return (
    <div className="px-12 py-10 max-w-[800px] mx-auto animate-fade-in">
      <h1 className="font-serif text-[36px] leading-tight">Settings</h1>

      <section className="mt-10 bg-card border border-border shadow-card p-8 rounded-sm">
        <h2 className="font-serif text-xl">API Keys</h2>
        <p className="text-xs text-muted-foreground mt-1">Stored locally in your browser only.</p>

        <div className="mt-8 space-y-6">
          <Field label="Gemini API Key" value={gemini} onChange={setGemini} />
          <Field label="Otto Schmidt API Token" value={ldh} onChange={setLdh} />
        </div>

        <button
          onClick={() => saveApiKeys(gemini.trim(), ldh.trim())}
          className="mt-8 bg-primary text-primary-foreground px-6 py-2.5 text-xs uppercase tracking-[0.18em] rounded-sm hover:bg-primary/90"
        >
          Save Keys
        </button>
      </section>

      <section className="mt-8 bg-card border border-border shadow-card p-8 rounded-sm">
        <h2 className="font-serif text-xl">Account</h2>
        <p className="text-sm text-muted-foreground mt-2">{user ? `Signed in as ${user.name} (${user.email})` : "Not signed in"}</p>
        <button
          onClick={() => { signOutUser(); navigate("/"); }}
          className="mt-6 border border-primary text-primary px-4 py-2 text-[11px] uppercase tracking-[0.16em] rounded-sm hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          Sign Out
        </button>
      </section>
    </div>
  );
};

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full bg-transparent border-0 border-b border-border focus:border-primary outline-none py-2 text-sm"
      />
    </label>
  );
}

export default DpoSettings;
