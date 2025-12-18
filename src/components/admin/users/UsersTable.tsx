import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ChevronDown, ChevronUp, Pencil, Key, Ban, Wallet, ShoppingCart, CreditCard, History, Users, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import CustomRatesModal from "./CustomRatesModal";
import EditUserModal from "./EditUserModal";
import ChangePasswordModal from "./ChangePasswordModal";
import ManageBalanceModal from "./ManageBalanceModal";
import UserOrdersModal from "./UserOrdersModal";
import UserRechargesModal from "./UserRechargesModal";
import UserLoginHistoryModal from "./UserLoginHistoryModal";
import SameIPUsersModal from "./SameIPUsersModal";
import MobileUserCard from "@/components/mobile/MobileUserCard";
import { format } from "date-fns";

interface User {
  id: string;
  email: string;
  username?: string;
  whatsapp?: string;
  balance: number;
  custom_discount: number;
  enabled: boolean;
  created_at: string;
  last_auth?: string;
  last_ip?: string;
}

interface UsersTableProps {
  users: User[];
  loading: boolean;
  onRefresh: () => void;
  onRefreshSilent: () => void;
  sortField: string;
  sortDirection: "asc" | "desc";
  onSort: (field: string) => void;
}

const UsersTable = ({ users, loading, onRefresh, onRefreshSilent, sortField, sortDirection, onSort }: UsersTableProps) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showCustomRates, setShowCustomRates] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showManageBalance, setShowManageBalance] = useState(false);
  const [showOrders, setShowOrders] = useState(false);
  const [showRecharges, setShowRecharges] = useState(false);
  const [showLoginHistory, setShowLoginHistory] = useState(false);
  const [showSameIP, setShowSameIP] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ enabled: !currentStatus })
        .eq("id", userId);

      if (error) throw error;

      toast.success(currentStatus ? "Usuario suspendido" : "Usuario activado");
      onRefreshSilent();
    } catch (error: any) {
      toast.error("Error: " + error.message);
    }
  };

  const handleBanByIP = async (user: User) => {
    setActionLoading(true);
    try {
      const { error } = await supabase.functions.invoke('admin-ban-user-ip', {
        body: { userId: user.id }
      });

      if (error) throw error;

      toast.success("Usuario baneado por IP exitosamente");
      onRefreshSilent();
    } catch (error: any) {
      toast.error("Error: " + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    setActionLoading(true);
    try {
      const { error } = await supabase.functions.invoke('admin-delete-user', {
        body: { userId: selectedUser.id }
      });

      if (error) throw error;

      toast.success("Usuario eliminado exitosamente");
      setShowDeleteConfirm(false);
      onRefreshSilent();
    } catch (error: any) {
      toast.error("Error: " + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="h-4 w-4 inline ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 inline ml-1" />
    );
  };

  if (loading) {
    return (
      <div className="bg-card rounded-lg border border-border p-8 text-center">
        <p className="text-muted-foreground">Cargando usuarios...</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile View */}
      <div className="md:hidden space-y-3">
        {users.length === 0 ? (
          <div className="bg-card rounded-lg border border-border p-8 text-center">
            <p className="text-muted-foreground">No se encontraron usuarios</p>
          </div>
        ) : (
          users.map((user) => (
            <MobileUserCard
              key={user.id}
              user={user}
              onEdit={() => {
                setSelectedUser(user);
                setShowEditUser(true);
              }}
              onChangePassword={() => {
                setSelectedUser(user);
                setShowChangePassword(true);
              }}
              onBanIP={() => handleBanByIP(user)}
              onManageBalance={() => {
                setSelectedUser(user);
                setShowManageBalance(true);
              }}
              onViewOrders={() => {
                setSelectedUser(user);
                setShowOrders(true);
              }}
              onViewRecharges={() => {
                setSelectedUser(user);
                setShowRecharges(true);
              }}
              onViewLoginHistory={() => {
                setSelectedUser(user);
                setShowLoginHistory(true);
              }}
              onViewSameIP={() => {
                setSelectedUser(user);
                setShowSameIP(true);
              }}
              onToggleStatus={() => toggleUserStatus(user.id, user.enabled)}
              onDelete={() => {
                setSelectedUser(user);
                setShowDeleteConfirm(true);
              }}
              onCustomRates={() => {
                setSelectedUser(user);
                setShowCustomRates(true);
              }}
              actionLoading={actionLoading}
            />
          ))
        )}
      </div>

      {/* Desktop View */}
      <div className="hidden md:block bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="cursor-pointer whitespace-nowrap" onClick={() => onSort("id")}>
                  ID <SortIcon field="id" />
                </TableHead>
                <TableHead className="whitespace-nowrap">Username</TableHead>
                <TableHead className="cursor-pointer whitespace-nowrap" onClick={() => onSort("email")}>
                  Email <SortIcon field="email" />
                </TableHead>
                <TableHead className="whitespace-nowrap hidden lg:table-cell">WhatsApp</TableHead>
                <TableHead className="cursor-pointer whitespace-nowrap" onClick={() => onSort("balance")}>
                  Balance <SortIcon field="balance" />
                </TableHead>
                <TableHead className="whitespace-nowrap hidden xl:table-cell">Spent</TableHead>
                <TableHead className="whitespace-nowrap">Status</TableHead>
                <TableHead className="cursor-pointer whitespace-nowrap hidden lg:table-cell" onClick={() => onSort("created_at")}>
                  Created <SortIcon field="created_at" />
                </TableHead>
                <TableHead className="whitespace-nowrap hidden xl:table-cell">Last auth</TableHead>
                <TableHead className="whitespace-nowrap hidden lg:table-cell">Discount</TableHead>
                <TableHead className="whitespace-nowrap">Rates</TableHead>
                <TableHead className="whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                    No se encontraron usuarios
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">#{user.id.slice(0, 8)}</TableCell>
                    <TableCell>{user.username || "-"}</TableCell>
                    <TableCell>
                      <a href={`mailto:${user.email}`} className="text-primary hover:underline">
                        {user.email}
                      </a>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {user.whatsapp || '-'}
                    </TableCell>
                    <TableCell>${user.balance.toFixed(5)}</TableCell>
                    <TableCell className="hidden xl:table-cell">$0.00</TableCell>
                    <TableCell>
                      <Badge 
                        variant={user.enabled ? "default" : "destructive"}
                        className={user.enabled ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"}
                      >
                        {user.enabled ? "Active" : "Suspended"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden lg:table-cell">
                      {format(new Date(user.created_at), "yyyy-MM-dd HH:mm:ss")}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden xl:table-cell">
                      {user.last_auth ? format(new Date(user.last_auth), "dd/MM/yyyy HH:mm") : "Nunca"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge variant="secondary">
                        {user.custom_discount || 0}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="link"
                        size="sm"
                        className="text-primary h-auto p-0"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowCustomRates(true);
                        }}
                      >
                        Set custom rates
                      </Button>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            Actions
                            <ChevronDown className="ml-1 h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem onClick={() => {
                            setSelectedUser(user);
                            setShowEditUser(true);
                          }}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit user
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem onClick={() => {
                            setSelectedUser(user);
                            setShowChangePassword(true);
                          }}>
                            <Key className="mr-2 h-4 w-4" />
                            Change password
                          </DropdownMenuItem>

                          <DropdownMenuItem 
                            onClick={() => handleBanByIP(user)}
                            disabled={actionLoading}
                          >
                            <Ban className="mr-2 h-4 w-4" />
                            Ban by IP
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem onClick={() => {
                            setSelectedUser(user);
                            setShowManageBalance(true);
                          }}>
                            <Wallet className="mr-2 h-4 w-4" />
                            Add/Subtract balance
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem onClick={() => {
                            setSelectedUser(user);
                            setShowOrders(true);
                          }}>
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            See orders
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => {
                            setSelectedUser(user);
                            setShowRecharges(true);
                          }}>
                            <CreditCard className="mr-2 h-4 w-4" />
                            See refill
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem onClick={() => {
                            setSelectedUser(user);
                            setShowLoginHistory(true);
                          }}>
                            <History className="mr-2 h-4 w-4" />
                            View login history
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => {
                            setSelectedUser(user);
                            setShowSameIP(true);
                          }}>
                            <Users className="mr-2 h-4 w-4" />
                            View users with same IP
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={() => toggleUserStatus(user.id, user.enabled)}
                          >
                            {user.enabled ? "Suspend user" : "Activate user"}
                          </DropdownMenuItem>

                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedUser(user);
                              setShowDeleteConfirm(true);
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete user
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {selectedUser && (
        <>
          <CustomRatesModal
            open={showCustomRates}
            onClose={() => {
              setShowCustomRates(false);
              setSelectedUser(null);
            }}
            user={selectedUser}
            onSuccess={onRefreshSilent}
          />
          
          <EditUserModal
            user={selectedUser}
            open={showEditUser}
            onOpenChange={setShowEditUser}
            onSuccess={onRefreshSilent}
          />

          <ChangePasswordModal
            userId={selectedUser.id}
            open={showChangePassword}
            onOpenChange={setShowChangePassword}
          />

          <ManageBalanceModal
            userId={selectedUser.id}
            currentBalance={selectedUser.balance}
            open={showManageBalance}
            onOpenChange={setShowManageBalance}
            onSuccess={onRefreshSilent}
          />

          <UserOrdersModal
            userId={selectedUser.id}
            open={showOrders}
            onOpenChange={setShowOrders}
          />

          <UserRechargesModal
            userId={selectedUser.id}
            open={showRecharges}
            onOpenChange={setShowRecharges}
          />

          <UserLoginHistoryModal
            userId={selectedUser.id}
            open={showLoginHistory}
            onOpenChange={setShowLoginHistory}
          />

          <SameIPUsersModal
            userIp={selectedUser.last_ip || null}
            currentUserId={selectedUser.id}
            open={showSameIP}
            onOpenChange={setShowSameIP}
          />
        </>
      )}

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="max-w-[95vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente al usuario{" "}
              <span className="font-semibold">{selectedUser?.email}</span> y todos sus datos relacionados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteUser}
              disabled={actionLoading}
              className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading ? "Eliminando..." : "Eliminar Usuario"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default UsersTable;
