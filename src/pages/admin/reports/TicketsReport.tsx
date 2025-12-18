import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

const TicketsReport = () => {
  return (
    <div className="space-y-6">
      <Card className="p-12 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 bg-muted rounded-full">
            <AlertCircle className="w-12 h-12 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Tickets Report</h2>
            <p className="text-muted-foreground">
              El módulo de soporte/tickets está en desarrollo.
              <br />
              Esta sección mostrará estadísticas de tickets cuando el sistema de soporte esté implementado.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TicketsReport;
