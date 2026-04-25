import { Link } from "react-router-dom";
import { Wordmark } from "@/components/Wordmark";

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-10 py-8">
        <Wordmark size={22} />
        <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          EU GDPR Compliance Platform
        </span>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-[920px] text-center animate-fade-in-slow">
          <h1 className="font-serif text-[52px] sm:text-[68px] md:text-[80px] leading-[1.02] tracking-[-0.02em] font-semibold">
            Data Breach Response,
            <br />
            <span className="font-serif font-light text-muted-foreground/90">Handled with Precision.</span>
          </h1>

          <p className="mt-8 text-[15px] sm:text-base text-muted-foreground max-w-[560px] mx-auto leading-relaxed">
            A secure, AI-guided platform for EU-compliant incident response.
            Built for legal and security teams.
          </p>

          <div className="mt-14">
            <Link
              to="/auth"
              className="group inline-block border border-primary text-primary px-10 py-4 text-xs uppercase tracking-[0.2em] hover:bg-primary hover:text-primary-foreground transition-colors duration-200 rounded-sm"
            >
              Report a Breach
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-10 py-8 text-center">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Powered by Otto Schmidt Legal Intelligence
        </p>
      </footer>
    </div>
  );
};

export default Index;
