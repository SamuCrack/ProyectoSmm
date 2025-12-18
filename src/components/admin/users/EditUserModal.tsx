import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface User {
  id: string;
  email: string;
  whatsapp?: string;
  balance: number;
  custom_discount: number;
  enabled: boolean;
}

interface EditUserModalProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const EditUserModal = ({ user, open, onOpenChange, onSuccess }: EditUserModalProps) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [balance, setBalance] = useState(0);
  const [customDiscount, setCustomDiscount] = useState(0);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (user) {
      setEmail(user.email || "");
      setWhatsapp(user.whatsapp || "");
      setBalance(user.balance || 0);
      setCustomDiscount(user.custom_discount || 0);
      setEnabled(user.enabled);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      // Validate email
      if (!email || !email.includes("@")) {
        throw new Error("Email inválido");
      }

      // Validate discount
      if (customDiscount < 0 || customDiscount > 100) {
        throw new Error("El descuento debe estar entre 0 y 100");
      }

      // Validate balance
      if (balance < 0) {
        throw new Error("El balance no puede ser negativo");
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          email,
          whatsapp: whatsapp || null,
          balance,
          custom_discount: customDiscount,
          enabled,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Usuario actualizado exitosamente");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Usuario</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input
              id="whatsapp"
              type="tel"
              placeholder="+51999999999"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="balance">Balance</Label>
            <Input
              id="balance"
              type="number"
              step="0.01"
              value={balance}
              onChange={(e) => setBalance(parseFloat(e.target.value))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="discount">Descuento Personalizado (%)</Label>
            <Input
              id="discount"
              type="number"
              min="0"
              max="100"
              value={customDiscount}
              onChange={(e) => setCustomDiscount(parseFloat(e.target.value))}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="enabled"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
            <Label htmlFor="enabled">Usuario Activo</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserModal;
