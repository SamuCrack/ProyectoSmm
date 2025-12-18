import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import AddServiceModal from "@/components/admin/services/AddServiceModal";
import CreateCategoryModal from "@/components/admin/services/CreateCategoryModal";
import ImportServicesModal from "@/components/admin/services/ImportServicesModal";
import EditServiceModal from "@/components/admin/services/EditServiceModal";
import EditCategoryModal from "@/components/admin/services/EditCategoryModal";
import SortableServiceRow from "@/components/admin/services/SortableServiceRow";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MoveCategoryModal from "@/components/admin/services/MoveCategoryModal";
import { Copy, Trash2, Power, PowerOff, FolderInput, GripVertical, Eye, EyeOff, Percent } from "lucide-react";
import AdjustRatesModal from "@/components/admin/services/AdjustRatesModal";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  CollisionDetection,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import SortableCategorySection from "@/components/admin/services/SortableCategorySection";

interface Service {
  id: number;
  name: string;
  category_id: number | null;
  service_type: string | null;
  provider_id: number | null;
  provider_service_id: string | null;
  rate_per_1000: number;
  min_qty: number;
  max_qty: number;
  enabled: boolean;
  sync_with_provider: boolean;
  input_type: string | null;
  refill: boolean;
  cancel_allow: boolean;
  service_sort: number;
}

interface Category {
  id: number;
  name: string;
  icon: string | null;
  enabled: boolean;
  sort_order: number;
  created_at?: string;
}

interface Provider {
  id: number;
  name: string;
}

interface CachedService {
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
}

const ServicesManagement = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [cachedServices, setCachedServices] = useState<CachedService[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterProvider, setFilterProvider] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [showAddService, setShowAddService] = useState(false);
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [showImportServices, setShowImportServices] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Selección múltiple
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [showMoveCategory, setShowMoveCategory] = useState(false);
  const [showAdjustRates, setShowAdjustRates] = useState(false);
  
  // Drag and drop state
  const [activeId, setActiveId] = useState<string | null>(null);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Custom collision detection - filters targets based on dragged element type
  const customCollisionDetection: CollisionDetection = useCallback((args) => {
    const { active, droppableContainers } = args;
    
    if (!active) return [];
    
    const draggedId = String(active.id);
    const isDraggingCategory = draggedId.startsWith('category-');
    
    // Filter containers to only match same type (category-to-category, service-to-service)
    const filteredContainers = droppableContainers.filter((container) => {
      const containerId = String(container.id);
      if (isDraggingCategory) {
        return containerId.startsWith('category-');
      } else {
        return containerId.startsWith('service-');
      }
    });
    
    return closestCenter({
      ...args,
      droppableContainers: filteredContainers,
    });
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // Handle category reordering
    if (activeId.startsWith('category-') && overId.startsWith('category-')) {
      const activeCategoryId = parseInt(activeId.replace('category-', ''));
      const overCategoryId = parseInt(overId.replace('category-', ''));

      const oldIndex = categories.findIndex((c) => c.id === activeCategoryId);
      const newIndex = categories.findIndex((c) => c.id === overCategoryId);

      if (oldIndex === -1 || newIndex === -1) return;

      const reorderedCategories = arrayMove(categories, oldIndex, newIndex);
      setCategories(reorderedCategories);

      try {
        const updates = reorderedCategories.map((category, index) => ({
          id: category.id,
          sort_order: index,
        }));

        for (const update of updates) {
          const { error } = await supabase
            .from("service_categories")
            .update({ sort_order: update.sort_order })
            .eq("id", update.id);

          if (error) throw error;
        }

        toast.success("Orden de categorías actualizado");
      } catch (error) {
        console.error("Error updating category order:", error);
        toast.error("Error al actualizar orden de categorías");
        fetchData();
      }
      return;
    }

    // Handle service reordering within same category
    if (activeId.startsWith('service-') && overId.startsWith('service-')) {
      const activeServiceId = parseInt(activeId.replace('service-', ''));
      const overServiceId = parseInt(overId.replace('service-', ''));

      const activeService = services.find(s => s.id === activeServiceId);
      const overService = services.find(s => s.id === overServiceId);

      if (!activeService || !overService) return;

      // Only allow reordering within the same category
      if (activeService.category_id !== overService.category_id) return;

      const categoryId = activeService.category_id;
      const categoryServices = services
        .filter(s => s.category_id === categoryId)
        .sort((a, b) => (a as any).service_sort - (b as any).service_sort);

      const oldIndex = categoryServices.findIndex(s => s.id === activeServiceId);
      const newIndex = categoryServices.findIndex(s => s.id === overServiceId);

      if (oldIndex === -1 || newIndex === -1) return;

      const reorderedServices = arrayMove(categoryServices, oldIndex, newIndex);

      // Update local state
      const updatedServices = services.map(s => {
        const newIndex = reorderedServices.findIndex(rs => rs.id === s.id);
        if (newIndex !== -1) {
          return { ...s, service_sort: newIndex } as Service;
        }
        return s;
      });
      setServices(updatedServices);

      // Update database
      try {
        for (const [index, service] of reorderedServices.entries()) {
          const { error } = await supabase
            .from('services')
            .update({ service_sort: index })
            .eq('id', service.id);

          if (error) throw error;
        }

        toast.success("Orden de servicios actualizado");
      } catch (error) {
        console.error("Error updating service order:", error);
        toast.error("Error al actualizar orden de servicios");
        fetchData();
      }
    }
  };

  // Helper function to fetch all cached services with pagination
  const fetchAllCachedServices = async () => {
    const allServices: any[] = [];
    const pageSize = 1000;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('provider_services_cache')
        .select('id, provider_id, service_id, name, category, rate, min_qty, max_qty, refill, cancel_allow, description')
        .range(offset, offset + pageSize - 1);

      if (error) {
        console.error('Error fetching cached services page:', error);
        throw error;
      }

      if (data && data.length > 0) {
        allServices.push(...data);
        offset += pageSize;
        hasMore = data.length === pageSize;
      } else {
        hasMore = false;
      }
    }

    return allServices;
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      const [servicesRes, categoriesRes, providersRes, cachedRes] = await Promise.all([
        supabase.from('services').select('*').is('deleted_at', null).order('service_sort', { ascending: true }),
        supabase.from('service_categories').select('*').order('sort_order', { ascending: true }),
        supabase.from('providers').select('id, name').eq('enabled', true),
        fetchAllCachedServices(),
      ]);

      if (servicesRes.error) throw servicesRes.error;
      if (categoriesRes.error) throw categoriesRes.error;
      if (providersRes.error) throw providersRes.error;

      setServices(servicesRes.data || []);
      setCategories(categoriesRes.data || []);
      setProviders(providersRes.data || []);
      setCachedServices(cachedRes || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  // Silent fetch - updates data without showing loading state (preserves scroll position)
  const fetchDataSilent = async () => {
    try {
      const [servicesRes, categoriesRes, providersRes, cachedRes] = await Promise.all([
        supabase.from('services').select('*').is('deleted_at', null).order('service_sort', { ascending: true }),
        supabase.from('service_categories').select('*').order('sort_order', { ascending: true }),
        supabase.from('providers').select('id, name').eq('enabled', true),
        fetchAllCachedServices(),
      ]);

      if (servicesRes.error) throw servicesRes.error;
      if (categoriesRes.error) throw categoriesRes.error;
      if (providersRes.error) throw providersRes.error;

      setServices(servicesRes.data || []);
      setCategories(categoriesRes.data || []);
      setProviders(providersRes.data || []);
      setCachedServices(cachedRes || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  // Lazy load cached services only when needed (Import modal)
  const [cachedServicesLoading, setCachedServicesLoading] = useState(false);
  const loadCachedServicesIfNeeded = async () => {
    if (cachedServices.length > 0 || cachedServicesLoading) return;
    setCachedServicesLoading(true);
    try {
      const cached = await fetchAllCachedServices();
      setCachedServices(cached);
    } catch (error) {
      console.error('Error loading cached services:', error);
    } finally {
      setCachedServicesLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || service.service_type === filterType;
    const matchesProvider = filterProvider === "all" || 
      (filterProvider === "manual" && !service.provider_id) ||
      service.provider_id?.toString() === filterProvider;
    const matchesStatus = filterStatus === "all" || 
      (filterStatus === "enabled" && service.enabled) ||
      (filterStatus === "disabled" && !service.enabled);

    return matchesSearch && matchesType && matchesProvider && matchesStatus;
  });

  const serviceTypes = [...new Set(services.map(s => s.service_type).filter(Boolean))];

  const getCategoryName = (categoryId: number | null) => {
    if (!categoryId) return "Sin categoría";
    return categories.find(c => c.id === categoryId)?.name || "Desconocida";
  };

  const getProviderName = (providerId: number | null) => {
    if (!providerId) return "Manual";
    return providers.find(p => p.id === providerId)?.name || "Desconocido";
  };

  const getProviderRate = (service: Service) => {
    if (!service.provider_id || !service.provider_service_id) return null;
    const cached = cachedServices.find(
      cs => cs.provider_id === service.provider_id && cs.service_id === service.provider_service_id
    );
    return cached?.rate || null;
  };

  // Separar categorías activas y desactivadas
  const activeGroupedServices = categories
    .filter(c => c.enabled)
    .reduce((acc, category) => {
      const categoryServices = filteredServices
        .filter(s => s.category_id === category.id)
        .sort((a, b) => a.service_sort - b.service_sort);
      if (categoryServices.length > 0) {
        acc[category.name] = { category, services: categoryServices };
      }
      return acc;
    }, {} as Record<string, { category: Category; services: Service[] }>);

  const disabledGroupedServices = categories
    .filter(c => !c.enabled)
    .reduce((acc, category) => {
      const categoryServices = filteredServices
        .filter(s => s.category_id === category.id)
        .sort((a, b) => a.service_sort - b.service_sort);
      if (categoryServices.length > 0) {
        acc[category.name] = { category, services: categoryServices };
      }
      return acc;
    }, {} as Record<string, { category: Category; services: Service[] }>);

  // Combinar para groupedServices (mantener compatibilidad con lógica existente)
  const groupedServices = { ...activeGroupedServices, ...disabledGroupedServices };

  // Servicios sin categoría
  const uncategorizedServices = filteredServices
    .filter(s => !s.category_id)
    .sort((a, b) => a.service_sort - b.service_sort);
  if (uncategorizedServices.length > 0) {
    activeGroupedServices["Sin categoría"] = {
      category: { id: 0, name: "Sin categoría", icon: null, enabled: true, sort_order: 999, created_at: new Date().toISOString() },
      services: uncategorizedServices,
    };
  }

  // Estado para controlar el colapso de categorías desactivadas
  const [disabledCategoriesOpen, setDisabledCategoriesOpen] = useState(false);
  const disabledCategoriesCount = Object.keys(disabledGroupedServices).length;

  // Handlers de selección múltiple
  const handleSelectService = (serviceId: number, checked: boolean) => {
    if (checked) {
      setSelectedServices([...selectedServices, serviceId]);
    } else {
      setSelectedServices(selectedServices.filter((id) => id !== serviceId));
    }
  };

  const handleSelectAllServices = (categoryServices: Service[], checked: boolean) => {
    const serviceIds = categoryServices.map((s) => s.id);
    if (checked) {
      setSelectedServices([...new Set([...selectedServices, ...serviceIds])]);
    } else {
      setSelectedServices(selectedServices.filter((id) => !serviceIds.includes(id)));
    }
  };

  // Acciones masivas
  const handleBulkDelete = async () => {
    if (selectedServices.length === 0) return;

    if (!confirm(`¿Eliminar ${selectedServices.length} servicio(s) seleccionado(s)?`)) return;

    try {
      // Obtener información de los servicios antes de eliminarlos para registrar en service_updates
      const servicesToDelete = services.filter((s) => selectedServices.includes(s.id));
      
      // Registrar eliminaciones en service_updates
      const deleteUpdates = servicesToDelete.map((service) => ({
        service_id: service.id,
        service_name: service.name,
        update_type: 'deleted'
      }));

      if (deleteUpdates.length > 0) {
        await supabase.from('service_updates').insert(deleteUpdates);
      }

      // Soft delete - marcar como eliminado en lugar de borrar
      const { error } = await supabase
        .from("services")
        .update({ deleted_at: new Date().toISOString(), enabled: false })
        .in("id", selectedServices);

      if (error) throw error;

      toast.success(`${selectedServices.length} servicio(s) eliminado(s)`);
      setSelectedServices([]);
      fetchDataSilent();
    } catch (error) {
      console.error("Error deleting services:", error);
      toast.error("Error al eliminar servicios");
    }
  };

  const handleBulkDuplicate = async () => {
    if (selectedServices.length === 0) return;

    try {
      const servicesToDuplicate = services.filter((s) => selectedServices.includes(s.id));

      const duplicates = servicesToDuplicate.map((service) => ({
        name: `${service.name} (Copy)`,
        category_id: service.category_id,
        service_type: service.service_type,
        provider_id: service.provider_id,
        provider_service_id: service.provider_service_id,
        rate_per_1000: service.rate_per_1000,
        min_qty: service.min_qty,
        max_qty: service.max_qty,
        enabled: false,
        sync_with_provider: service.sync_with_provider,
        input_type: service.input_type,
        refill: service.refill,
        cancel_allow: service.cancel_allow,
      }));

      const { error } = await supabase.from("services").insert(duplicates);

      if (error) throw error;

      toast.success(`${selectedServices.length} servicio(s) duplicado(s)`);
      setSelectedServices([]);
      fetchDataSilent();
    } catch (error) {
      console.error("Error duplicating services:", error);
      toast.error("Error al duplicar servicios");
    }
  };

  const handleBulkToggleStatus = async (enabled: boolean) => {
    if (selectedServices.length === 0) return;

    try {
      const { error } = await supabase
        .from("services")
        .update({ enabled })
        .in("id", selectedServices);

      if (error) throw error;

      toast.success(
        `${selectedServices.length} servicio(s) ${enabled ? "habilitado(s)" : "deshabilitado(s)"}`
      );
      setSelectedServices([]);
      fetchDataSilent();
    } catch (error) {
      console.error("Error updating services:", error);
      toast.error("Error al actualizar servicios");
    }
  };

  // Calcular qué categorías tienen TODOS sus servicios seleccionados
  const selectedCategoryIds = Object.entries(groupedServices)
    .filter(([_, { category, services: categoryServices }]) => {
      const allSelected = categoryServices.length > 0 && 
        categoryServices.every((s) => selectedServices.includes(s.id));
      return allSelected && category.id !== 0;
    })
    .map(([_, { category }]) => category.id);

  const handleBulkCategoryToggleStatus = async (enabled: boolean) => {
    if (selectedCategoryIds.length === 0) {
      toast.error("No hay categorías completamente seleccionadas");
      return;
    }

    try {
      const { error } = await supabase
        .from("service_categories")
        .update({ enabled })
        .in("id", selectedCategoryIds);

      if (error) throw error;

      // If disabling categories, also disable all their services
      if (!enabled) {
        const { error: servicesError } = await supabase
          .from("services")
          .update({ enabled: false })
          .in("category_id", selectedCategoryIds);

        if (servicesError) {
          console.error("Error disabling services:", servicesError);
        }
      }

      toast.success(
        `${selectedCategoryIds.length} categoría(s) ${enabled ? "habilitada(s)" : "deshabilitada(s)"}`
      );
      setSelectedServices([]);
      fetchDataSilent();
    } catch (error) {
      console.error("Error updating categories:", error);
      toast.error("Error al actualizar categorías");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header - Sticky */}
      <div className="sticky top-14 z-40 bg-background/95 backdrop-blur-sm pb-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Services Management</h2>
            <p className="text-muted-foreground mt-1">
              Gestiona servicios y categorías
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowAddService(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add service
            </Button>
            <Button variant="outline" onClick={() => setShowCreateCategory(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create category
            </Button>
            <Button variant="secondary" onClick={() => setShowImportServices(true)}>
              Import services
            </Button>
          </div>
        </div>
      </div>

      {/* Acciones masivas - Sticky */}
      {selectedServices.length > 0 && (
        <div className="sticky top-14 z-50 bg-muted/95 backdrop-blur-sm rounded-lg border border-border p-4 flex items-center justify-between shadow-lg">
          <span className="text-sm text-muted-foreground">
            {selectedServices.length} servicio(s) seleccionado(s)
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowMoveCategory(true)}
            >
              <FolderInput className="w-4 h-4 mr-2" />
              Mover categoría
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkDuplicate}
            >
              <Copy className="w-4 h-4 mr-2" />
              Duplicar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkToggleStatus(true)}
            >
              <Power className="w-4 h-4 mr-2" />
              Habilitar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkToggleStatus(false)}
            >
              <PowerOff className="w-4 h-4 mr-2" />
              Deshabilitar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleBulkDelete}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAdjustRates(true)}
            >
              <Percent className="w-4 h-4 mr-2" />
            </Button>

            {/* Separador y botones de categoría */}
            <div className="w-px h-6 bg-border mx-2" />
            
            {selectedCategoryIds.length > 0 && (
              <span className="text-xs text-primary font-medium">
                ({selectedCategoryIds.length} categoría{selectedCategoryIds.length > 1 ? 's' : ''})
              </span>
            )}
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkCategoryToggleStatus(true)}
              disabled={selectedCategoryIds.length === 0}
              title="Habilita las categorías cuyos servicios están todos seleccionados"
            >
              <Eye className="w-4 h-4 mr-2" />
              Habilitar Categoría
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkCategoryToggleStatus(false)}
              disabled={selectedCategoryIds.length === 0}
              title="Deshabilita las categorías cuyos servicios están todos seleccionados"
            >
              <EyeOff className="w-4 h-4 mr-2" />
              Deshabilitar Categoría
            </Button>
          </div>
        </div>
      )}

      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {serviceTypes.map(type => (
              <SelectItem key={type} value={type!}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterProvider} onValueChange={setFilterProvider}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Provider" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Providers</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
            {providers.map(provider => (
              <SelectItem key={provider.id} value={provider.id.toString()}>
                {provider.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="enabled">Enabled</SelectItem>
            <SelectItem value="disabled">Disabled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="bg-card rounded-lg border border-border p-8 text-center">
          <p className="text-muted-foreground">Cargando servicios...</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={customCollisionDetection}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="space-y-6">
            {Object.keys(activeGroupedServices).length === 0 && disabledCategoriesCount === 0 ? (
              <div className="bg-card rounded-lg border border-border p-8 text-center">
                <p className="text-muted-foreground">No se encontraron servicios</p>
              </div>
            ) : (
              <>
                {/* Categorías Activas */}
                <SortableContext
                  items={Object.values(activeGroupedServices).map(({ category }) => `category-${category.id}`)}
                  strategy={verticalListSortingStrategy}
                >
                  {Object.entries(activeGroupedServices).map(([categoryName, { category, services: categoryServices }]) => {
                    const allSelected = categoryServices.every((s) => selectedServices.includes(s.id));
                    const someSelected = categoryServices.some((s) => selectedServices.includes(s.id));

                    return (
                      <SortableCategorySection
                        key={category.id}
                        categoryName={categoryName}
                        category={category}
                        services={categoryServices}
                        allSelected={allSelected}
                        someSelected={someSelected}
                        selectedServices={selectedServices}
                        onSelectAll={handleSelectAllServices}
                        onEditCategory={setEditingCategory}
                      >
                        <div className="bg-card rounded-lg border border-border overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b border-border bg-muted/50">
                                  <th className="w-10 p-3"></th>
                                  <th className="w-12 p-3"></th>
                                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">ID</th>
                                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Service</th>
                                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Type</th>
                                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Provider</th>
                                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Rate</th>
                                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Min</th>
                                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Max</th>
                                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Status</th>
                                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Actions</th>
                                </tr>
                              </thead>
                              <SortableContext
                                items={categoryServices.map(s => `service-${s.id}`)}
                                strategy={verticalListSortingStrategy}
                              >
                                <tbody>
                                  {categoryServices.map(service => (
                                    <SortableServiceRow
                                      key={service.id}
                                      service={service}
                                      providerName={getProviderName(service.provider_id)}
                                      providerRate={getProviderRate(service)}
                                      onEdit={() => setEditingService(service)}
                                      onUpdate={fetchDataSilent}
                                      selected={selectedServices.includes(service.id)}
                                      onSelectChange={(checked) => handleSelectService(service.id, checked)}
                                    />
                                  ))}
                                </tbody>
                              </SortableContext>
                            </table>
                          </div>
                        </div>
                      </SortableCategorySection>
                    );
                  })}
                </SortableContext>

                {/* Categorías Desactivadas - Collapsible */}
                {disabledCategoriesCount > 0 && (
                  <Collapsible
                    open={disabledCategoriesOpen}
                    onOpenChange={setDisabledCategoriesOpen}
                  >
                    <CollapsibleTrigger className="flex items-center gap-3 w-full p-4 bg-muted/30 hover:bg-muted/50 rounded-lg border border-border transition-colors">
                      <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${disabledCategoriesOpen ? 'rotate-90' : ''}`} />
                      <span className="font-medium text-muted-foreground">
                        Categorías Desactivadas ({disabledCategoriesCount})
                      </span>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-6 mt-4">
                      <SortableContext
                        items={Object.values(disabledGroupedServices).map(({ category }) => `category-${category.id}`)}
                        strategy={verticalListSortingStrategy}
                      >
                        {Object.entries(disabledGroupedServices).map(([categoryName, { category, services: categoryServices }]) => {
                          const allSelected = categoryServices.every((s) => selectedServices.includes(s.id));
                          const someSelected = categoryServices.some((s) => selectedServices.includes(s.id));

                          return (
                            <SortableCategorySection
                              key={category.id}
                              categoryName={categoryName}
                              category={category}
                              services={categoryServices}
                              allSelected={allSelected}
                              someSelected={someSelected}
                              selectedServices={selectedServices}
                              onSelectAll={handleSelectAllServices}
                              onEditCategory={setEditingCategory}
                            >
                              <div className="bg-card rounded-lg border border-border overflow-hidden opacity-70">
                                <div className="overflow-x-auto">
                                  <table className="w-full">
                                    <thead>
                                      <tr className="border-b border-border bg-muted/50">
                                        <th className="w-10 p-3"></th>
                                        <th className="w-12 p-3"></th>
                                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">ID</th>
                                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Service</th>
                                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Type</th>
                                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Provider</th>
                                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Rate</th>
                                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Min</th>
                                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Max</th>
                                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Status</th>
                                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Actions</th>
                                      </tr>
                                    </thead>
                                    <SortableContext
                                      items={categoryServices.map(s => `service-${s.id}`)}
                                      strategy={verticalListSortingStrategy}
                                    >
                                      <tbody>
                                        {categoryServices.map(service => (
                                          <SortableServiceRow
                                            key={service.id}
                                            service={service}
                                            providerName={getProviderName(service.provider_id)}
                                            providerRate={getProviderRate(service)}
                                            onEdit={() => setEditingService(service)}
                                            onUpdate={fetchDataSilent}
                                            selected={selectedServices.includes(service.id)}
                                            onSelectChange={(checked) => handleSelectService(service.id, checked)}
                                          />
                                        ))}
                                      </tbody>
                                    </SortableContext>
                                  </table>
                                </div>
                              </div>
                            </SortableCategorySection>
                          );
                        })}
                      </SortableContext>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </>
            )}
          </div>
          
          {/* DragOverlay para mejor feedback visual */}
          <DragOverlay>
            {activeId?.startsWith('category-') && (
              <div className="bg-card border-2 border-primary rounded-lg p-4 shadow-xl opacity-95">
                <div className="flex items-center gap-3">
                  <GripVertical className="w-5 h-5 text-muted-foreground" />
                  <span className="font-semibold text-foreground">
                    {categories.find(c => `category-${c.id}` === activeId)?.name || 'Categoría'}
                  </span>
                </div>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      <AddServiceModal
        open={showAddService}
        onOpenChange={setShowAddService}
        onSuccess={fetchData}
        categories={categories}
        providers={providers}
      />

      <CreateCategoryModal
        open={showCreateCategory}
        onOpenChange={setShowCreateCategory}
        onSuccess={fetchData}
      />

      <ImportServicesModal
        open={showImportServices}
        onOpenChange={(open) => {
          if (open) loadCachedServicesIfNeeded();
          setShowImportServices(open);
        }}
        onSuccess={fetchData}
        providers={providers}
        categories={categories}
        cachedServices={cachedServices}
        existingServices={services}
        isLoadingCachedServices={cachedServicesLoading}
      />

      <MoveCategoryModal
        open={showMoveCategory}
        onOpenChange={setShowMoveCategory}
        serviceIds={selectedServices}
        categories={categories
          .filter(cat => cat.enabled)
          .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
        }
        onSuccess={() => {
          fetchDataSilent();
          setSelectedServices([]);
        }}
      />

      {editingCategory && (
        <EditCategoryModal
          open={!!editingCategory}
          onOpenChange={(open) => !open && setEditingCategory(null)}
          onSuccess={() => {
            const scrollY = window.scrollY;
            fetchDataSilent().then(() => {
              requestAnimationFrame(() => window.scrollTo(0, scrollY));
            });
            setEditingCategory(null);
          }}
          category={editingCategory}
        />
      )}

      {editingService && (
        <EditServiceModal
          open={!!editingService}
          onOpenChange={(open) => !open && setEditingService(null)}
          onSuccess={fetchDataSilent}
          service={editingService}
          categories={categories}
          providers={providers}
        />
      )}

      <AdjustRatesModal
        open={showAdjustRates}
        onOpenChange={setShowAdjustRates}
        selectedServices={services.filter((s) => selectedServices.includes(s.id))}
        cachedServices={cachedServices}
        onSuccess={() => {
          fetchDataSilent();
          setSelectedServices([]);
        }}
      />
    </div>
  );
};

export default ServicesManagement;
