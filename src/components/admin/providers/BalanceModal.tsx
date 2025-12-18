import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RefreshCw, Wallet } from "lucide-react";

interface Provider {
  id: number;
  name: string;
  balance_cached: number | null;
  last_checked: string | null;
}

interface BalanceModalProps {
  provider: Provider;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BalanceModal = ({ provider, open, onOpenChange }: BalanceModalProps) => {
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(provider.balance_cached);
  const [currency, setCurrency] = useState("USD");
  const [lastUpdated, setLastUpdated] = useState(provider.last_checked);

  const handleRefresh = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('provider-get-balance', {
        body: { provider_id: provider.id }
      });

      if (error) throw error;

      setBalance(parseFloat(data.balance));
      setCurrency(data.currency);
      setLastUpdated(new Date().toISOString());
      toast.success("Balance actualizado");
    } catch (error) {
      console.error('Error refreshing balance:', error);
      toast.error("Error al actualizar balance");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Provider Balance</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">{provider.name}</p>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Wallet className="w-6 h-6 text-primary" />
              <p className="text-3xl font-bold text-foreground">
                ${balance !== null ? balance.toFixed(2) : '0.00'}
              </p>
              <span className="text-lg text-muted-foreground">{currency}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Última actualización: {formatDate(lastUpdated)}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={loading}
              className="flex-1"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button
              variant="default"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BalanceModal;
