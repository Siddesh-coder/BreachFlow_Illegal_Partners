import { Link } from "react-router-dom";
import { Wordmark } from "@/components/Wordmark";

const Legal = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between px-10 py-8 border-b border-border">
        <Wordmark size={20} />
        <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Legal Counsel Workspace
        </span>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-[640px] text-center animate-fade-in">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Phase 2
          </div>
          <h1 className="mt-4 font-serif text-[36px] leading-tight">
            Legal Counsel Workspace
          </h1>
          <p className="mt-5 text-sm text-muted-foreground leading-relaxed">
            Case Files, Classification, Draft Review, and Privilege Log will live
            here. The IndicatorScoreboard and DeadlinePanel components are already
            in place and will be reused inside the Case File detail view.
          </p>
          <div className="mt-10 flex items-center justify-center gap-3">
            <Link
              to="/"
              className="inline-block border border-border px-5 py-2.5 text-[11px] uppercase tracking-[0.18em] rounded-sm hover:bg-accent transition-colors"
            >
              ← Home
            </Link>
            <Link
              to="/dpo"
              className="inline-block border border-primary text-primary px-5 py-2.5 text-[11px] uppercase tracking-[0.18em] rounded-sm hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              View DPO dashboard
            </Link>
          </div>

          <div className="mt-10 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            ⚠ Legal classification reserved for Legal Counsel
          </div>
        </div>
      </main>
    </div>
  );
};

export default Legal;
