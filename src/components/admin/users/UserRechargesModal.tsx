import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Recharge {
  id: number;
  amount: number;
  status: string;
  payment_method: string;
  notes: string;
  created_at: string;
  previous_balance: number | null;
}

interface UserRechargesModalProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UserRechargesModal = ({ userId, open, onOpenChange }: UserRechargesModalProps) => {
  const [recharges, setRecharges] = useState<Recharge[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId && open) {
      fetchRecharges();
    }
  }, [userId, open]);

  const fetchRecharges = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("recharges")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRecharges(data || []);
    } catch (error: any) {
      console.error("Error fetching recharges:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Historial de Recargas</DialogTitle>
        </DialogHeader>

        {loading ? (
          <p className="text-center py-8 text-muted-foreground">Cargando recargas...</p>
        ) : recharges.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">No hay recargas</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Balance Anterior</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Balance Nuevo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Notas</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recharges.map((recharge) => (
                <TableRow key={recharge.id}>
                  <TableCell>#{recharge.id}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {recharge.previous_balance !== null ? `$${recharge.previous_balance.toFixed(2)}` : '-'}
                  </TableCell>
                  <TableCell className="font-medium text-green-600">+${recharge.amount.toFixed(2)}</TableCell>
                  <TableCell className="font-semibold">
                    {recharge.previous_balance !== null 
                      ? `$${(recharge.previous_balance + recharge.amount).toFixed(2)}` 
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={recharge.status === 'Completed' ? 'default' : 'secondary'}>
                      {recharge.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{recharge.payment_method || '-'}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{recharge.notes || '-'}</TableCell>
                  <TableCell>{format(new Date(recharge.created_at), "dd/MM/yyyy HH:mm")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UserRechargesModal;
