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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { IconSelector } from "./IconSelector";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EditCategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  category: {
    id: number;
    name: string;
    icon: string | null;
    enabled: boolean;
    sort_order: number;
  } | null;
}

const EditCategoryModal = ({ open, onOpenChange, onSuccess, category }: EditCategoryModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    icon: null as string | null,
    enabled: true,
  });
  const [users, setUsers] = useState<{ id: string; email: string }[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email')
        .order('email');
      
      if (profiles) {
        setUsers(profiles);
      }
    };

    const fetchCategoryAccess = async () => {
      if (category) {
        const { data: access } = await supabase
          .from('category_user_access')
          .select('user_id')
          .eq('category_id', category.id);
        
        if (access) {
          setSelectedUsers(access.map(a => a.user_id));
        }
      }
    };

    if (open) {
      fetchUsers();
      fetchCategoryAccess();
    }

    if (category) {
      setFormData({
        name: category.name,
        icon: category.icon,
        enabled: category.enabled,
      });
    }
  }, [category, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !category) {
      toast.error("Por favor ingresa un nombre");
      return;
    }

    try {
      setLoading(true);

      // Update category (sort_order is managed via drag & drop only)
      const { error } = await supabase
        .from('service_categories')
        .update({
          name: formData.name,
          icon: formData.icon,
          enabled: formData.enabled,
        })
        .eq('id', category.id);

      if (error) throw error;

      // If category was disabled, also disable all its services
      if (!formData.enabled) {
        const { error: servicesError } = await supabase
          .from('services')
          .update({ enabled: false })
          .eq('category_id', category.id);

        if (servicesError) {
          console.error('Error disabling services:', servicesError);
        }
      }

      // Delete existing access rules
      await supabase
        .from('category_user_access')
        .delete()
        .eq('category_id', category.id);

      // Insert new access rules if any users selected
      if (selectedUsers.length > 0) {
        const accessRules = selectedUsers.map(userId => ({
          category_id: category.id,
          user_id: userId,
        }));

        const { error: accessError } = await supabase
          .from('category_user_access')
          .insert(accessRules);

        if (accessError) throw accessError;
      }

      toast.success("Categoría actualizada exitosamente");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error("Error al actualizar categoría");
    } finally {
      setLoading(false);
    }
  };

  if (!category) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Category (ID: {category.id})</DialogTitle>
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

          <div className="flex items-center space-x-2">
            <Switch
              id="enabled"
              checked={formData.enabled}
              onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
            />
            <Label htmlFor="enabled">Enabled</Label>
          </div>

          <div className="space-y-2">
            <Label>Usuarios con Acceso (Restricción)</Label>
            <p className="text-sm text-muted-foreground">
              Si no seleccionas usuarios, la categoría será pública. Si seleccionas usuarios, solo ellos podrán verla.
            </p>
            <ScrollArea className="h-48 border rounded-md p-3">
              {users.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay usuarios disponibles</p>
              ) : (
                <div className="space-y-2">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`user-${user.id}`}
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedUsers([...selectedUsers, user.id]);
                          } else {
                            setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                          }
                        }}
                      />
                      <Label htmlFor={`user-${user.id}`} className="cursor-pointer flex-1">
                        {user.email}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            <p className="text-xs text-muted-foreground">
              {selectedUsers.length === 0 
                ? "Categoría pública - todos los usuarios pueden verla" 
                : `${selectedUsers.length} usuario(s) seleccionado(s) - acceso restringido`}
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Category"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditCategoryModal;
