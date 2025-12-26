import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { MoreVertical, Edit, Copy, Trash2, Power, PowerOff, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

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
}

interface SortableServiceRowProps {
  service: Service;
  providerName: string;
  providerRate: number | null;
  onEdit: () => void;
  onUpdate: () => void;
  selected: boolean;
  onSelectChange: (checked: boolean) => void;
}

const SortableServiceRow = ({
  service,
  providerName,
  providerRate,
  onEdit,
  onUpdate,
  selected,
  onSelectChange,
}: SortableServiceRowProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showExtraConfirmDialog, setShowExtraConfirmDialog] = useState(false);
  const [orderCount, setOrderCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `service-${service.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : (service.enabled ? 1 : 0.5),
  };

  const handleToggleStatus = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('services')
        .update({ enabled: !service.enabled })
        .eq('id', service.id);

      if (error) throw error;

      toast.success(`Servicio ${service.enabled ? 'deshabilitado' : 'habilitado'}`);
      onUpdate();
    } catch (error) {
      console.error('Error toggling service status:', error);
      toast.error('Error al cambiar estado');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('services')
        .insert({
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
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Servicio duplicado');
      onUpdate();
    } catch (error) {
      console.error('Error duplicating service:', error);
      toast.error('Error al duplicar servicio');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = async () => {
    try {
      setLoading(true);
      
      // Contar órdenes asociadas
      const { count, error: ordersError } = await supabase
        .from("orders")
        .select("*", { count: 'exact', head: true })
        .eq("service_id", service.id);

      if (ordersError) throw ordersError;

      if (count && count > 0) {
        setOrderCount(count);
        setShowExtraConfirmDialog(true);
      } else {
        setShowDeleteDialog(true);
      }
    } catch (error) {
      console.error('Error checking orders:', error);
      toast.error('Error al verificar órdenes');
    } finally {
      setLoading(false);
    }
  };

  const confirmSoftDelete = async () => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('services')
        .update({ deleted_at: new Date().toISOString(), enabled: false })
        .eq('id', service.id);

      if (error) throw error;

      toast.success('Servicio eliminado');
      setShowDeleteDialog(false);
      setShowExtraConfirmDialog(false);
      onUpdate();
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('Error al eliminar servicio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <tr
        ref={setNodeRef}
        style={style}
        className="border-b border-border hover:bg-muted/30 transition-colors"
      >
        <td className="p-3 w-10">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
          >
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </button>
        </td>
        <td className="p-3">
          <Checkbox
            checked={selected}
            onCheckedChange={onSelectChange}
          />
        </td>
        <td className="p-3 text-sm text-foreground font-mono">
          {service.id}
        </td>
        <td className="p-3">
          <div>
            <div className="text-sm font-medium text-foreground">{service.name}</div>
            {service.provider_service_id && (
              <div className="text-xs text-muted-foreground mt-1">
                ID: {service.provider_service_id}
              </div>
            )}
          </div>
        </td>
        <td className="p-3">
          <Badge variant="outline" className="text-xs">
            {service.service_type || "Default"}
          </Badge>
        </td>
        <td className="p-3">
          <Badge variant={providerName === "Manual" ? "secondary" : "default"} className="text-xs">
            {providerName}
          </Badge>
        </td>
        <td className="p-3">
          <div>
            <div className="text-sm font-medium text-foreground">
              ${service.rate_per_1000.toFixed(2)}
            </div>
            {providerRate !== null && (
              <div className="text-xs text-muted-foreground">
                ${providerRate.toFixed(2)}
              </div>
            )}
          </div>
        </td>
        <td className="p-3 text-sm text-foreground">
          {service.min_qty}
        </td>
        <td className="p-3 text-sm text-foreground">
          {service.max_qty}
        </td>
        <td className="p-3">
          <Badge variant={service.enabled ? "default" : "secondary"}>
            {service.enabled ? "Enabled" : "Disabled"}
          </Badge>
        </td>
        <td className="p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" disabled={loading}>
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDuplicate}>
                <Copy className="w-4 h-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleToggleStatus}>
                {service.enabled ? (
                  <>
                    <PowerOff className="w-4 h-4 mr-2" />
                    Disable
                  </>
                ) : (
                  <>
                    <Power className="w-4 h-4 mr-2" />
                    Enable
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDeleteClick}
                className="text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </td>
      </tr>

      {/* Diálogo normal (sin órdenes) */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar servicio?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará el servicio "{service.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSoftDelete} disabled={loading}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo con advertencia extra (tiene órdenes) */}
      <AlertDialog open={showExtraConfirmDialog} onOpenChange={setShowExtraConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              Servicio con órdenes asociadas
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p className="font-semibold text-foreground">
                  Este servicio tiene {orderCount} orden(es) asociada(s).
                </p>
                <p>Al eliminar este servicio:</p>
                <ul className="list-disc ml-4 text-sm space-y-1">
                  <li>Las órdenes existentes mantendrán su historial</li>
                  <li>El servicio desaparecerá de la lista</li>
                  <li>Los reportes seguirán funcionando correctamente</li>
                </ul>
                <p className="font-medium">¿Deseas continuar?</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmSoftDelete} 
              disabled={loading}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Eliminar servicio
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SortableServiceRow;
