import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { LogOut, Menu, X } from "lucide-react";
import { toast } from "sonner";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import UsersManagement from "./users/UsersManagement";
import SettingsLayout from "./settings/SettingsLayout";
import ServicesManagement from "./services/ServicesManagement";
import PaymentsManagement from "./payments/PaymentsManagement";
import OrdersManagement from "./orders/OrdersManagement";
import RefillManagement from "./refills/RefillManagement";
import CancelManagement from "./cancel/CancelManagement";
import ReportsManagement from "./reports/ReportsManagement";
import AppearanceManagement from "./appearance/AppearanceManagement";

const AdminDashboard = () => {
  useAuthGuard('admin');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "users");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Sesión cerrada");
    navigate("/");
  };

  const tabs = [
    { id: "users", label: "Users" },
    { id: "orders", label: "Orders" },
    { id: "refill", label: "Refill" },
    { id: "cancel", label: "Cancel" },
    { id: "services", label: "Services" },
    { id: "payments", label: "Payments" },
    { id: "affiliates", label: "Affiliates" },
    { id: "child-panels", label: "Child panels" },
    { id: "reports", label: "Reports" },
    { id: "appearance", label: "Appearance" },
    { id: "settings", label: "Settings" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4 md:gap-6">
            {/* Mobile Menu Trigger */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0">
                <div className="p-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded bg-gradient-primary" />
                    <span className="text-lg font-bold text-foreground">SMM Admin</span>
                  </div>
                </div>
                <ScrollArea className="h-[calc(100vh-80px)]">
                  <nav className="flex flex-col p-2">
                    {tabs.map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                          activeTab === tab.id
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                </ScrollArea>
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded bg-gradient-primary" />
              <span className="text-lg font-bold text-foreground hidden sm:block">SMM Admin</span>
            </div>
            
            {/* Desktop Navigation Tabs */}
            <nav className="hidden lg:flex items-center gap-1 overflow-x-auto">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`px-3 xl:px-4 py-2 text-sm font-medium rounded transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {/* Current Tab Label on Mobile */}
            <span className="text-sm font-medium text-foreground lg:hidden">
              {tabs.find(t => t.id === activeTab)?.label}
            </span>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="h-9 w-9">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-4 md:p-6">
        {activeTab === "users" && <UsersManagement />}
        {activeTab === "settings" && <SettingsLayout />}
        {activeTab === "services" && <ServicesManagement />}
        {activeTab === "payments" && <PaymentsManagement />}
        {activeTab === "orders" && <OrdersManagement />}
        {activeTab === "refill" && <RefillManagement />}
        {activeTab === "cancel" && <CancelManagement />}
        {activeTab === "reports" && <ReportsManagement />}
        {activeTab === "affiliates" && (
          <div className="text-center py-12 text-muted-foreground">
            Módulo "Affiliates" en desarrollo
          </div>
        )}
        {activeTab === "child-panels" && (
          <div className="text-center py-12 text-muted-foreground">
            Módulo "Child panels" en desarrollo
          </div>
        )}
        {activeTab === "appearance" && <AppearanceManagement />}
      </div>
    </div>
  );
};

export default AdminDashboard;
