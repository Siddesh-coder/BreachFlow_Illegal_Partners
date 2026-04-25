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
import Legal from "./pages/Legal";
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
