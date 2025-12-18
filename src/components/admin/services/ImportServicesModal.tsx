import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
// ScrollArea removed - using native overflow-y-auto for better mouse wheel support
import { toast } from "sonner";
import { Search, ChevronDown, ChevronRight, Folder } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ImportServicesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  providers: Array<{ id: number; name: string }>;
  categories: Array<{ id: number; name: string }>;
  cachedServices: Array<{
    id: number;
    provider_id: number;
    service_id: string;
    name: string;
    category: string;
    rate: number;
    min_qty: number;
    max_qty: number;
    refill: boolean;
    cancel_allow: boolean;
    description: string | null;
  }>;
  existingServices?: Array<{
    provider_id: number | null;
    provider_service_id: string | null;
  }>;
  isLoadingCachedServices?: boolean;
}

const ImportServicesModal = ({
  open,
  onOpenChange,
  onSuccess,
  providers,
  categories,
  cachedServices,
  existingServices = [],
  isLoadingCachedServices = false,
}: ImportServicesModalProps) => {
  const [loading, setLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedServices, setSelectedServices] = useState<Set<number>>(new Set());
  const [priceMarkup, setPriceMarkup] = useState("50");
  const [importWithCategories, setImportWithCategories] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());


  // Set of already imported service keys for O(1) lookup
  const importedServiceKeys = useMemo(() => {
    const keys = new Set<string>();
    existingServices.forEach(service => {
      if (service.provider_id && service.provider_service_id) {
        keys.add(`${service.provider_id}-${service.provider_service_id}`);
      }
    });
    return keys;
  }, [existingServices]);

  // Helper to check if a cached service is already imported
  const isServiceImported = (service: { provider_id: number; service_id: string }) => {
    return importedServiceKeys.has(`${service.provider_id}-${service.service_id}`);
  };

  // Filter services by provider, ID, name, and category
  const filteredServices = useMemo(() => {
    return cachedServices.filter(service => {
      const matchesProvider = !selectedProvider || service.provider_id.toString() === selectedProvider;
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        service.name.toLowerCase().includes(searchLower) ||
        service.category.toLowerCase().includes(searchLower) ||
        service.service_id.toLowerCase().includes(searchLower);
      return matchesProvider && matchesSearch;
    });
  }, [cachedServices, selectedProvider, searchQuery]);

  // Count available (not imported) services
  const availableServices = useMemo(() => {
    return filteredServices.filter(s => !importedServiceKeys.has(`${s.provider_id}-${s.service_id}`));
  }, [filteredServices, importedServiceKeys]);

  const importedCount = filteredServices.length - availableServices.length;

  // Group services by category
  const groupedServices = useMemo(() => {
    const groups = new Map<string, typeof filteredServices>();
    filteredServices.forEach(service => {
      const category = service.category || "Uncategorized";
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(service);
    });
    // Sort categories by max service_id DESCENDING (SMMGen provider's order)
    // Categories with most recently added services appear first
    return new Map([...groups.entries()].sort((a, b) => {
      const maxServiceIdA = Math.max(...a[1].map(s => parseInt(s.service_id, 10)));
      const maxServiceIdB = Math.max(...b[1].map(s => parseInt(s.service_id, 10)));
      return maxServiceIdB - maxServiceIdA;
    }));
  }, [filteredServices]);

  // Auto-expand categories when searching
  useMemo(() => {
    if (searchQuery) {
      setExpandedCategories(new Set(groupedServices.keys()));
    }
  }, [searchQuery, groupedServices]);

  const toggleCategory = (categoryName: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName);
    } else {
      newExpanded.add(categoryName);
    }
    setExpandedCategories(newExpanded);
  };

  const handleToggleService = (serviceId: number) => {
    const newSelected = new Set(selectedServices);
    if (newSelected.has(serviceId)) {
      newSelected.delete(serviceId);
    } else {
      newSelected.add(serviceId);
    }
    setSelectedServices(newSelected);
  };

  const handleSelectAll = () => {
    // Only select services that are not already imported
    const selectableServices = filteredServices.filter(s => !isServiceImported(s));
    const allSelectableSelected = selectableServices.every(s => selectedServices.has(s.id));
    
    if (allSelectableSelected) {
      setSelectedServices(new Set());
    } else {
      setSelectedServices(new Set(selectableServices.map(s => s.id)));
    }
  };

  const handleSelectCategory = (categoryName: string) => {
    const categoryServices = groupedServices.get(categoryName) || [];
    // Only select services that are not already imported
    const selectableServices = categoryServices.filter(s => !isServiceImported(s));
    const selectableServiceIds = selectableServices.map(s => s.id);
    const allSelected = selectableServiceIds.every(id => selectedServices.has(id));
    
    const newSelected = new Set(selectedServices);
    if (allSelected) {
      selectableServiceIds.forEach(id => newSelected.delete(id));
    } else {
      selectableServiceIds.forEach(id => newSelected.add(id));
    }
    setSelectedServices(newSelected);
  };

  const getCategorySelectionCount = (categoryName: string) => {
    const categoryServices = groupedServices.get(categoryName) || [];
    return categoryServices.filter(s => selectedServices.has(s.id) && !isServiceImported(s)).length;
  };

  const getCategoryAvailableCount = (categoryName: string) => {
    const categoryServices = groupedServices.get(categoryName) || [];
    return categoryServices.filter(s => !isServiceImported(s)).length;
  };

  const getCategoryImportedCount = (categoryName: string) => {
    const categoryServices = groupedServices.get(categoryName) || [];
    return categoryServices.filter(s => isServiceImported(s)).length;
  };
  const isCategoryFullySelected = (categoryName: string) => {
    const categoryServices = groupedServices.get(categoryName) || [];
    const selectableServices = categoryServices.filter(s => !isServiceImported(s));
    return selectableServices.length > 0 && selectableServices.every(s => selectedServices.has(s.id));
  };

  const isCategoryPartiallySelected = (categoryName: string) => {
    const count = getCategorySelectionCount(categoryName);
    const total = getCategoryAvailableCount(categoryName);
    return count > 0 && count < total;
  };

  const handleImport = async () => {
    if (selectedServices.size === 0) {
      toast.error("Selecciona al menos un servicio");
      return;
    }

    try {
      setLoading(true);
      const servicesToImport = cachedServices.filter(s => selectedServices.has(s.id));
      const markupPercent = parseFloat(priceMarkup) || 0;
      const multiplier = 1 + (markupPercent / 100);

      // Get max sort_order for categories
      const { data: maxCategorySortData } = await supabase
        .from('service_categories')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      let nextCategorySortOrder = (maxCategorySortData?.sort_order || 0) + 1;

      // Get max service_sort for services
      const { data: maxServiceSortData } = await supabase
        .from('services')
        .select('service_sort')
        .order('service_sort', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      const nextServiceSort = (maxServiceSortData?.service_sort || 0) + 1;

      if (importWithCategories) {
        // Group services by category
        const servicesByCategory = new Map<string, typeof servicesToImport>();
        servicesToImport.forEach(service => {
          const category = service.category || "Uncategorized";
          if (!servicesByCategory.has(category)) {
            servicesByCategory.set(category, []);
          }
          servicesByCategory.get(category)!.push(service);
        });

        // Create categories that don't exist
        const categoryMap = new Map<string, number>();
        for (const [categoryName, services] of servicesByCategory.entries()) {
          const existingCategory = categories.find(c => c.name === categoryName);
          
          if (existingCategory) {
            categoryMap.set(categoryName, existingCategory.id);
          } else {
            // Create new category with incremental sort_order
            const { data, error } = await supabase
              .from('service_categories')
              .insert({ name: categoryName, enabled: true, sort_order: nextCategorySortOrder++ })
              .select()
              .single();
            
            if (error) throw error;
            categoryMap.set(categoryName, data.id);
          }
        }

        // Import services with their categories and incremental service_sort
        const newServices = servicesToImport.map((service, index) => ({
          name: service.name,
          category_id: categoryMap.get(service.category || "Uncategorized") || null,
          service_type: "Default",
          provider_id: service.provider_id,
          provider_service_id: service.service_id,
          rate_per_1000: service.rate * multiplier,
          min_qty: service.min_qty,
          max_qty: service.max_qty,
          enabled: true,
          refill: service.refill,
          cancel_allow: service.cancel_allow,
          sync_with_provider: true,
          input_type: 'link',
          notes: service.description || null,
          service_sort: nextServiceSort + index,
        }));

        const { error } = await supabase.from('services').insert(newServices);
        if (error) throw error;
      }

      toast.success(`${selectedServices.size} servicios ${importWithCategories ? 'y categorías ' : ''}importados exitosamente`);
      onSuccess();
      onOpenChange(false);
      setSelectedServices(new Set());
      setSearchQuery("");
      setSelectedProvider("");
      setExpandedCategories(new Set());
    } catch (error) {
      console.error('Error importing services:', error);
      toast.error("Error al importar servicios");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Import Services from Provider
            <span className="text-xs text-muted-foreground ml-2 font-normal">
              ({cachedServices.length} total en caché)
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map(provider => (
                    <SelectItem key={provider.id} value={provider.id.toString()}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Porcentaje de Aumento (%)</Label>
              <div className="relative">
                <Input
                  type="number"
                  step="1"
                  min="0"
                  value={priceMarkup}
                  onChange={(e) => setPriceMarkup(e.target.value)}
                  placeholder="50"
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Porcentaje a agregar (50% = x1.5, 100% = x2, 200% = x3)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 p-3 border rounded-lg bg-muted/30">
            <Checkbox
              id="import-categories"
              checked={importWithCategories}
              onCheckedChange={(checked) => setImportWithCategories(checked as boolean)}
            />
            <Label htmlFor="import-categories" className="cursor-pointer">
              Importar con categorías del API automáticamente
            </Label>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar por ID, nombre o categoría..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedServices.size === filteredServices.length ? "Deselect All" : "Select All"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (expandedCategories.size === groupedServices.size) {
                    setExpandedCategories(new Set());
                  } else {
                    setExpandedCategories(new Set(groupedServices.keys()));
                  }
                }}
              >
                {expandedCategories.size === groupedServices.size ? "Collapse All" : "Expand All"}
              </Button>
            </div>
            <span className="text-sm text-muted-foreground">
              {selectedServices.size} / {availableServices.length} disponibles
              {importedCount > 0 && <span className="text-green-600"> • {importedCount} ya importados</span>}
            </span>
          </div>

          <div className="flex-1 border rounded-md min-h-[300px] max-h-[350px] overflow-y-auto">
            <div className="p-2">
              {isLoadingCachedServices ? (
                <div className="text-center py-8 text-muted-foreground">
                  Cargando servicios del proveedor...
                </div>
              ) : groupedServices.size === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No services found. Select a provider or adjust your search.
                </div>
              ) : (
                Array.from(groupedServices.entries()).map(([categoryName, services]) => (
                  <Collapsible
                    key={categoryName}
                    open={expandedCategories.has(categoryName)}
                    onOpenChange={() => toggleCategory(categoryName)}
                  >
                    <div className="border rounded-lg mb-2 overflow-hidden">
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between p-3 bg-muted/50 hover:bg-muted/70 cursor-pointer transition-colors">
                          <div className="flex items-center gap-2">
                            {expandedCategories.has(categoryName) ? (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            )}
                            <Folder className="w-4 h-4 text-primary" />
                            <span className="font-medium text-sm">{categoryName}</span>
                            <span className="text-xs text-muted-foreground">
                              ({services.length} services)
                            </span>
                          </div>
                          <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                            <span className="text-xs text-muted-foreground">
                              {getCategorySelectionCount(categoryName)} selected
                            </span>
                            <Checkbox
                              checked={isCategoryFullySelected(categoryName)}
                              ref={(el) => {
                                if (el) {
                                  (el as HTMLButtonElement).dataset.state = isCategoryPartiallySelected(categoryName) 
                                    ? "indeterminate" 
                                    : isCategoryFullySelected(categoryName) 
                                    ? "checked" 
                                    : "unchecked";
                                }
                              }}
                              onCheckedChange={() => handleSelectCategory(categoryName)}
                            />
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="divide-y">
                          {services.map(service => {
                            const alreadyImported = isServiceImported(service);
                            return (
                              <div
                                key={service.id}
                                className={`flex items-start space-x-3 p-3 transition-colors ${
                                  alreadyImported 
                                    ? 'bg-green-500/10 opacity-60 cursor-not-allowed' 
                                    : 'hover:bg-muted/30'
                                }`}
                              >
                                <Checkbox
                                  checked={alreadyImported || selectedServices.has(service.id)}
                                  onCheckedChange={() => !alreadyImported && handleToggleService(service.id)}
                                  disabled={alreadyImported}
                                  className="mt-0.5"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                      ID: {service.service_id}
                                    </span>
                                    {alreadyImported && (
                                      <span className="text-xs bg-green-500/20 text-green-600 px-1.5 py-0.5 rounded font-medium">
                                        ✓ Importado
                                      </span>
                                    )}
                                  </div>
                                  <div className="font-medium text-sm mt-1">{service.name}</div>
                                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-1">
                                    <span>${service.rate}/1k</span>
                                    <span>•</span>
                                    <span>Min: {service.min_qty}</span>
                                    <span>•</span>
                                    <span>Max: {service.max_qty}</span>
                                    {service.refill && (
                                      <>
                                        <span>•</span>
                                        <span className="text-green-600">Refill</span>
                                      </>
                                    )}
                                    {service.cancel_allow && (
                                      <>
                                        <span>•</span>
                                        <span className="text-blue-600">Cancel</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={loading || selectedServices.size === 0}>
              {loading ? "Importing..." : `Import ${selectedServices.size} Services`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportServicesModal;
