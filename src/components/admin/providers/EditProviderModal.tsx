import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, EyeOff, CheckCircle } from "lucide-react";

interface Provider {
  id: number;
  name: string;
  api_url: string;
  api_key: string;
  api_type: string;
  enabled: boolean;
}

interface EditProviderModalProps {
  provider: Provider;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const EditProviderModal = ({ provider, open, onOpenChange, onSuccess }: EditProviderModalProps) => {
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState(true);
  const [showApiKey, setShowApiKey] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    api_type: "",
    api_url: "",
    api_key: "",
    enabled: true,
  });

  useEffect(() => {
    if (provider) {
      setFormData({
        name: provider.name,
        api_type: provider.api_type,
        api_url: provider.api_url,
        api_key: provider.api_key,
        enabled: provider.enabled,
      });
      setTestSuccess(true);
    }
  }, [provider]);

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      const { data, error } = await supabase.functions.invoke('provider-test-connection', {
        body: {
          api_url: formData.api_url,
          api_key: formData.api_key
        }
      });

      if (error) throw error;

      if (data.success) {
        setTestSuccess(true);
        toast.success(`¡Conexión exitosa! Balance: $${data.balance} ${data.currency}`);
      } else {
        setTestSuccess(false);
        toast.error(data.error || 'Error al conectar');
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      setTestSuccess(false);
      toast.error('Error al probar la conexión');
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      const { error } = await supabase
        .from('providers')
        .update({
          name: formData.name,
          api_type: formData.api_type,
          api_url: formData.api_url,
          api_key: formData.api_key,
          enabled: formData.enabled,
        })
        .eq('id', provider.id);

      if (error) throw error;

      toast.success("Proveedor actualizado");
      onSuccess();
    } catch (error) {
      console.error('Error updating provider:', error);
      toast.error("Error al actualizar proveedor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Proveedor</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Proveedor</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="api_type">Tipo de API</Label>
            <Select
              value={formData.api_type}
              onValueChange={(value) => setFormData({ ...formData, api_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="marketfollowers">MarketFollowers</SelectItem>
                <SelectItem value="generic">Generic</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="api_url">API URL</Label>
            <Input
              id="api_url"
              value={formData.api_url}
              onChange={(e) => {
                setFormData({ ...formData, api_url: e.target.value });
                setTestSuccess(false);
              }}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="api_key">API Key</Label>
            <div className="relative">
              <Input
                id="api_key"
                type={showApiKey ? "text" : "password"}
                value={showApiKey ? formData.api_key : '••••••••••••••••'}
                onChange={(e) => {
                  setFormData({ ...formData, api_key: e.target.value });
                  setTestSuccess(false);
                }}
                onFocus={() => setShowApiKey(true)}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">Click to reveal the API key</p>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="enabled">Estado</Label>
            <Switch
              id="enabled"
              checked={formData.enabled}
              onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
            />
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleTestConnection}
            disabled={testing}
            className="w-full"
          >
            {testSuccess ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                Conexión OK
              </>
            ) : (
              "Test Connection"
            )}
          </Button>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProviderModal;
