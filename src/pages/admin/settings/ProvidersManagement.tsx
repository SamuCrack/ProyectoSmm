import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import SortableProviderCard from "@/components/admin/providers/SortableProviderCard";
import AddProviderModal from "@/components/admin/providers/AddProviderModal";

interface Provider {
  id: number;
  name: string;
  api_url: string;
  api_key: string;
  api_type: string;
  enabled: boolean;
  balance_cached: number | null;
  last_checked: string | null;
  sort_order: number;
}

const ProvidersManagement = () => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [syncingDescriptions, setSyncingDescriptions] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('providers')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;

      setProviders(data || []);
    } catch (error) {
      console.error('Error fetching providers:', error);
      toast.error('Error al cargar proveedores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleProviderAdded = () => {
    fetchProviders();
    setShowAddModal(false);
  };

  const handleSyncDescriptions = async () => {
    try {
      setSyncingDescriptions(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('No hay sesión activa');
        return;
      }

      const response = await supabase.functions.invoke('provider-sync-descriptions', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) throw response.error;

      const result = response.data;
      toast.success(
        `Sincronización completada: ${result.updated_count} servicios actualizados, ${result.skipped_count} omitidos`
      );
    } catch (error) {
      console.error('Error syncing descriptions:', error);
      toast.error('Error al sincronizar descripciones');
    } finally {
      setSyncingDescriptions(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = parseInt(active.id.toString().replace("provider-", ""));
    const overId = parseInt(over.id.toString().replace("provider-", ""));

    const oldIndex = providers.findIndex((p) => p.id === activeId);
    const newIndex = providers.findIndex((p) => p.id === overId);

    const newProviders = arrayMove(providers, oldIndex, newIndex);
    setProviders(newProviders);

    // Save new order to database
    const updates = newProviders.map((provider, index) => ({
      id: provider.id,
      sort_order: index,
    }));

    try {
      for (const update of updates) {
        await supabase
          .from("providers")
          .update({ sort_order: update.sort_order })
          .eq("id", update.id);
      }
      toast.success("Orden actualizado");
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Error al actualizar orden");
      fetchProviders(); // Revert on error
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Providers Management</h2>
          <p className="text-muted-foreground mt-1">
            Gestiona los proveedores de API externos para sincronizar servicios
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleSyncDescriptions}
            disabled={syncingDescriptions}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${syncingDescriptions ? 'animate-spin' : ''}`} />
            Sync Descriptions
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Provider
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-card rounded-lg border border-border animate-pulse" />
          ))}
        </div>
      ) : providers.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg border border-border">
          <p className="text-muted-foreground">No hay proveedores configurados</p>
          <Button onClick={() => setShowAddModal(true)} className="mt-4">
            <Plus className="w-4 h-4 mr-2" />
            Agregar Primer Proveedor
          </Button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={providers.map((p) => `provider-${p.id}`)}
            strategy={verticalListSortingStrategy}
          >
            <div className="grid gap-4">
              {providers.map((provider) => (
                <SortableProviderCard
                  key={provider.id}
                  provider={provider}
                  onUpdate={fetchProviders}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <AddProviderModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSuccess={handleProviderAdded}
      />
    </div>
  );
};

export default ProvidersManagement;
