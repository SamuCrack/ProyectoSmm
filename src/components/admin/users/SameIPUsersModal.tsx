import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface User {
  id: string;
  email: string;
  balance: number;
  enabled: boolean;
  created_at: string;
  last_auth: string;
}

interface SameIPUsersModalProps {
  userIp: string | null;
  currentUserId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SameIPUsersModal = ({ userIp, currentUserId, open, onOpenChange }: SameIPUsersModalProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userIp && currentUserId && open) {
      fetchSameIPUsers();
    }
  }, [userIp, currentUserId, open]);

  const fetchSameIPUsers = async () => {
    if (!userIp || !currentUserId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("last_ip", userIp)
        .neq("id", currentUserId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      console.error("Error fetching users with same IP:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Usuarios con la misma IP ({userIp})</DialogTitle>
        </DialogHeader>

        {loading ? (
          <p className="text-center py-8 text-muted-foreground">Buscando usuarios...</p>
        ) : users.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">No se encontraron otros usuarios con esta IP</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Último Acceso</TableHead>
                <TableHead>Creado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-mono text-xs">#{user.id.slice(0, 8)}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>${user.balance.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={user.enabled ? 'default' : 'destructive'}>
                      {user.enabled ? 'Activo' : 'Suspendido'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.last_auth ? format(new Date(user.last_auth), "dd/MM/yyyy HH:mm") : 'Nunca'}
                  </TableCell>
                  <TableCell>{format(new Date(user.created_at), "dd/MM/yyyy")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SameIPUsersModal;
