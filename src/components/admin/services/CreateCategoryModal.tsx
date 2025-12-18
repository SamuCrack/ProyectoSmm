import { useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { IconSelector } from "./IconSelector";

interface CreateCategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const CreateCategoryModal = ({ open, onOpenChange, onSuccess }: CreateCategoryModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    icon: null as string | null,
    enabled: true,
    sort_order: "0",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error("Por favor ingresa un nombre");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.from('service_categories').insert({
        name: formData.name,
        icon: formData.icon,
        enabled: formData.enabled,
        sort_order: parseInt(formData.sort_order),
      });

      if (error) throw error;

      toast.success("Categoría creada exitosamente");
      onSuccess();
      onOpenChange(false);
      setFormData({
        name: "",
        icon: null,
        enabled: true,
        sort_order: "0",
      });
    } catch (error) {
      console.error('Error creating category:', error);
      toast.error("Error al crear categoría");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Category</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Category Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Instagram Services"
              required
            />
          </div>

          <IconSelector
            selectedIcon={formData.icon}
            onSelectIcon={(icon) => setFormData({ ...formData, icon })}
          />

          <div className="space-y-2">
            <Label htmlFor="sort_order">Position</Label>
            <Select
              value={formData.sort_order}
              onValueChange={(value) => setFormData({ ...formData, sort_order: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Bottom</SelectItem>
                <SelectItem value="1">Top</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="enabled"
              checked={formData.enabled}
              onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
            />
            <Label htmlFor="enabled">Enabled</Label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Category"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCategoryModal;
