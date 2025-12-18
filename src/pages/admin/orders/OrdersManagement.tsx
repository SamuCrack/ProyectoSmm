import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { ChevronDown, Search, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import MobileAdminOrderCard from "@/components/mobile/MobileAdminOrderCard";

interface Order {
  id: number;
  user_id: string;
  service_id: number;
  provider_id: number;
  link: string;
  quantity: number;
  charge_user: number;
  cost_provider: number | null;
  status: string;
  start_count: number | null;
  remains: number | null;
  mode: string | null;
  created_at: string;
  external_order_id: number | null;
  refunded: boolean;
  refund_amount: number | null;
  cancel_requested_at: string | null;
  fail_reason: string | null;
}

interface UserProfile {
  id: string;
  email: string | null;
}

interface Service {
  id: number;
  name: string;
  provider_service_id: string | null;
}

interface Provider {
  id: number;
  name: string;
}

const OrdersManagement = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createdFilter, setCreatedFilter] = useState("last_90_days");

  // Modal states
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [changeStatusModalOpen, setChangeStatusModalOpen] = useState(false);
  const [startCountModalOpen, setStartCountModalOpen] = useState(false);
  const [partialModalOpen, setPartialModalOpen] = useState(false);
  const [cancelRefundDialogOpen, setCancelRefundDialogOpen] = useState(false);

  // Form states
  const [newStatus, setNewStatus] = useState("");
  const [newStartCount, setNewStartCount] = useState("");
  const [newRemains, setNewRemains] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      const { data: usersData, error: usersError } = await supabase
        .from("profiles")
        .select("id, email");

      if (usersError) throw usersError;

      const { data: servicesData, error: servicesError } = await supabase
        .from("services")
        .select("id, name, provider_service_id");

      if (servicesError) throw servicesError;

      const { data: providersData, error: providersError } = await supabase
        .from("providers")
        .select("id, name");

      if (providersError) throw providersError;

      setOrders(ordersData || []);
      setUsers(usersData || []);
      setServices(servicesData || []);
      setProviders(providersData || []);
    } catch (error: any) {
      toast.error("Error al cargar órdenes: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Silent fetch - updates data without showing loading state (preserves scroll position)
  const fetchDataSilent = async () => {
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      const { data: usersData, error: usersError } = await supabase
        .from("profiles")
        .select("id, email");

      if (usersError) throw usersError;

      const { data: servicesData, error: servicesError } = await supabase
        .from("services")
        .select("id, name, provider_service_id");

      if (servicesError) throw servicesError;

      const { data: providersData, error: providersError } = await supabase
        .from("providers")
        .select("id, name");

      if (providersError) throw providersError;

      setOrders(ordersData || []);
      setUsers(usersData || []);
      setServices(servicesData || []);
      setProviders(providersData || []);
    } catch (error: any) {
      console.error("Error fetching data:", error);
    }
  };

  const getUserEmail = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    return user?.email || userId;
  };

  const getServiceName = (serviceId: number) => {
    const service = services.find((s) => s.id === serviceId);
    return service?.name || `Service #${serviceId}`;
  };

  const getServiceProviderServiceId = (serviceId: number) => {
    const service = services.find((s) => s.id === serviceId);
    return service?.provider_service_id || null;
  };

  const getProviderName = (providerId: number) => {
    const provider = providers.find((p) => p.id === providerId);
    return provider?.name || null;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      Pending: { label: "Pending", className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
      "In progress": { label: "In progress", className: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
      Completed: { label: "Completed", className: "bg-green-500/10 text-green-500 border-green-500/20" },
      Partial: { label: "Partial", className: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
      Processing: { label: "Processing", className: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20" },
      Canceled: { label: "Canceled", className: "bg-red-500/10 text-red-500 border-red-500/20" },
      Fail: { label: "Fail", className: "bg-red-600/10 text-red-600 border-red-600/20" },
      Error: { label: "Error", className: "bg-red-700/10 text-red-700 border-red-700/20" },
    };

    const config = statusConfig[status] || { label: status, className: "bg-muted text-muted-foreground" };
    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const filteredOrders = orders.filter((order) => {
    if (statusFilter !== "all" && order.status !== statusFilter) {
      return false;
    }

    if (searchQuery) {
      const userEmail = getUserEmail(order.user_id).toLowerCase();
      const serviceName = getServiceName(order.service_id).toLowerCase();
      const link = order.link.toLowerCase();
      const id = order.id.toString();
      const query = searchQuery.toLowerCase();

      if (
        !userEmail.includes(query) &&
        !serviceName.includes(query) &&
        !link.includes(query) &&
        !id.includes(query)
      ) {
        return false;
      }
    }

    if (createdFilter !== "all") {
      const orderDate = new Date(order.created_at);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));

      if (createdFilter === "last_90_days" && daysDiff > 90) return false;
      if (createdFilter === "last_30_days" && daysDiff > 30) return false;
      if (createdFilter === "last_7_days" && daysDiff > 7) return false;
    }

    return true;
  });

  const handleExport = () => {
    toast.info("Función de exportación en desarrollo");
  };

  // Action handlers
  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setDetailsModalOpen(true);
  };

  const handleRequestCancel = async (order: Order) => {
    if (!order.external_order_id) {
      toast.error("Esta orden no tiene ID externo de proveedor");
      return;
    }
    
    setIsProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No autenticado");

      const { data, error } = await supabase.functions.invoke("provider-cancel-order", {
        body: { provider_id: order.provider_id, order_id: order.id },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success("Cancelación solicitada al proveedor");
        fetchDataSilent();
      } else {
        toast.error(data?.error || "Error al solicitar cancelación");
      }
    } catch (error: any) {
      toast.error("Error: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSetStartCount = (order: Order) => {
    setSelectedOrder(order);
    setNewStartCount(order.start_count?.toString() || "");
    setStartCountModalOpen(true);
  };

  const handleSetPartial = (order: Order) => {
    setSelectedOrder(order);
    setNewRemains(order.remains?.toString() || "");
    setPartialModalOpen(true);
  };

  const handleChangeStatus = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setChangeStatusModalOpen(true);
  };

  const handleCancelAndRefund = (order: Order) => {
    if (order.refunded) {
      toast.error("Esta orden ya fue reembolsada");
      return;
    }
    setSelectedOrder(order);
    setCancelRefundDialogOpen(true);
  };

  // Submit handlers
  const submitStartCount = async () => {
    if (!selectedOrder) return;
    setIsProcessing(true);
    try {
      const startCount = parseInt(newStartCount);
      if (isNaN(startCount)) throw new Error("Valor inválido");

      const { error } = await supabase
        .from("orders")
        .update({ start_count: startCount })
        .eq("id", selectedOrder.id);

      if (error) throw error;

      toast.success("Start count actualizado");
      setStartCountModalOpen(false);
      fetchDataSilent();
    } catch (error: any) {
      toast.error("Error: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const submitPartial = async () => {
    if (!selectedOrder) return;
    setIsProcessing(true);
    try {
      const remains = parseInt(newRemains);
      if (isNaN(remains) || remains < 0) throw new Error("Valor inválido");

      const { error } = await supabase
        .from("orders")
        .update({ status: "Partial", remains: remains })
        .eq("id", selectedOrder.id);

      if (error) throw error;

      toast.success("Orden marcada como Partial");
      setPartialModalOpen(false);
      fetchDataSilent();
    } catch (error: any) {
      toast.error("Error: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const submitChangeStatus = async () => {
    if (!selectedOrder || !newStatus) return;
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", selectedOrder.id);

      if (error) throw error;

      toast.success("Estado actualizado");
      setChangeStatusModalOpen(false);
      fetchDataSilent();
    } catch (error: any) {
      toast.error("Error: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const submitCancelAndRefund = async () => {
    if (!selectedOrder) return;
    setIsProcessing(true);
    try {
      // Update order to Canceled and mark as refunded
      const { error: orderError } = await supabase
        .from("orders")
        .update({
          status: "Canceled",
          refunded: true,
          refund_amount: selectedOrder.charge_user,
        })
        .eq("id", selectedOrder.id);

      if (orderError) throw orderError;

      // Get current user balance
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("balance")
        .eq("id", selectedOrder.user_id)
        .single();

      if (profileError) throw profileError;

      // Update user balance
      const newBalance = (profile?.balance || 0) + selectedOrder.charge_user;
      const { error: balanceError } = await supabase
        .from("profiles")
        .update({ balance: newBalance })
        .eq("id", selectedOrder.user_id);

      if (balanceError) throw balanceError;

      toast.success(`Orden cancelada y $${selectedOrder.charge_user.toFixed(5)} reembolsado`);
      setCancelRefundDialogOpen(false);
      fetchDataSilent();
    } catch (error: any) {
      toast.error("Error: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-xl md:text-2xl font-bold text-foreground">Orders Management</h1>
        <Button onClick={handleExport} variant="outline" className="gap-2 w-full sm:w-auto">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col gap-3 p-4 bg-card rounded-lg border border-border">
        {/* Status Filters - Horizontal scroll on mobile */}
        <div className="overflow-x-auto pb-2 -mx-1 px-1">
          <div className="flex items-center gap-2 min-w-max">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("all")}
            >
              All
            </Button>
            <Button
              variant={statusFilter === "Pending" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("Pending")}
            >
              Pending
            </Button>
            <Button
              variant={statusFilter === "In progress" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("In progress")}
            >
              In progress
            </Button>
            <Button
              variant={statusFilter === "Completed" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("Completed")}
            >
              Completed
            </Button>
            <Button
              variant={statusFilter === "Partial" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("Partial")}
            >
              Partial
            </Button>
            <Button
              variant={statusFilter === "Canceled" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("Canceled")}
            >
              Canceled
            </Button>
            <Button
              variant={statusFilter === "Processing" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("Processing")}
            >
              Processing
            </Button>
            <Button
              variant={statusFilter === "Fail" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("Fail")}
            >
              Fail
            </Button>
            <Button
              variant={statusFilter === "Error" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("Error")}
            >
              Error
            </Button>
          </div>
        </div>

        {/* Search and Date Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={createdFilter} onValueChange={setCreatedFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="last_7_days">Last 7 days</SelectItem>
              <SelectItem value="last_30_days">Last 30 days</SelectItem>
              <SelectItem value="last_90_days">Last 90 days</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {(statusFilter !== "all" || searchQuery || createdFilter !== "last_90_days") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatusFilter("all");
                setSearchQuery("");
                setCreatedFilter("last_90_days");
              }}
              className="whitespace-nowrap"
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* Mobile View */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Cargando órdenes...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No se encontraron órdenes</div>
        ) : (
          filteredOrders.map((order) => (
            <MobileAdminOrderCard
              key={order.id}
              order={order}
              userEmail={getUserEmail(order.user_id)}
              serviceName={getServiceName(order.service_id)}
              providerName={getProviderName(order.provider_id)}
              getStatusBadge={getStatusBadge}
              onViewDetails={() => handleViewDetails(order)}
              onRequestCancel={() => handleRequestCancel(order)}
              onSetStartCount={() => handleSetStartCount(order)}
              onSetPartial={() => handleSetPartial(order)}
              onChangeStatus={() => handleChangeStatus(order)}
              onCancelAndRefund={() => handleCancelAndRefund(order)}
              isProcessing={isProcessing}
            />
          ))
        )}
      </div>

      {/* Desktop Orders Table */}
      <div className="hidden md:block border border-border rounded-lg bg-card">
        <ScrollArea className="h-[calc(100vh-380px)]">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Cargando órdenes...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No se encontraron órdenes</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Charge</TableHead>
                  <TableHead>Link</TableHead>
                  <TableHead>Start count</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Remains</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>#{order.id}</span>
                        {order.external_order_id && (
                          <span className="text-xs text-muted-foreground">
                            {order.external_order_id}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate">
                      {getUserEmail(order.user_id)}
                    </TableCell>
                    <TableCell>${order.charge_user.toFixed(5)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      <a
                        href={order.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {order.link}
                      </a>
                    </TableCell>
                    <TableCell>{order.start_count || "-"}</TableCell>
                    <TableCell>{order.quantity}</TableCell>
                    <TableCell className="max-w-[200px]">
                      <div className="flex flex-col">
                        <span className="truncate">{getServiceName(order.service_id)}</span>
                        <div className="flex flex-col text-xs text-muted-foreground">
                          {getProviderName(order.provider_id) && (
                            <span className="truncate">{getProviderName(order.provider_id)}</span>
                          )}
                          {getServiceProviderServiceId(order.service_id) && (
                            <span className="truncate">ID: {getServiceProviderServiceId(order.service_id)}</span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {getStatusBadge(order.status)}
                        {order.refunded && (
                          <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20 text-xs">
                            Refunded
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{order.remains !== null ? order.remains : "-"}</TableCell>
                    <TableCell>
                      {format(new Date(order.created_at), "yyyy-MM-dd HH:mm")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{order.mode || "Auto"}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <span className="sr-only">Actions</span>
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover">
                          <DropdownMenuItem onClick={() => handleViewDetails(order)}>
                            Details
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleRequestCancel(order)}
                            disabled={!order.external_order_id || isProcessing}
                          >
                            Request cancel
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSetStartCount(order)}>
                            Set start count
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSetPartial(order)}>
                            Set partial
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleChangeStatus(order)}>
                            Change status
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleCancelAndRefund(order)}
                            className="text-destructive"
                            disabled={order.refunded}
                          >
                            Cancel and refund
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-sm text-muted-foreground px-4">
        <span>
          Mostrando {filteredOrders.length} de {orders.length} órdenes
        </span>
      </div>

      {/* Details Modal */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details #{selectedOrder?.id}</DialogTitle>
            <DialogDescription>Información completa de la orden</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>ID:</strong> #{selectedOrder.id}</div>
              <div><strong>External ID:</strong> {selectedOrder.external_order_id || "-"}</div>
              <div><strong>User:</strong> {getUserEmail(selectedOrder.user_id)}</div>
              <div><strong>Service:</strong> {getServiceName(selectedOrder.service_id)}</div>
              <div><strong>Provider:</strong> {getProviderName(selectedOrder.provider_id) || "-"}</div>
              <div><strong>Provider Service ID:</strong> {getServiceProviderServiceId(selectedOrder.service_id) || "-"}</div>
              <div className="col-span-2"><strong>Link:</strong> <a href={selectedOrder.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">{selectedOrder.link}</a></div>
              <div><strong>Quantity:</strong> {selectedOrder.quantity}</div>
              <div><strong>Start Count:</strong> {selectedOrder.start_count || "-"}</div>
              <div><strong>Remains:</strong> {selectedOrder.remains ?? "-"}</div>
              <div><strong>Mode:</strong> {selectedOrder.mode || "Auto"}</div>
              <div><strong>Charge User:</strong> ${selectedOrder.charge_user.toFixed(5)}</div>
              <div><strong>Cost Provider:</strong> ${selectedOrder.cost_provider?.toFixed(5) || "-"}</div>
              <div><strong>Status:</strong> {selectedOrder.status}</div>
              <div><strong>Refunded:</strong> {selectedOrder.refunded ? `Yes ($${selectedOrder.refund_amount?.toFixed(5) || "0"})` : "No"}</div>
              <div><strong>Created:</strong> {format(new Date(selectedOrder.created_at), "yyyy-MM-dd HH:mm:ss")}</div>
              <div><strong>Cancel Requested:</strong> {selectedOrder.cancel_requested_at ? format(new Date(selectedOrder.cancel_requested_at), "yyyy-MM-dd HH:mm") : "-"}</div>
              {selectedOrder.fail_reason && (
                <div className="col-span-2"><strong>Fail Reason:</strong> {selectedOrder.fail_reason}</div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Change Status Modal */}
      <Dialog open={changeStatusModalOpen} onOpenChange={setChangeStatusModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Status</DialogTitle>
            <DialogDescription>Cambiar el estado de la orden #{selectedOrder?.id}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="In progress">In progress</SelectItem>
                  <SelectItem value="Processing">Processing</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Partial">Partial</SelectItem>
                  <SelectItem value="Canceled">Canceled</SelectItem>
                  <SelectItem value="Fail">Fail</SelectItem>
                  <SelectItem value="Error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangeStatusModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitChangeStatus} disabled={isProcessing}>
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Set Start Count Modal */}
      <Dialog open={startCountModalOpen} onOpenChange={setStartCountModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Start Count</DialogTitle>
            <DialogDescription>Establecer el conteo inicial de la orden #{selectedOrder?.id}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Start Count</Label>
              <Input
                type="number"
                value={newStartCount}
                onChange={(e) => setNewStartCount(e.target.value)}
                placeholder="Ingrese el conteo inicial"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStartCountModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitStartCount} disabled={isProcessing}>
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Set Partial Modal */}
      <Dialog open={partialModalOpen} onOpenChange={setPartialModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Partial</DialogTitle>
            <DialogDescription>Marcar orden #{selectedOrder?.id} como Partial y establecer cantidad restante</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Remains (cantidad restante)</Label>
              <Input
                type="number"
                value={newRemains}
                onChange={(e) => setNewRemains(e.target.value)}
                placeholder="Ingrese la cantidad restante"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPartialModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitPartial} disabled={isProcessing}>
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel and Refund Confirmation Dialog */}
      <AlertDialog open={cancelRefundDialogOpen} onOpenChange={setCancelRefundDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar y reembolsar orden?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción cancelará la orden #{selectedOrder?.id} y reembolsará ${selectedOrder?.charge_user.toFixed(5)} al usuario {selectedOrder ? getUserEmail(selectedOrder.user_id) : ""}.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={submitCancelAndRefund} 
              disabled={isProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OrdersManagement;
