import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, History } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import AddPaymentModal from "@/components/admin/payments/AddPaymentModal";
import MobilePaymentCard from "@/components/mobile/MobilePaymentCard";
import UserRechargesModal from "@/components/admin/users/UserRechargesModal";
import { format } from "date-fns";

interface Payment {
  id: number;
  user_id: string;
  amount: number;
  payment_method: string | null;
  status: string;
  transaction_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface UserProfile {
  id: string;
  email: string | null;
  balance: number;
}

const PaymentsManagement = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterMethod, setFilterMethod] = useState<string>("all");
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [historyUserId, setHistoryUserId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [paymentsRes, usersRes] = await Promise.all([
        supabase
          .from("recharges")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase.from("profiles").select("id, email, balance"),
      ]);

      if (paymentsRes.error) throw paymentsRes.error;
      if (usersRes.error) throw usersRes.error;

      setPayments(paymentsRes.data || []);
      setUsers(usersRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getUserEmail = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    return user?.email || "Unknown";
  };

  const getUserBalance = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    return user?.balance || 0;
  };

  const filteredPayments = payments.filter((payment) => {
    const userEmail = getUserEmail(payment.user_id).toLowerCase();
    const matchesSearch =
      userEmail.includes(searchQuery.toLowerCase()) ||
      payment.id.toString().includes(searchQuery) ||
      payment.transaction_id?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === "all" || payment.status === filterStatus;
    const matchesMethod =
      filterMethod === "all" || payment.payment_method === filterMethod;

    return matchesSearch && matchesStatus && matchesMethod;
  });

  const paymentMethods = [
    ...new Set(payments.map((p) => p.payment_method).filter(Boolean)),
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      Completed: "default",
      Pending: "secondary",
      Failed: "destructive",
      Expired: "destructive",
    };

    return (
      <Badge variant={variants[status] || "secondary"}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">Payments</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Gestiona recargas y pagos de usuarios
          </p>
        </div>
        <Button onClick={() => setShowAddPayment(true)} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Add payment
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search by user, ID, or transaction..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Failed">Failed</SelectItem>
              <SelectItem value="Expired">Expired</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterMethod} onValueChange={setFilterMethod}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              {paymentMethods.map((method) => (
                <SelectItem key={method} value={method!}>
                  {method}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="bg-card rounded-lg border border-border p-8 text-center">
          <p className="text-muted-foreground">Cargando pagos...</p>
        </div>
      ) : (
        <>
          {/* Mobile View */}
          <div className="md:hidden space-y-3">
            {filteredPayments.length === 0 ? (
              <div className="bg-card rounded-lg border border-border p-8 text-center">
                <p className="text-muted-foreground">No se encontraron pagos</p>
              </div>
            ) : (
              filteredPayments.map((payment) => (
                <MobilePaymentCard
                  key={payment.id}
                  payment={payment}
                  userEmail={getUserEmail(payment.user_id)}
                  userBalance={getUserBalance(payment.user_id)}
                />
              ))
            )}
          </div>

          {/* Desktop View */}
          <div className="hidden md:block bg-card rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Memo</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="hidden lg:table-cell">Updated</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8">
                        <p className="text-muted-foreground">No se encontraron pagos</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.id}</TableCell>
                        <TableCell className="max-w-[150px] truncate">{getUserEmail(payment.user_id)}</TableCell>
                        <TableCell>${getUserBalance(payment.user_id).toFixed(5)}</TableCell>
                        <TableCell className="font-semibold">
                          ${payment.amount.toFixed(2)}
                        </TableCell>
                        <TableCell>{payment.payment_method || "-"}</TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell className="max-w-[200px] truncate hidden lg:table-cell">
                          {payment.notes || "-"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(payment.created_at), "yyyy-MM-dd HH:mm")}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell whitespace-nowrap">
                          {format(new Date(payment.updated_at), "yyyy-MM-dd HH:mm")}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setHistoryUserId(payment.user_id)}
                            title="Ver historial de recargas"
                          >
                            <History className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}

      <AddPaymentModal
        open={showAddPayment}
        onOpenChange={setShowAddPayment}
        onSuccess={fetchData}
        users={users}
      />

      <UserRechargesModal
        userId={historyUserId}
        open={!!historyUserId}
        onOpenChange={(open) => !open && setHistoryUserId(null)}
      />
    </div>
  );
};

export default PaymentsManagement;
