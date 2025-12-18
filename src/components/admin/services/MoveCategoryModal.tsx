import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MoveCategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceIds: number[];
  categories: { id: number; name: string }[];
  onSuccess: () => void;
}

const MoveCategoryModal = ({
  open,
  onOpenChange,
  serviceIds,
  categories,
  onSuccess,
}: MoveCategoryModalProps) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleMove = async () => {
    if (!selectedCategoryId) {
      toast.error("Selecciona una categoría");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from("services")
        .update({ category_id: parseInt(selectedCategoryId) })
        .in("id", serviceIds);

      if (error) throw error;

      toast.success(`${serviceIds.length} servicio(s) movido(s) exitosamente`);
      onSuccess();
      onOpenChange(false);
      setSelectedCategoryId("");
    } catch (error) {
      console.error("Error moving services:", error);
      toast.error("Error al mover servicios");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mover a Categoría</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Mover {serviceIds.length} servicio(s) seleccionado(s) a:
          </p>

          <div className="space-y-2">
            <Label>Nueva Categoría</Label>
            <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleMove} disabled={loading}>
            {loading ? "Moviendo..." : "Mover"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MoveCategoryModal;
