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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AddPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  users: Array<{ id: string; email: string | null; balance: number }>;
}

const paymentMethods = [
  "Bonus",
  "Free",
  "PRECIOS DE RECARGAS",
  "Recarga con YAPE - Mínimo 5 soles",
  "Pago con PLIN - Mínimo 3 soles",
  "PayPal Express Checkout",
  "BINANCE (USDT) - Mínimo 1 Dólar",
  "MercadoPago",
  "Zelle Pay",
  "Coinbase Pay Gateway",
];

const AddPaymentModal = ({
  open,
  onOpenChange,
  onSuccess,
  users,
}: AddPaymentModalProps) => {
  const [loading, setLoading] = useState(false);
  const [userSearchOpen, setUserSearchOpen] = useState(false);
  const [formData, setFormData] = useState({
    user_email: "",
    amount: "",
    payment_method: "Bonus",
    memo: "",
  });

  const selectedUser = users.find((u) => u.email === formData.user_email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.user_email || !formData.amount) {
      toast.error("Por favor completa los campos requeridos");
      return;
    }

    const user = users.find((u) => u.email === formData.user_email);
    if (!user) {
      toast.error("Usuario no encontrado");
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Monto inválido");
      return;
    }

    try {
      setLoading(true);

      // Crear el registro de pago
      const { error: rechargeError } = await supabase.from("recharges").insert({
        user_id: user.id,
        amount: amount,
        payment_method: formData.payment_method,
        status: "Completed",
        notes: formData.memo || null,
        previous_balance: user.balance,
      });

      if (rechargeError) throw rechargeError;

      // Actualizar el balance del usuario
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ balance: user.balance + amount })
        .eq("id", user.id);

      if (updateError) throw updateError;

      // Registrar en logs
      await supabase.from("logs").insert({
        user_id: user.id,
        action: "payment_added",
        details: {
          amount: amount,
          method: formData.payment_method,
          memo: formData.memo,
          previous_balance: user.balance,
          new_balance: user.balance + amount,
        },
      });

      toast.success("Pago agregado exitosamente");
      onSuccess();
      onOpenChange(false);
      setFormData({
        user_email: "",
        amount: "",
        payment_method: "Bonus",
        memo: "",
      });
    } catch (error) {
      console.error("Error adding payment:", error);
      toast.error("Error al agregar pago");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add payment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user_email">Username *</Label>
            <Popover open={userSearchOpen} onOpenChange={setUserSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={userSearchOpen}
                  className="w-full justify-between font-normal"
                >
                  {formData.user_email ? (
                    <span className="flex items-center gap-2">
                      {formData.user_email}
                      {selectedUser && (
                        <span className="text-muted-foreground">
                          (${selectedUser.balance.toFixed(2)})
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Seleccionar usuario...</span>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar usuario por email..." />
                  <CommandList>
                    <CommandEmpty>No se encontró usuario.</CommandEmpty>
                    <CommandGroup>
                      {users.map((user) => (
                        <CommandItem
                          key={user.id}
                          value={user.email || ""}
                          onSelect={(value) => {
                            setFormData({ ...formData, user_email: value });
                            setUserSearchOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.user_email === user.email
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          <span className="flex-1">{user.email}</span>
                          <span className="text-muted-foreground text-sm">
                            ${user.balance.toFixed(2)}
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (USD) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_method">Method</Label>
            <Select
              value={formData.payment_method}
              onValueChange={(value) =>
                setFormData({ ...formData, payment_method: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="memo">Memo</Label>
            <Textarea
              id="memo"
              value={formData.memo}
              onChange={(e) =>
                setFormData({ ...formData, memo: e.target.value })
              }
              placeholder="Optional notes..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add payment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddPaymentModal;
