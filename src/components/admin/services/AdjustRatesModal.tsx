import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Percent, AlertCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Service {
  id: number;
  name: string;
  rate_per_1000: number;
  provider_id: number | null;
  provider_service_id: string | null;
}

interface CachedService {
  id: number;
  provider_id: number;
  service_id: string;
  rate: number;
}

interface AdjustRatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedServices: Service[];
  cachedServices: CachedService[];
  onSuccess: () => void;
}

const AdjustRatesModal = ({
  open,
  onOpenChange,
  selectedServices,
  cachedServices,
  onSuccess,
}: AdjustRatesModalProps) => {
  const [percentage, setPercentage] = useState<number>(50);
  const [loading, setLoading] = useState(false);

  const getProviderRate = (service: Service): number | null => {
    if (!service.provider_id || !service.provider_service_id) return null;
    const cached = cachedServices.find(
      (cs) =>
        cs.provider_id === service.provider_id &&
        cs.service_id === service.provider_service_id
    );
    return cached?.rate ?? null;
  };

  const servicePreview = useMemo(() => {
    return selectedServices.map((service) => {
      const providerRate = getProviderRate(service);
      const newRate = providerRate !== null 
        ? providerRate * (1 + percentage / 100) 
        : null;
      return {
        ...service,
        providerRate,
        newRate,
        hasProvider: providerRate !== null,
      };
    });
  }, [selectedServices, cachedServices, percentage]);

  const servicesWithProvider = servicePreview.filter((s) => s.hasProvider);
  const servicesWithoutProvider = servicePreview.filter((s) => !s.hasProvider);

  const handleApply = async () => {
    if (servicesWithProvider.length === 0) {
      toast.error("No hay servicios con proveedor para ajustar");
      return;
    }

    setLoading(true);
    try {
      // Update each service with its new rate
      const updates = servicesWithProvider.map(async (service) => {
        const oldRate = service.rate_per_1000;
        const newRate = service.newRate!;

        // Update the service rate
        const { error } = await supabase
          .from("services")
          .update({ rate_per_1000: newRate })
          .eq("id", service.id);

        if (error) throw error;

        // Log the rate change
        await supabase.from("service_updates").insert({
          service_id: service.id,
          service_name: service.name,
          update_type: newRate > oldRate ? "rate_increased" : newRate < oldRate ? "rate_decreased" : "rate_updated",
          old_value: oldRate.toString(),
          new_value: newRate.toFixed(5),
        });
      });

      await Promise.all(updates);

      toast.success(`${servicesWithProvider.length} rate(s) actualizados con +${percentage}%`);
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error updating rates:", error);
      toast.error("Error al actualizar rates");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Percent className="w-5 h-5" />
            Ajustar Rates por Porcentaje
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Percentage Input */}
          <div className="flex items-center gap-4">
            <Label htmlFor="percentage" className="whitespace-nowrap">
              Porcentaje de aumento:
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="percentage"
                type="number"
                value={percentage}
                onChange={(e) => setPercentage(Number(e.target.value))}
                className="w-24"
                min={0}
              />
              <span className="text-muted-foreground">%</span>
            </div>
            <span className="text-xs text-muted-foreground">
              (nuevo_rate = rate_proveedor × {(1 + percentage / 100).toFixed(2)})
            </span>
          </div>

          {/* Preview Table */}
          <ScrollArea className="flex-1 border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-muted sticky top-0">
                <tr>
                  <th className="text-left p-3 font-medium">Servicio</th>
                  <th className="text-right p-3 font-medium w-24">Proveedor</th>
                  <th className="text-right p-3 font-medium w-24">Actual</th>
                  <th className="text-right p-3 font-medium w-24">Nuevo</th>
                </tr>
              </thead>
              <tbody>
                {servicePreview.map((service) => (
                  <tr 
                    key={service.id} 
                    className={`border-t ${!service.hasProvider ? 'opacity-50' : ''}`}
                  >
                    <td className="p-3 truncate max-w-[200px]" title={service.name}>
                      {service.name}
                    </td>
                    <td className="p-3 text-right">
                      {service.providerRate !== null 
                        ? `$${service.providerRate.toFixed(4)}`
                        : <span className="text-muted-foreground">-</span>
                      }
                    </td>
                    <td className="p-3 text-right">
                      ${service.rate_per_1000.toFixed(4)}
                    </td>
                    <td className="p-3 text-right font-medium">
                      {service.newRate !== null 
                        ? <span className="text-primary">${service.newRate.toFixed(4)}</span>
                        : <span className="text-muted-foreground">-</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>

          {/* Warning for services without provider */}
          {servicesWithoutProvider.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-amber-500 bg-amber-500/10 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                {servicesWithoutProvider.length} servicio(s) sin proveedor no será(n) modificado(s)
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleApply} 
            disabled={loading || servicesWithProvider.length === 0}
          >
            {loading ? "Aplicando..." : `Aplicar a ${servicesWithProvider.length} servicio(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdjustRatesModal;
