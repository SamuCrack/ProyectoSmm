import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";

// Lazy load non-critical routes to reduce initial bundle size
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const ClientLogin = lazy(() => import("./pages/ClientLogin"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const ClientDashboard = lazy(() => import("./pages/client/ClientDashboard"));
const PayPalReturn = lazy(() => import("./pages/client/PayPalReturn"));

const queryClient = new QueryClient();

// Minimal loading fallback
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/client/login" element={<ClientLogin />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/client/dashboard" element={<ClientDashboard />} />
            <Route path="/client/paypal-return" element={<PayPalReturn />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
