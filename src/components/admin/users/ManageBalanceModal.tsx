import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ManageBalanceModalProps {
  userId: string | null;
  currentBalance: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const ManageBalanceModal = ({ userId, currentBalance, open, onOpenChange, onSuccess }: ManageBalanceModalProps) => {
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  const handleTransaction = async (type: 'add' | 'subtract') => {
    if (!userId) return;

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Ingresa un monto válido");
      return;
    }

    setLoading(true);

    try {
      const newBalance = type === 'add' 
        ? currentBalance + amountNum 
        : currentBalance - amountNum;

      if (newBalance < 0) {
        throw new Error("El balance no puede ser negativo");
      }

      // Update balance
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ balance: newBalance })
        .eq("id", userId);

      if (updateError) throw updateError;

      // Record in recharges if adding
      if (type === 'add') {
        await supabase.from("recharges").insert({
          user_id: userId,
          amount: amountNum,
          status: 'Completed',
          payment_method: 'Admin',
          notes: notes || 'Agregado por administrador',
        });
      }

      // Log the action
      await supabase.from("logs").insert({
        user_id: userId,
        action: type === 'add' ? 'balance_added' : 'balance_subtracted',
        details: { amount: amountNum, notes },
      });

      toast.success(`Balance ${type === 'add' ? 'agregado' : 'restado'} exitosamente`);
      setAmount("");
      setNotes("");
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
          <DialogTitle>Gestionar Balance</DialogTitle>
          <p className="text-sm text-muted-foreground">Balance actual: ${currentBalance.toFixed(2)}</p>
        </DialogHeader>

        <Tabs defaultValue="add" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="add">Agregar</TabsTrigger>
            <TabsTrigger value="subtract">Restar</TabsTrigger>
          </TabsList>

          <TabsContent value="add" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="add-amount">Monto a Agregar</Label>
              <Input
                id="add-amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-notes">Notas (opcional)</Label>
              <Textarea
                id="add-notes"
                placeholder="Razón del ajuste..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={() => handleTransaction('add')} disabled={loading}>
                {loading ? "Procesando..." : "Agregar Balance"}
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="subtract" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="subtract-amount">Monto a Restar</Label>
              <Input
                id="subtract-amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtract-notes">Notas (opcional)</Label>
              <Textarea
                id="subtract-notes"
                placeholder="Razón del ajuste..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={() => handleTransaction('subtract')} 
                disabled={loading}
                variant="destructive"
              >
                {loading ? "Procesando..." : "Restar Balance"}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ManageBalanceModal;
