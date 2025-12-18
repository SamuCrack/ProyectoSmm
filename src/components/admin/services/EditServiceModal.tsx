import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, AlertCircle } from "lucide-react";

interface EditServiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  service: any;
  categories: Array<{ id: number; name: string }>;
  providers: Array<{ id: number; name: string }>;
}

const EditServiceModal = ({
  open,
  onOpenChange,
  onSuccess,
  service,
  categories,
  providers,
}: EditServiceModalProps) => {
  const [loading, setLoading] = useState(false);
  const [providerHasService, setProviderHasService] = useState<boolean | null>(null);
  const [providerMaxQty, setProviderMaxQty] = useState<number | null>(null);
  const [providerRate, setProviderRate] = useState<number | null>(null);
  const [markupPercentage, setMarkupPercentage] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    category_id: "",
    mode: "Manual",
    service_type: "Default",
    rate_per_1000: "",
    min_qty: "",
    max_qty: "",
    enabled: true,
    refill: false,
    cancel_allow: false,
    deny_link_duplicates: false,
    notes: "",
  });

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name || "",
        category_id: service.category_id?.toString() || "",
        mode: service.sync_with_provider ? "Auto" : "Manual",
        service_type: service.service_type || "Default",
        rate_per_1000: service.rate_per_1000?.toString() || "",
        min_qty: service.min_qty?.toString() || "",
        max_qty: service.max_qty?.toString() || "",
        enabled: service.enabled ?? true,
        refill: service.refill ?? false,
        cancel_allow: service.cancel_allow ?? false,
        deny_link_duplicates: service.deny_link_duplicates ?? false,
        notes: service.notes || "",
      });
      
      // Check if provider still has this service
      setProviderHasService(null);
    }
  }, [service]);

  // Check if the service exists in provider cache and get max_qty + rate
  useEffect(() => {
    const checkProviderService = async () => {
      if (service?.provider_service_id && service?.provider_id && service?.sync_with_provider) {
        const { data } = await supabase
          .from('provider_services_cache')
          .select('id, max_qty, rate')
          .eq('provider_id', service.provider_id)
          .eq('service_id', service.provider_service_id)
          .maybeSingle();
        
        setProviderHasService(!!data);
        setProviderMaxQty(data?.max_qty ?? null);
        
        // Set provider rate and calculate initial markup percentage
        if (data?.rate) {
          const pRate = parseFloat(String(data.rate));
          setProviderRate(pRate);
          
          // Calculate initial markup percentage from current service rate
          const currentRate = parseFloat(service.rate_per_1000) || 0;
          if (pRate > 0 && currentRate >= pRate) {
            const percentage = ((currentRate / pRate) - 1) * 100;
            setMarkupPercentage(percentage.toFixed(2));
          } else {
            setMarkupPercentage("0");
          }
        } else {
          setProviderRate(null);
          setMarkupPercentage("");
        }
      } else {
        setProviderHasService(null);
        setProviderMaxQty(null);
        setProviderRate(null);
        setMarkupPercentage("");
      }
    };
    
    if (open && service) {
      checkProviderService();
    }
  }, [open, service]);

  // Calculate rate when markup percentage changes (for Auto mode)
  const handleMarkupChange = (value: string) => {
    setMarkupPercentage(value);
    if (providerRate !== null && value !== "") {
      const percentage = parseFloat(value) || 0;
      const newRate = providerRate * (1 + percentage / 100);
      setFormData(prev => ({ ...prev, rate_per_1000: newRate.toFixed(5) }));
    }
  };

  const calculatedRate = providerRate !== null && markupPercentage !== "" 
    ? providerRate * (1 + (parseFloat(markupPercentage) || 0) / 100)
    : null;

  const isAutoMode = formData.mode === "Auto";
  const providerName = providers.find(p => p.id === service?.provider_id)?.name || "Proveedor externo";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.rate_per_1000) {
      toast.error("Por favor completa el precio");
      return;
    }

    // Block enabling if provider removed the service
    if (isAutoMode && formData.enabled && !service.enabled && providerHasService === false) {
      toast.error("No puedes habilitar este servicio porque el proveedor lo ha eliminado");
      return;
    }

    // Validate max_qty doesn't exceed provider's limit in Auto mode
    if (isAutoMode && providerMaxQty !== null) {
      const newMaxQty = parseInt(formData.max_qty);
      if (newMaxQty > providerMaxQty) {
        toast.error(`Max order no puede exceder el límite del proveedor (${providerMaxQty.toLocaleString()})`);
        return;
      }
    }

    try {
      setLoading(true);

      // Si está en modo Auto, solo actualizar campos permitidos (nombre incluido - es visual)
      const updateData = isAutoMode
        ? {
            name: formData.name,
            rate_per_1000: parseFloat(formData.rate_per_1000),
            min_qty: parseInt(formData.min_qty),
            max_qty: parseInt(formData.max_qty),
            enabled: formData.enabled,
            deny_link_duplicates: formData.deny_link_duplicates,
            notes: formData.notes || null,
          }
        : {
            name: formData.name,
            category_id: formData.category_id ? parseInt(formData.category_id) : null,
            service_type: formData.service_type,
            rate_per_1000: parseFloat(formData.rate_per_1000),
            min_qty: parseInt(formData.min_qty),
            max_qty: parseInt(formData.max_qty),
            enabled: formData.enabled,
            refill: formData.refill,
            cancel_allow: formData.cancel_allow,
            deny_link_duplicates: formData.deny_link_duplicates,
            notes: formData.notes || null,
          };

      const { error } = await supabase
        .from('services')
        .update(updateData)
        .eq('id', service.id);

      if (error) throw error;

      // Registrar actualizaciones en service_updates
      const updates: Array<{
        service_id: number;
        service_name: string;
        update_type: string;
        old_value?: string;
        new_value?: string;
      }> = [];

      // Detectar cambios de tarifa
      const oldRate = parseFloat(service.rate_per_1000);
      const newRate = parseFloat(formData.rate_per_1000);
      if (oldRate !== newRate) {
        updates.push({
          service_id: service.id,
          service_name: formData.name,
          update_type: newRate > oldRate ? 'rate_increased' : 'rate_decreased',
          old_value: `$${oldRate.toFixed(5)}`,
          new_value: `$${newRate.toFixed(5)}`
        });
      }

      // Detectar cambios de estado enabled/disabled
      if (service.enabled !== formData.enabled) {
        updates.push({
          service_id: service.id,
          service_name: formData.name,
          update_type: formData.enabled ? 'enabled' : 'disabled'
        });
      }

      // Insertar las actualizaciones si las hay
      if (updates.length > 0) {
        await supabase.from('service_updates').insert(updates);
      }

      toast.success("Servicio actualizado exitosamente");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating service:', error);
      toast.error("Error al actualizar servicio");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Edit Service</DialogTitle>
        </DialogHeader>
        
        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          {isAutoMode && providerHasService === false && (
            <Alert className="border-red-500/50 bg-red-500/10">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-sm text-red-700 dark:text-red-400">
                ⚠️ Este servicio ha sido <strong>eliminado por el proveedor</strong> y no puede ser habilitado manualmente.
                Si el proveedor lo restaura, se habilitará automáticamente.
              </AlertDescription>
            </Alert>
          )}
          
          {isAutoMode && providerHasService !== false && (
            <Alert className="border-yellow-500/50 bg-yellow-500/10">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-sm text-yellow-700 dark:text-yellow-400">
                Este servicio está sincronizado con <strong>{providerName}</strong>. 
                Puedes modificar el <strong>nombre local</strong>, <strong>precio</strong> y <strong>estado</strong>. 
                La sincronización se mantiene mediante el ID del proveedor.
              </AlertDescription>
            </Alert>
          )}
          
          <form id="edit-service-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Service Name - Full width */}
            <div className="space-y-2">
              <Label htmlFor="name">Service Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              {isAutoMode && (
                <p className="text-xs text-muted-foreground">
                  Este nombre es local y no afecta la sincronización con el proveedor.
                </p>
              )}
            </div>

            {/* Category y Mode - 2 columns */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category_id || "none"}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value === "none" ? "" : value })}
                  disabled={isAutoMode}
                >
                  <SelectTrigger disabled={isAutoMode}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin categoría</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mode">Mode</Label>
                <Select
                  value={formData.mode}
                  onValueChange={(value) => setFormData({ ...formData, mode: value })}
                  disabled={isAutoMode}
                >
                  <SelectTrigger disabled={isAutoMode}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Manual">Manual</SelectItem>
                    <SelectItem value="Auto">Auto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Provider y Provider ID - 2 columns (Solo Auto mode) */}
            {isAutoMode && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="provider">Provider</Label>
                  <Input
                    id="provider"
                    value={providerName}
                    disabled
                    className="bg-muted"
                  />
                </div>

                {service?.provider_service_id && (
                  <div className="space-y-2">
                    <Label htmlFor="provider_service">ID Proveedor</Label>
                    <Input
                      id="provider_service"
                      value={`ID: ${service.provider_service_id}`}
                      disabled
                      className="bg-muted text-muted-foreground"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Rate, Min, Max - 3 columns */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                {isAutoMode && providerRate !== null ? (
                  <>
                    <div className="flex items-center gap-1">
                      <Label htmlFor="markup">Aumento (%)</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>Porcentaje de aumento sobre el precio del proveedor</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Input
                      id="markup"
                      type="number"
                      step="0.01"
                      min="0"
                      value={markupPercentage}
                      onChange={(e) => handleMarkupChange(e.target.value)}
                      placeholder="ej: 50"
                    />
                    <div className="text-xs space-y-0.5">
                      <p className="text-muted-foreground">
                        Proveedor: <span className="font-mono">${providerRate.toFixed(5)}</span>
                      </p>
                      {calculatedRate !== null && (
                        <p className="text-primary font-medium">
                          Tu rate: <span className="font-mono">${calculatedRate.toFixed(5)}</span>
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <Label htmlFor="rate">Rate per 1000 *</Label>
                    <Input
                      id="rate"
                      type="number"
                      step="0.01"
                      value={formData.rate_per_1000}
                      onChange={(e) => setFormData({ ...formData, rate_per_1000: e.target.value })}
                      required
                    />
                  </>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="min">Min order</Label>
                <Input
                  id="min"
                  type="number"
                  value={formData.min_qty}
                  onChange={(e) => setFormData({ ...formData, min_qty: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max">Max order</Label>
                <Input
                  id="max"
                  type="number"
                  value={formData.max_qty}
                  onChange={(e) => {
                    const newValue = parseInt(e.target.value) || 0;
                    if (isAutoMode && providerMaxQty !== null && newValue > providerMaxQty) {
                      toast.error(`No puedes exceder el límite del proveedor (${providerMaxQty.toLocaleString()})`);
                      return;
                    }
                    setFormData({ ...formData, max_qty: e.target.value });
                  }}
                />
                {isAutoMode && providerMaxQty !== null && (
                  <p className="text-xs text-muted-foreground">
                    Máximo del proveedor: {providerMaxQty.toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            {/* Drip-feed, Cancel, Deny duplicates - 3 columns */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="drip_feed">Drip-feed</Label>
                <Select value="disallow" disabled>
                  <SelectTrigger disabled>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="disallow">Disallow</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cancel">Cancel</Label>
                <Select
                  value={formData.cancel_allow ? "allow" : "disallow"}
                  onValueChange={(value) => setFormData({ ...formData, cancel_allow: value === "allow" })}
                  disabled={isAutoMode}
                >
                  <SelectTrigger disabled={isAutoMode}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="disallow">Disallow</SelectItem>
                    <SelectItem value="allow">Allow</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label htmlFor="deny_link">Deny duplicates</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Evita que se creen múltiples órdenes con el mismo enlace</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Select
                  value={formData.deny_link_duplicates ? "yes" : "no"}
                  onValueChange={(value) => setFormData({ ...formData, deny_link_duplicates: value === "yes" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="yes">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Service Type y Status - 2 columns (Solo Manual mode) */}
            {!isAutoMode && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Service Type</Label>
                  <Select
                    value={formData.service_type}
                    onValueChange={(value) => setFormData({ ...formData, service_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Default">Default</SelectItem>
                      <SelectItem value="Package">Package</SelectItem>
                      <SelectItem value="Custom Comments">Custom Comments</SelectItem>
                      <SelectItem value="Comment Likes">Comment Likes</SelectItem>
                      <SelectItem value="Poll">Poll</SelectItem>
                      <SelectItem value="Subscriptions">Subscriptions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="enabled">Status</Label>
                  <Select
                    value={formData.enabled ? "active" : "inactive"}
                    onValueChange={(value) => setFormData({ ...formData, enabled: value === "active" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Switches row */}
            <div className="flex items-center gap-6 py-2">
              {isAutoMode && (
                <div className="flex items-center gap-2">
                  <Switch
                    id="sync_status"
                    checked={formData.enabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                  />
                  <Label htmlFor="sync_status" className="text-sm">Sync status</Label>
                </div>
              )}

              {!isAutoMode && (
                <div className="flex items-center gap-2">
                  <Switch
                    id="refill_edit"
                    checked={formData.refill}
                    onCheckedChange={(checked) => setFormData({ ...formData, refill: checked })}
                  />
                  <Label htmlFor="refill_edit" className="text-sm">Refill</Label>
                </div>
              )}
            </div>

            {/* Description / Notes - Full width */}
            <div className="space-y-2">
              <Label htmlFor="notes">Descripción / Notas</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Agrega una descripción detallada del servicio..."
                rows={3}
                className="resize-none"
              />
            </div>
          </form>
        </div>

        {/* Fixed footer */}
        <div className="flex-shrink-0 flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="edit-service-form" disabled={loading}>
            {loading ? "Updating..." : "Update Service"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditServiceModal;
