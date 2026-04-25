import { BookOpen } from "lucide-react";

interface ArticleCard {
  title: string;
  ref: string;
  quote: string;
}

const ARTICLES: ArticleCard[] = [
  {
    title: "GDPR Art. 33 — Notification to supervisory authority",
    ref: "GDPR Art. 33(1)",
    quote:
      "In the case of a personal data breach, the controller shall without undue delay and, where feasible, not later than 72 hours after having become aware of it, notify the personal data breach to the supervisory authority…",
  },
  {
    title: "GDPR Art. 34 — Communication to the data subject",
    ref: "GDPR Art. 34(1)",
    quote:
      "When the personal data breach is likely to result in a high risk to the rights and freedoms of natural persons, the controller shall communicate the personal data breach to the data subject without undue delay.",
  },
  {
    title: "NIS2 Art. 23 — Reporting obligations",
    ref: "NIS2 Directive Art. 23",
    quote:
      "Essential and important entities shall notify the competent authority or CSIRT… of any incident having a significant impact on the provision of their services. Early warning within 24 hours; notification within 72 hours; final report within 1 month.",
  },
  {
    title: "EDPB Guidelines 9/2022 — Personal data breach notification",
    ref: "EDPB Guidelines 9/2022",
    quote:
      "The EDPB emphasises that controllers must implement appropriate technical and organisational measures to be able to detect breaches, assess the risk, and notify without undue delay.",
  },
];

const LegalKnowledge = () => {
  return (
    <div className="px-10 py-10 max-w-[1100px] mx-auto animate-fade-in">
      <h1 className="font-serif leading-tight" style={{ fontSize: 28 }}>
        Knowledge Panel
      </h1>
      <p className="text-sm text-muted-foreground mt-2">
        Applicable provisions · EDPB guidelines · authority directory
      </p>

      <div className="mt-8 space-y-4">
        {ARTICLES.map((a) => (
          <article
            key={a.ref}
            className="bg-card border rounded-sm p-6 shadow-card"
            style={{ borderColor: "#E8E4DC" }}
          >
            <div className="flex items-start gap-4">
              <BookOpen className="w-5 h-5 mt-1 text-muted-foreground shrink-0" />
              <div className="min-w-0 flex-1">
                <h2 className="font-serif font-bold" style={{ fontSize: 16, color: "hsl(var(--foreground))" }}>
                  {a.title}
                </h2>
                <div className="font-mono text-[11px] text-muted-foreground mt-1">
                  {a.ref}
                </div>
                <blockquote className="mt-3 italic text-[13px] text-muted-foreground leading-relaxed">
                  “{a.quote}”
                </blockquote>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default LegalKnowledge;
