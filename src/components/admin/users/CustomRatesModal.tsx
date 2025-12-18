import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CustomRatesModalProps {
  open: boolean;
  onClose: () => void;
  user: { id: string; email: string };
  onSuccess: () => void;
}

interface Service {
  id: number;
  name: string;
  rate_per_1000: number;
}

interface CustomRate {
  service_id: number;
  custom_rate: number;
}

const CustomRatesModal = ({ open, onClose, user, onSuccess }: CustomRatesModalProps) => {
  const [services, setServices] = useState<Service[]>([]);
  const [customRates, setCustomRates] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, user.id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch services
      const { data: servicesData, error: servicesError } = await supabase
        .from("services")
        .select("id, name, rate_per_1000")
        .eq("enabled", true)
        .order("name");

      if (servicesError) throw servicesError;

      // Fetch custom rates for this user
      const { data: ratesData, error: ratesError } = await supabase
        .from("pricing_rules")
        .select("service_id, custom_rate")
        .eq("user_id", user.id);

      if (ratesError) throw ratesError;

      setServices(servicesData || []);
      
      const ratesMap: Record<number, number> = {};
      ratesData?.forEach((rate) => {
        ratesMap[rate.service_id] = rate.custom_rate;
      });
      setCustomRates(ratesMap);
    } catch (error: any) {
      toast.error("Error al cargar datos: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      // Delete all existing custom rates for this user
      await supabase
        .from("pricing_rules")
        .delete()
        .eq("user_id", user.id);

      // Insert new custom rates
      const ratesToInsert = Object.entries(customRates)
        .filter(([_, rate]) => rate > 0)
        .map(([serviceId, rate]) => ({
          user_id: user.id,
          service_id: parseInt(serviceId),
          custom_rate: rate,
        }));

      if (ratesToInsert.length > 0) {
        const { error } = await supabase
          .from("pricing_rules")
          .insert(ratesToInsert);

        if (error) throw error;
      }

      toast.success("Tarifas personalizadas guardadas");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error("Error al guardar: " + error.message);
    }
  };

  const updateRate = (serviceId: number, value: string) => {
    const numValue = parseFloat(value) || 0;
    setCustomRates((prev) => ({
      ...prev,
      [serviceId]: numValue,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Configurar tarifas personalizadas - {user.email}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">
            Cargando servicios...
          </div>
        ) : (
          <>
            <div className="text-sm text-muted-foreground mb-4">
              Ingresa 0 o deja vacío para usar la tarifa estándar del servicio
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Tarifa Estándar</TableHead>
                  <TableHead>Tarifa Personalizada</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell>{service.name}</TableCell>
                    <TableCell>${service.rate_per_1000.toFixed(5)}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.00001"
                        placeholder="0.00000"
                        value={customRates[service.id] || ""}
                        onChange={(e) => updateRate(service.id, e.target.value)}
                        className="w-32"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
                Guardar
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CustomRatesModal;
