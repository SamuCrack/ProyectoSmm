import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle, XCircle } from "lucide-react";

interface Provider {
  id: number;
  name: string;
}

interface SyncServicesModalProps {
  provider: Provider;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const SyncServicesModal = ({ provider, open, onOpenChange, onSuccess }: SyncServicesModalProps) => {
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    success: boolean;
    synced_count?: number;
    new_services?: number;
    updated_services?: number;
    error?: string;
  } | null>(null);

  const handleSync = async () => {
    try {
      setSyncing(true);
      setProgress(0);
      setResult(null);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const { data, error } = await supabase.functions.invoke('provider-sync-services', {
        body: { provider_id: provider.id }
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (error) throw error;

      setResult({
        success: true,
        synced_count: data.synced_count,
        new_services: data.new_services,
        updated_services: data.updated_services,
      });
      
      toast.success("Servicios sincronizados exitosamente");
      onSuccess();
    } catch (error) {
      console.error('Error syncing services:', error);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
      toast.error("Error al sincronizar servicios");
    } finally {
      setSyncing(false);
    }
  };

  const handleClose = () => {
    setProgress(0);
    setResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Sync Services from {provider.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {!result && !syncing && (
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Esta acción obtendrá todos los servicios del proveedor y los guardará en caché.
              </p>
              <Button onClick={handleSync} className="w-full">
                Iniciar Sincronización
              </Button>
            </div>
          )}

          {syncing && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Obteniendo servicios del proveedor...
              </p>
              <Progress value={progress} className="w-full" />
              <p className="text-xs text-center text-muted-foreground">{progress}%</p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {result.success ? (
                <>
                  <div className="flex items-center justify-center gap-2 text-green-500">
                    <CheckCircle className="w-6 h-6" />
                    <span className="font-semibold">Sincronización Completa</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total servicios:</span>
                      <span className="font-medium">{result.synced_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nuevos:</span>
                      <span className="font-medium text-green-500">{result.new_services}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Actualizados:</span>
                      <span className="font-medium text-blue-500">{result.updated_services}</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-center gap-2 text-destructive">
                    <XCircle className="w-6 h-6" />
                    <span className="font-semibold">Error en Sincronización</span>
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    {result.error}
                  </p>
                </>
              )}
              <Button onClick={handleClose} className="w-full">
                Cerrar
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SyncServicesModal;
