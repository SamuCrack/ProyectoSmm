import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
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
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Info, Check, ChevronsUpDown, RefreshCw, Ban, Loader2, Search, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface AddServiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  categories: Array<{ id: number; name: string }>;
  providers: Array<{ id: number; name: string }>;
}

interface ProviderService {
  id: number;
  service_id: string;
  name: string;
  category: string | null;
  rate: number | null;
  min_qty: number | null;
  max_qty: number | null;
  refill: boolean | null;
  cancel_allow: boolean | null;
  raw_data: Json | null;
}

const AddServiceModal = ({ open, onOpenChange, onSuccess, categories, providers }: AddServiceModalProps) => {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"Auto" | "Manual">("Auto");
  const [providerServices, setProviderServices] = useState<ProviderService[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [serviceSearchOpen, setServiceSearchOpen] = useState(false);
  const [serviceSearchQuery, setServiceSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    category_id: "",
    provider_id: "",
    provider_service_id: "",
    service_type: "Default",
    rate_per_1000: "",
    min_qty: "1",
    max_qty: "1000000",
    increment: "",
    overflow_percent: "",
    enabled: true,
    refill: false,
    cancel_allow: true,
  });

  // Cargar servicios del proveedor cuando se selecciona uno
  const loadProviderServices = async (providerId: string) => {
    if (!providerId) {
      setProviderServices([]);
      return;
    }

    try {
      setLoadingServices(true);
      const { data, error } = await supabase
        .from('provider_services_cache')
        .select('*')
        .eq('provider_id', parseInt(providerId))
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setProviderServices(data || []);
    } catch (error) {
      console.error('Error loading provider services:', error);
      toast.error("Error al cargar servicios del proveedor");
    } finally {
      setLoadingServices(false);
    }
  };

  // Filtrar servicios basado en búsqueda
  const filteredServices = useMemo(() => {
    if (!serviceSearchQuery.trim()) return providerServices;
    
    const query = serviceSearchQuery.toLowerCase().trim();
    return providerServices.filter(service => 
      service.service_id.toLowerCase().includes(query) ||
      service.name.toLowerCase().includes(query) ||
      (service.category && service.category.toLowerCase().includes(query))
    );
  }, [providerServices, serviceSearchQuery]);

  // Agrupar servicios por categoría
  const groupedServices = useMemo(() => {
    const groups: Record<string, ProviderService[]> = {};
    filteredServices.forEach(service => {
      const category = service.category || "Sin Categoría";
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(service);
    });
    return groups;
  }, [filteredServices]);

  // Obtener el servicio seleccionado
  const selectedService = useMemo(() => {
    return providerServices.find(s => s.service_id === formData.provider_service_id);
  }, [providerServices, formData.provider_service_id]);

  // Auto-rellenar campos cuando se selecciona un servicio del proveedor
  const handleProviderServiceSelect = (serviceId: string) => {
    const service = providerServices.find(s => s.service_id === serviceId);
    if (service) {
      // Extraer el tipo del raw_data del proveedor (cast seguro)
      const rawData = service.raw_data as { type?: string } | null;
      const providerType = rawData?.type || "Default";
      
      setFormData(prev => ({
        ...prev,
        provider_service_id: service.service_id,
        name: service.name,
        rate_per_1000: service.rate ? service.rate.toString() : prev.rate_per_1000,
        min_qty: service.min_qty ? service.min_qty.toString() : prev.min_qty,
        max_qty: service.max_qty ? service.max_qty.toString() : prev.max_qty,
        refill: service.refill || false,
        cancel_allow: service.cancel_allow ?? true,
        service_type: providerType, // Sincronizar tipo automáticamente desde el proveedor
      }));

      // Intentar encontrar y asignar la categoría si existe
      if (service.category) {
        const matchingCategory = categories.find(cat => 
          cat.name.toLowerCase().includes(service.category!.toLowerCase()) ||
          service.category!.toLowerCase().includes(cat.name.toLowerCase())
        );
        if (matchingCategory) {
          setFormData(prev => ({
            ...prev,
            category_id: matchingCategory.id.toString()
          }));
        }
      }
    }
    setServiceSearchOpen(false);
    setServiceSearchQuery("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.rate_per_1000) {
      toast.error("Por favor completa los campos requeridos");
      return;
    }

    try {
      setLoading(true);

      const { data: newService, error } = await supabase.from('services').insert({
        name: formData.name,
        category_id: formData.category_id && formData.category_id !== 'none' ? parseInt(formData.category_id) : null,
        provider_id: formData.provider_id && mode === 'Auto' ? parseInt(formData.provider_id) : null,
        provider_service_id: formData.provider_service_id || null,
        service_type: formData.service_type,
        rate_per_1000: parseFloat(formData.rate_per_1000),
        min_qty: parseInt(formData.min_qty),
        max_qty: parseInt(formData.max_qty),
        enabled: formData.enabled,
        refill: formData.refill,
        cancel_allow: formData.cancel_allow,
        input_type: 'link',
        sync_with_provider: mode === 'Auto',
      }).select('id').single();

      if (error) throw error;

      // Registrar creación en service_updates
      if (newService) {
        await supabase.from('service_updates').insert({
          service_id: newService.id,
          service_name: formData.name,
          update_type: 'created'
        });
      }

      toast.success("Servicio creado exitosamente");
      onSuccess();
      onOpenChange(false);
      setFormData({
        name: "",
        category_id: "",
        provider_id: "",
        provider_service_id: "",
        service_type: "Default",
        rate_per_1000: "",
        min_qty: "1",
        max_qty: "1000000",
        increment: "",
        overflow_percent: "",
        enabled: true,
        refill: false,
        cancel_allow: false,
      });
      setMode("Auto");
      setProviderServices([]);
      setServiceSearchQuery("");
    } catch (error) {
      console.error('Error creating service:', error);
      toast.error("Error al crear servicio");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Service</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Service Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Instagram Followers"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose category" />
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
                value={mode}
                onValueChange={(value: "Auto" | "Manual") => setMode(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Auto">Auto</SelectItem>
                  <SelectItem value="Manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {mode === "Auto" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="provider">Provider</Label>
                  <Select
                    value={formData.provider_id}
                    onValueChange={(value) => {
                      setFormData({ ...formData, provider_id: value, provider_service_id: "" });
                      loadProviderServices(value);
                      setServiceSearchQuery("");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {providers.map(prov => (
                        <SelectItem key={prov.id} value={prov.id.toString()}>
                          {prov.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.provider_id && (
                  <div className="col-span-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="provider_service">Service (from provider)</Label>
                      <span className="text-xs text-muted-foreground">
                        {filteredServices.length} de {providerServices.length} servicios
                      </span>
                    </div>
                    
                    <Popover open={serviceSearchOpen} onOpenChange={setServiceSearchOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={serviceSearchOpen}
                          className="w-full justify-between h-auto min-h-10"
                          disabled={loadingServices}
                        >
                          {loadingServices ? (
                            <span className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Cargando servicios...
                            </span>
                          ) : selectedService ? (
                            <div className="flex flex-col items-start text-left">
                              <span className="font-medium">
                                {selectedService.service_id} - {selectedService.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                ${selectedService.rate} | Min: {selectedService.min_qty} | Max: {selectedService.max_qty}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Buscar servicio por ID, nombre o categoría...</span>
                          )}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[600px] p-0" align="start">
                        <Command shouldFilter={false}>
                          <div className="flex items-center border-b px-3">
                            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                            <input
                              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                              placeholder="Buscar por ID, nombre o categoría..."
                              value={serviceSearchQuery}
                              onChange={(e) => setServiceSearchQuery(e.target.value)}
                            />
                          </div>
                          <CommandList className="max-h-[400px]">
                            <CommandEmpty className="py-6 text-center text-sm">
                              No se encontraron servicios para "{serviceSearchQuery}"
                            </CommandEmpty>
                            {Object.entries(groupedServices).map(([category, services]) => (
                              <CommandGroup key={category} heading={category} className="px-2">
                                {services.map((service) => (
                                  <CommandItem
                                    key={service.id}
                                    value={service.service_id}
                                    onSelect={() => handleProviderServiceSelect(service.service_id)}
                                    className="flex flex-col items-start py-3 cursor-pointer"
                                  >
                                    <div className="flex items-center w-full">
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4 flex-shrink-0",
                                          formData.provider_service_id === service.service_id
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                                            {service.service_id}
                                          </span>
                                          <span className="font-medium truncate">{service.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                          <span className="text-primary font-medium">${service.rate}</span>
                                          <span>•</span>
                                          <span>Min: {service.min_qty?.toLocaleString()}</span>
                                          <span>•</span>
                                          <span>Max: {service.max_qty?.toLocaleString()}</span>
                                          {service.refill && (
                                            <Badge variant="secondary" className="h-5 text-[10px]">
                                              <RefreshCw className="h-3 w-3 mr-1" />
                                              Refill
                                            </Badge>
                                          )}
                                          {service.cancel_allow && (
                                            <Badge variant="outline" className="h-5 text-[10px]">
                                              <Ban className="h-3 w-3 mr-1" />
                                              Cancel
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            ))}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    
                    {formData.provider_service_id && (
                      <p className="text-xs text-muted-foreground">Loaded from provider cache</p>
                    )}
                  </div>
                )}
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="rate">Rate per 1000 *</Label>
              <Input
                id="rate"
                type="number"
                step="0.01"
                value={formData.rate_per_1000}
                onChange={(e) => setFormData({ ...formData, rate_per_1000: e.target.value })}
                placeholder="0.00"
                required
              />
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
                onChange={(e) => setFormData({ ...formData, max_qty: e.target.value })}
              />
            </div>

            {mode === "Auto" && (
              <>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="increment">Increment</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>Cantidad mínima por la que se puede incrementar la orden. Por ejemplo, si es 100, solo se permiten órdenes de 100, 200, 300, etc.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="increment"
                    type="number"
                    value={formData.increment}
                    onChange={(e) => setFormData({ ...formData, increment: e.target.value })}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="overflow">Overflow, %</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>Porcentaje adicional que se enviará al proveedor. Por ejemplo, 10% significa que si el cliente pide 1000, se enviarán 1100 al proveedor para compensar posibles caídas.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="overflow"
                    type="number"
                    step="0.01"
                    value={formData.overflow_percent}
                    onChange={(e) => setFormData({ ...formData, overflow_percent: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex items-center justify-between gap-6 pt-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="enabled"
                checked={formData.enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
              />
              <Label htmlFor="enabled">Enabled</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="refill"
                checked={formData.refill}
                onCheckedChange={(checked) => setFormData({ ...formData, refill: checked })}
              />
              <Label htmlFor="refill">Refill</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="cancel"
                checked={formData.cancel_allow}
                onCheckedChange={(checked) => setFormData({ ...formData, cancel_allow: checked })}
              />
              <Label htmlFor="cancel">Allow Cancel</Label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Service"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddServiceModal;
