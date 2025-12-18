import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AlertCircle, 
  CheckCircle, 
  Edit, 
  Trash2, 
  RefreshCw,
  Wallet,
  Download
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import EditProviderModal from "./EditProviderModal";
import BalanceModal from "./BalanceModal";
import SyncServicesModal from "./SyncServicesModal";

interface Provider {
  id: number;
  name: string;
  api_url: string;
  api_key: string;
  api_type: string;
  enabled: boolean;
  balance_cached: number | null;
  last_checked: string | null;
}

interface ProviderCardProps {
  provider: Provider;
  onUpdate: () => void;
}

const ProviderCard = ({ provider, onUpdate }: ProviderCardProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [testing, setTesting] = useState(false);

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      const { data, error } = await supabase.functions.invoke('provider-test-connection', {
        body: { 
          api_url: provider.api_url,
          api_key: provider.api_key
        }
      });

      if (error) throw error;

      if (data.success) {
        toast.success(`Conexión exitosa! Balance: $${data.balance} ${data.currency}`);
      } else {
        toast.error(data.error || 'Error al conectar');
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      toast.error('Error al probar la conexión');
    } finally {
      setTesting(false);
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('providers')
        .delete()
        .eq('id', provider.id);

      if (error) throw error;

      toast.success('Proveedor eliminado');
      onUpdate();
    } catch (error) {
      console.error('Error deleting provider:', error);
      toast.error('Error al eliminar proveedor');
    }
  };

  const obfuscateApiKey = (key: string) => {
    if (key.length <= 8) return key;
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `Hace ${diffMins} minutos`;
    if (diffHours < 24) return `Hace ${diffHours} horas`;
    return `Hace ${diffDays} días`;
  };

  return (
    <>
      <Card className="border-border">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold text-foreground">{provider.name}</h3>
                <Badge variant={provider.enabled ? "default" : "secondary"}>
                  {provider.enabled ? (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Activo
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Inactivo
                    </>
                  )}
                </Badge>
                <Badge variant="outline">{provider.api_type}</Badge>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>API URL: {provider.api_url}</p>
                <p>API Key: {obfuscateApiKey(provider.api_key)}</p>
                <p>
                  Balance: {provider.balance_cached !== null ? `$${provider.balance_cached.toFixed(2)}` : 'No disponible'}
                </p>
                <p>Última sincronización: {formatDate(provider.last_checked)}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              disabled={testing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${testing ? 'animate-spin' : ''}`} />
              Test Connection
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSyncModal(true)}
            >
              <Download className="w-4 h-4 mr-2" />
              Sync Services
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBalanceModal(true)}
            >
              <Wallet className="w-4 h-4 mr-2" />
              View Balance
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEditModal(true)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar proveedor?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el proveedor "{provider.name}" y todos sus servicios en caché.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EditProviderModal
        provider={provider}
        open={showEditModal}
        onOpenChange={setShowEditModal}
        onSuccess={() => {
          onUpdate();
          setShowEditModal(false);
        }}
      />

      <BalanceModal
        provider={provider}
        open={showBalanceModal}
        onOpenChange={setShowBalanceModal}
      />

      <SyncServicesModal
        provider={provider}
        open={showSyncModal}
        onOpenChange={setShowSyncModal}
        onSuccess={onUpdate}
      />
    </>
  );
};

export default ProviderCard;
