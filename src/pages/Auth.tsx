import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wordmark } from "@/components/Wordmark";
import { signIn } from "@/services/auth";
import { useApp } from "@/state/AppContext";

const Auth = () => {
  const navigate = useNavigate();
  const { signInUser, signInAnonymously } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    // FIREBASE_AUTH_PLACEHOLDER — using stub that routes by role
    const user = await signIn(email, password);
    signInUser(user);
    setLoading(false);
    const dest =
      user.role === "dpo" ? "/dpo" : user.role === "legal" ? "/legal" : "/employee";
    navigate(dest);
  };

  const handleAnonymous = () => {
    signInAnonymously();
    navigate("/employee");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between px-10 py-8">
        <Wordmark size={20} />
        <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Confidential intake</span>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 pb-16">
        <div className="w-full max-w-[480px] bg-card border border-border shadow-card p-12 animate-fade-in">
          <h1 className="font-serif text-[28px] leading-tight">How would you like to proceed?</h1>
          <p className="mt-3 text-sm text-muted-foreground">Your report is confidential and encrypted.</p>

          {/* Sign in */}
          <section className="mt-10">
            <h2 className="font-serif text-[18px]">Sign In</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Access your organization's account for a complete report.
            </p>
            <form onSubmit={handleSignIn} className="mt-6 space-y-6">
              <Underline label="Email" value={email} onChange={setEmail} type="email" placeholder="you@firm.eu" />
              <Underline label="Password" value={password} onChange={setPassword} type="password" placeholder="••••••••" />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground py-3 text-xs uppercase tracking-[0.18em] hover:bg-primary/90 transition-colors rounded-sm disabled:opacity-50"
              >
                {loading ? "Signing in…" : "Continue with Sign In"}
              </button>
              <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
                Tip: emails containing "dpo" route to the DPO dashboard. Otherwise routes to the employee portal.
              </p>
            </form>
          </section>

          <Divider />

          {/* Anonymous */}
          <section>
            <h2 className="font-serif text-[18px]">Continue Anonymously</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              No account needed. Your identity will not be recorded.
            </p>
            <button
              onClick={handleAnonymous}
              className="mt-6 w-full border border-primary text-primary py-3 text-xs uppercase tracking-[0.18em] hover:bg-primary hover:text-primary-foreground transition-colors rounded-sm"
            >
              Report Anonymously
            </button>
          </section>
        </div>
      </main>
    </div>
  );
};

function Underline({
  label, value, onChange, type = "text", placeholder,
}: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full bg-transparent border-0 border-b border-border focus:border-primary outline-none py-2 text-sm placeholder:text-muted-foreground/40 transition-colors"
      />
    </label>
  );
}

function Divider() {
  return (
    <div className="my-10 flex items-center gap-4">
      <div className="flex-1 h-px bg-border" />
      <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">or</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

export default Auth;
