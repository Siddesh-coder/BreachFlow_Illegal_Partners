import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/state/AppContext";
import { ApiSetupModal } from "@/components/ApiSetupModal";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Employee from "./pages/Employee";
import LegalLayout from "./pages/legal/LegalLayout";
import LegalOverview from "./pages/legal/LegalOverview";
import LegalCases from "./pages/legal/LegalCases";
import LegalCaseDetail from "./pages/legal/LegalCaseDetail";
import LegalClassification from "./pages/legal/LegalClassification";
import LegalDraftReview from "./pages/legal/LegalDraftReview";
import LegalPrivilegeLog from "./pages/legal/LegalPrivilegeLog";
import LegalKnowledge from "./pages/legal/LegalKnowledge";
import LegalIndicators from "./pages/legal/LegalIndicators";
import LegalResponseWorkflow from "./pages/legal/LegalResponseWorkflow";
import LegalAriaReports from "./pages/legal/LegalAriaReports";
import DpoLayout from "./pages/dpo/DpoLayout";
import DpoDashboard from "./pages/dpo/DpoDashboard";
import DpoIncidents from "./pages/dpo/DpoIncidents";
import DpoIncidentDetail from "./pages/dpo/DpoIncidentDetail";
import DpoNotifications from "./pages/dpo/DpoNotifications";
import DpoAudit from "./pages/dpo/DpoAudit";
import DpoSettings from "./pages/dpo/DpoSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <ApiSetupModal />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/employee" element={<Employee />} />
            <Route path="/legal" element={<LegalLayout />}>
              <Route index element={<LegalCases />} />
              <Route path="overview" element={<LegalOverview />} />
              <Route path="cases/:id" element={<LegalOverview />} />
              <Route path="classification" element={<LegalClassification />} />
              <Route path="draft-review" element={<LegalDraftReview />} />
              <Route path="privilege-log" element={<LegalPrivilegeLog />} />
              <Route path="knowledge" element={<LegalKnowledge />} />
              <Route path="indicators" element={<LegalIndicators />} />
              <Route path="response-workflow" element={<LegalResponseWorkflow />} />
              <Route path="aria-reports" element={<LegalAriaReports />} />
            </Route>
            <Route path="/dpo" element={<DpoLayout />}>
              <Route index element={<DpoDashboard />} />
              <Route path="incidents" element={<DpoIncidents />} />
              <Route path="incidents/:id" element={<DpoIncidentDetail />} />
              <Route path="notifications" element={<DpoNotifications />} />
              <Route path="audit" element={<DpoAudit />} />
              <Route path="settings" element={<DpoSettings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;
