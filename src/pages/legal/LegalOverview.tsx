import { LegalDeadlineStrip } from "@/components/legal/LegalDeadlineStrip";
import LegalCases from "./LegalCases";

const LegalOverview = () => {
  return (
    <div className="animate-fade-in">
      <LegalDeadlineStrip />
      <LegalCases />
    </div>
  );
};

export default LegalOverview;
