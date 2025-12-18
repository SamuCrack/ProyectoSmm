import { useState } from "react";
import ProvidersManagement from "./ProvidersManagement";

const SettingsLayout = () => {
  const [activeSubTab, setActiveSubTab] = useState("providers");

  const subTabs = [
    { id: "general", label: "General" },
    { id: "providers", label: "Providers" },
    { id: "email", label: "Email Templates" },
    { id: "payments", label: "Payment Methods" },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-border">
        <nav className="flex gap-4">
          {subTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`
                px-4 py-3 text-sm font-medium transition-colors relative
                ${
                  activeSubTab === tab.id
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }
              `}
            >
              {tab.label}
              {activeSubTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          ))}
        </nav>
      </div>

      {activeSubTab === "providers" && <ProvidersManagement />}
      {activeSubTab === "general" && (
        <div className="p-6 bg-card rounded-lg border border-border">
          <p className="text-muted-foreground">General settings en desarrollo</p>
        </div>
      )}
      {activeSubTab === "email" && (
        <div className="p-6 bg-card rounded-lg border border-border">
          <p className="text-muted-foreground">Email templates en desarrollo</p>
        </div>
      )}
      {activeSubTab === "payments" && (
        <div className="p-6 bg-card rounded-lg border border-border">
          <p className="text-muted-foreground">Payment methods en desarrollo</p>
        </div>
      )}
    </div>
  );
};

export default SettingsLayout;
