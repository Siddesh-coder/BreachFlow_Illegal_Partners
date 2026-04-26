import { Link } from "react-router-dom";
import { useEffect } from "react";
import { ParticlesLayer } from "@/components/ParticlesLayer";
import teamSiddesh from "@/assets/team-siddesh.png";
import teamLiam from "@/assets/team-liam.png";
import teamJacob from "@/assets/team-jacob.png";
import teamLeo from "@/assets/team-leo.png";

const TEAM_MEMBERS = [
  { name: "Siddesh", role: "Engineering", bio: "M.Sc Mechatronics, Robotics & Biomechanics", photo: teamSiddesh },
  { name: "Liam", role: "Legal", bio: "Law student", photo: teamLiam },
  { name: "Jacob", role: "Research", bio: "B.Sc Physics", photo: teamJacob },
  { name: "Leo", role: "Legal Counsel", bio: "Lawyer", photo: teamLeo },
];

const COLORS = {
  bg: "#FFFFFF",
  bgAlt: "#FAFAFB",
  card: "#FFFFFF",
  border: "#EEEBF5",
  fg: "#0A0A0A",
  muted: "#6B6570",
  body: "#6B6570",
  faint: "#9B9590",
  accent: "#9A91FC",
};

const FONT_SERIF = "'Lora', serif";
const FONT_SANS = "'Poppins', sans-serif";

function smoothScrollTo(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function CtaButton({
  children,
  to = "/auth",
}: {
  children: React.ReactNode;
  to?: string;
}) {
  return (
    <Link
      to={to}
      className="inline-block transition-colors duration-200"
      style={{
        fontFamily: FONT_SANS,
        fontSize: 13,
        textTransform: "uppercase",
        letterSpacing: "2px",
        color: COLORS.fg,
        border: `1px solid ${COLORS.fg}`,
        padding: "14px 32px",
        borderRadius: 2,
        background: "transparent",
        textDecoration: "none",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = COLORS.fg;
        (e.currentTarget as HTMLElement).style.color = "#FFFFFF";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = "transparent";
        (e.currentTarget as HTMLElement).style.color = COLORS.fg;
      }}
    >
      {children}
    </Link>
  );
}

const Index = () => {
  useEffect(() => {
    const prev = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = prev;
    };
  }, []);

  return (
    <div style={{ background: COLORS.bg, color: COLORS.fg, minHeight: "100vh" }}>
      {/* NAVBAR */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5"
        style={{
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: `1px solid ${COLORS.border}`,
        }}
      >
        <button
          onClick={() => smoothScrollTo("hero")}
          style={{
            fontFamily: FONT_SERIF,
            fontSize: 20,
            color: COLORS.fg,
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
        >
          BreachGuard
        </button>
        <div className="flex items-center gap-8">
          <button
            onClick={() => smoothScrollTo("about")}
            style={{
              fontFamily: FONT_SANS,
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: "2px",
              color: COLORS.muted,
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
          >
            About
          </button>
          <Link
            to="/auth"
            style={{
              fontFamily: FONT_SANS,
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: "2px",
              color: COLORS.muted,
              textDecoration: "none",
            }}
          >
            Report a Breach
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section
        id="hero"
        style={{
          position: "relative",
          width: "100%",
          height: "100vh",
          overflow: "hidden",
          background: "#FFFFFF",
        }}
      >
        {/* Purple orb */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "-10%",
            left: "50%",
            width: 700,
            height: 700,
            background:
              "radial-gradient(ellipse at center, rgba(154,145,252,0.85) 0%, rgba(154,145,252,0.5) 25%, rgba(154,145,252,0.2) 55%, transparent 75%)",
            borderRadius: "50%",
            filter: "blur(40px)",
            animation: "orbPulse 6s ease-in-out infinite",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
        {/* Particles */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            pointerEvents: "none",
          }}
        >
          <ParticlesLayer className="absolute inset-0 w-full h-full" />
        </div>

        {/* Hero content */}
        <div
          className="flex flex-col items-center justify-center text-center px-6"
          style={{
            position: "relative",
            zIndex: 2,
            height: "100%",
          }}
        >
          <div
            style={{
              fontFamily: FONT_SANS,
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "3px",
              color: COLORS.accent,
              marginBottom: 28,
              fontWeight: 500,
            }}
          >
            EU GDPR Compliance Platform
          </div>
          <h1
            style={{
              fontFamily: FONT_SERIF,
              fontSize: "clamp(40px, 8vw, 72px)",
              lineHeight: 1.1,
              color: COLORS.fg,
              fontWeight: 400,
              letterSpacing: "-0.01em",
              margin: 0,
            }}
          >
            Data Breach Response,
            <br />
            Handled with Precision.
          </h1>
          <p
            style={{
              fontFamily: FONT_SANS,
              fontSize: 17,
              color: COLORS.muted,
              maxWidth: 520,
              margin: "28px auto 0",
              lineHeight: 1.6,
              fontWeight: 300,
            }}
          >
            An AI-guided platform for EU-compliant incident response. Built for
            legal and security teams operating under GDPR and NIS2.
          </p>
          <div style={{ marginTop: 40, display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "center" }}>
            <CtaButton to="/auth">Report a Breach →</CtaButton>
            <CtaButton to="/auth">I'm a DPO →</CtaButton>
            <CtaButton to="/auth">I'm Legal Counsel →</CtaButton>
          </div>
          <div
            style={{
              fontFamily: FONT_SANS,
              fontSize: 11,
              color: COLORS.faint,
              marginTop: 24,
            }}
          >
            Powered by Otto Schmidt Legal Intelligence × OpenAI
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          className="flex flex-col items-center gap-2"
          style={{
            position: "absolute",
            bottom: 32,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 2,
          }}
        >
          <div
            style={{
              width: 1,
              height: 40,
              background: COLORS.muted,
              opacity: 0.5,
              animation: "scroll-fade 2s ease-in-out infinite",
            }}
          />
          <div
            style={{
              fontFamily: FONT_SANS,
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "2px",
              color: COLORS.muted,
              opacity: 0.6,
            }}
          >
            scroll
          </div>
        </div>
        <style>{`
          @keyframes scroll-fade {
            0%, 100% { opacity: 0.2; }
            50% { opacity: 0.7; }
          }
          @keyframes orbPulse {
            0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.85; }
            50% { transform: translateX(-50%) scale(1.08); opacity: 1; }
          }
        `}</style>
      </section>

      {/* SECTION 2 — FEATURE CARDS */}
      <section style={{ background: COLORS.bg, padding: "120px 24px" }}>
        <div
          style={{
            maxWidth: 1000,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 24,
          }}
        >
          {[
            {
              n: "01",
              title: "Structured Incident Intake",
              body: "ARIA guides your team through every detail of a breach — calmly, precisely, and without legal jargon.",
            },
            {
              n: "02",
              title: "Notifiability Assessment",
              body: "Instant AI analysis determines whether GDPR Art. 33 or NIS2 notification obligations apply — with legal reasoning grounded in Otto Schmidt.",
            },
            {
              n: "03",
              title: "DPO Command Centre",
              body: "A complete dashboard for your Data Protection Officer — prioritized incidents, draft communications, and a full audit trail.",
            },
          ].map((c) => (
            <div
              key={c.n}
              style={{
                background: COLORS.card,
                border: `1px solid ${COLORS.border}`,
                padding: 36,
                borderRadius: 4,
              }}
            >
              <div
                style={{
                  fontFamily: FONT_SANS,
                  fontSize: 11,
                  letterSpacing: "2px",
                  color: COLORS.faint,
                  marginBottom: 18,
                }}
              >
                {c.n}
              </div>
              <h3
                style={{
                  fontFamily: FONT_SERIF,
                  fontSize: 22,
                  color: COLORS.fg,
                  fontWeight: 400,
                  margin: 0,
                  marginBottom: 14,
                }}
              >
                {c.title}
              </h3>
              <p
                style={{
                  fontFamily: FONT_SANS,
                  fontSize: 14,
                  color: COLORS.body,
                  lineHeight: 1.7,
                  margin: 0,
                }}
              >
                {c.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3 — ABOUT */}
      <section
        id="about"
        style={{ background: COLORS.bgAlt, padding: "120px 24px" }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 64,
            alignItems: "start",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: FONT_SANS,
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "3px",
                color: COLORS.muted,
                marginBottom: 24,
              }}
            >
              About BreachGuard
            </div>
            <h2
              style={{
                fontFamily: FONT_SERIF,
                fontSize: 42,
                color: COLORS.fg,
                fontWeight: 400,
                lineHeight: 1.15,
                margin: 0,
                marginBottom: 28,
              }}
            >
              Built for the critical first hours.
            </h2>
            <p
              style={{
                fontFamily: FONT_SANS,
                fontSize: 16,
                color: COLORS.body,
                lineHeight: 1.8,
                marginBottom: 20,
              }}
            >
              BreachGuard was created at the Munich Hacking Legal 2026
              hackathon in response to a real gap in EU compliance tooling.
              When a data breach occurs, organizations lose precious hours to
              confusion, scattered communication, and manual processes.
              BreachGuard changes that — combining AI intelligence with EU
              legal expertise to guide teams from discovery to notification
              with confidence.
            </p>
            <p
              style={{
                fontFamily: FONT_SANS,
                fontSize: 16,
                color: COLORS.body,
                lineHeight: 1.8,
              }}
            >
              Built on the Otto Schmidt Legal Data Hub, every recommendation
              BreachGuard makes is grounded in curated German and EU legal
              content — not hallucination.
            </p>
          </div>
          <div className="flex flex-col gap-6">
            {[
              { stat: "72 hours", desc: "GDPR Art. 33 notification window" },
              { stat: "27 EU states", desc: "supervisory authority coverage" },
            ].map((s) => (
              <div
                key={s.stat}
                style={{
                  background: COLORS.card,
                  border: `1px solid ${COLORS.border}`,
                  padding: 36,
                  borderRadius: 4,
                }}
              >
                <div
                  style={{
                    fontFamily: FONT_SERIF,
                    fontSize: 48,
                    color: COLORS.fg,
                    fontWeight: 400,
                    lineHeight: 1.1,
                    marginBottom: 10,
                  }}
                >
                  {s.stat}
                </div>
                <div
                  style={{
                    fontFamily: FONT_SANS,
                    fontSize: 13,
                    color: COLORS.body,
                    letterSpacing: "0.5px",
                  }}
                >
                  {s.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4 — TEAM */}
      <section style={{ background: COLORS.bg, padding: "120px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="text-center" style={{ marginBottom: 64 }}>
            <h2
              style={{
                fontFamily: FONT_SERIF,
                fontSize: 36,
                color: COLORS.fg,
                fontWeight: 400,
                margin: 0,
                marginBottom: 14,
              }}
            >
              The Team
            </h2>
            <div
              style={{
                fontFamily: FONT_SANS,
                fontSize: 14,
                color: COLORS.body,
              }}
            >
              Built in 24 hours at Munich Hacking Legal 2026
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 24,
            }}
          >
            {TEAM_MEMBERS.map((member) => (
              <div
                key={member.name}
                style={{
                  background: COLORS.card,
                  border: `1px solid ${COLORS.border}`,
                  padding: 28,
                  borderRadius: 4,
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: "50%",
                    margin: "0 auto 20px",
                    overflow: "hidden",
                    border: `1px solid ${COLORS.border}`,
                  }}
                >
                  <img
                    src={member.photo}
                    alt={`${member.name} — ${member.role}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                </div>
                <div
                  style={{
                    fontFamily: FONT_SERIF,
                    fontSize: 18,
                    color: COLORS.fg,
                    marginBottom: 8,
                  }}
                >
                  {member.name}
                </div>
                <div
                  style={{
                    fontFamily: FONT_SANS,
                    fontSize: 12,
                    textTransform: "uppercase",
                    letterSpacing: "2px",
                    color: COLORS.body,
                    marginBottom: 12,
                  }}
                >
                  {member.role}
                </div>
                <div
                  style={{
                    fontFamily: FONT_SANS,
                    fontSize: 13,
                    color: COLORS.faint,
                    lineHeight: 1.6,
                  }}
                >
                  {member.bio}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5 — FINAL CTA */}
      <section
        style={{
          background: COLORS.bg,
          borderTop: `1px solid ${COLORS.border}`,
          padding: "120px 24px",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontFamily: FONT_SERIF,
            fontSize: 48,
            color: COLORS.fg,
            fontWeight: 400,
            margin: 0,
            marginBottom: 16,
          }}
        >
          A breach won't wait.
        </h2>
        <p
          style={{
            fontFamily: FONT_SANS,
            fontSize: 16,
            color: COLORS.body,
            marginBottom: 36,
          }}
        >
          Neither should your response.
        </p>
        <CtaButton to="/auth">Begin Incident Report →</CtaButton>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          background: "#060606",
          borderTop: "1px solid #141414",
          padding: 32,
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div
            style={{
              fontFamily: FONT_SANS,
              fontSize: 12,
              color: COLORS.body,
            }}
          >
            <span style={{ fontFamily: FONT_SERIF, fontSize: 16, color: COLORS.fg, marginRight: 12 }}>
              BreachGuard
            </span>
            © 2026 Munich Hacking Legal
          </div>
          <div
            style={{
              fontFamily: FONT_SANS,
              fontSize: 12,
              color: COLORS.faint,
            }}
          >
            Powered by Otto Schmidt × OpenAI × Google Cloud
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
