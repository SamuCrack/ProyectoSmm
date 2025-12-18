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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Download } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

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

const CancelManagement = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [createdFilter, setCreatedFilter] = useState("last_90_days");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch only canceled orders (when client clicked "Cancelar")
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .eq("status", "Canceled")
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from("profiles")
        .select("id, email");

      if (usersError) throw usersError;

      // Fetch services
      const { data: servicesData, error: servicesError } = await supabase
        .from("services")
        .select("id, name, provider_service_id");

      if (servicesError) throw servicesError;

      // Fetch providers
      const { data: providersData, error: providersError } = await supabase
        .from("providers")
        .select("id, name");

      if (providersError) throw providersError;

      setOrders(ordersData || []);
      setUsers(usersData || []);
      setServices(servicesData || []);
      setProviders(providersData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  const getUserEmail = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    return user?.email || "N/A";
  };

  const getServiceName = (serviceId: number) => {
    const service = services.find((s) => s.id === serviceId);
    return service?.name || "N/A";
  };

  const getServiceExternalId = (serviceId: number) => {
    const service = services.find((s) => s.id === serviceId);
    return service?.provider_service_id || null;
  };

  const getProviderName = (providerId: number) => {
    const provider = providers.find((p) => p.id === providerId);
    return provider?.name || "N/A";
  };

  const getStatusBadge = (status: string) => {
    return (
      <Badge variant="destructive">
        {status}
      </Badge>
    );
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      searchQuery === "" ||
      order.id.toString().includes(searchQuery) ||
      getUserEmail(order.user_id).toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.link.toLowerCase().includes(searchQuery.toLowerCase());

    const now = new Date();
    let matchesDateFilter = true;

    if (createdFilter !== "all") {
      const orderDate = new Date(order.created_at);
      switch (createdFilter) {
        case "last_7_days":
          matchesDateFilter = orderDate >= new Date(now.setDate(now.getDate() - 7));
          break;
        case "last_30_days":
          matchesDateFilter = orderDate >= new Date(now.setDate(now.getDate() - 30));
          break;
        case "last_90_days":
          matchesDateFilter = orderDate >= new Date(now.setDate(now.getDate() - 90));
          break;
      }
    }

    return matchesSearch && matchesDateFilter;
  });

  const handleExport = () => {
    // Basic CSV export
    const headers = ["ID", "User", "Charge", "Link", "Service", "Status", "Created", "Mode"];
    const rows = filteredOrders.map((order) => [
      order.id,
      getUserEmail(order.user_id),
      order.charge_user,
      order.link,
      getServiceName(order.service_id),
      order.status,
      format(new Date(order.created_at), "dd/MM/yyyy HH:mm"),
      order.mode || "Auto",
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `canceled_orders_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Cancel Management</h2>
          <p className="text-muted-foreground">
            Historial de órdenes canceladas por los clientes
          </p>
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Exportar
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por ID, usuario o link..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={createdFilter} onValueChange={setCreatedFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las fechas</SelectItem>
            <SelectItem value="last_7_days">Últimos 7 días</SelectItem>
            <SelectItem value="last_30_days">Últimos 30 días</SelectItem>
            <SelectItem value="last_90_days">Últimos 90 días</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <div className="rounded-md border">
        <ScrollArea className="h-[600px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Task ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Order ID</TableHead>
                <TableHead>Link</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Mode</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No se encontraron órdenes canceladas
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{getUserEmail(order.user_id)}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{order.id}</div>
                        {order.external_order_id && (
                          <div className="text-xs text-muted-foreground">
                            {order.external_order_id}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      <a 
                        href={order.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate text-primary hover:underline block"
                      >
                        {order.link}
                      </a>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div>{getServiceName(order.service_id)}</div>
                        <div className="text-xs text-muted-foreground">
                          {getProviderName(order.provider_id)}
                        </div>
                        {getServiceExternalId(order.service_id) && (
                          <div className="text-xs text-muted-foreground">
                            {getServiceExternalId(order.service_id)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>
                      {format(new Date(order.created_at), "dd/MM/yyyy HH:mm")}
                    </TableCell>
                    <TableCell>{order.mode || "Auto"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      {/* Summary */}
      <div className="text-sm text-muted-foreground">
        Mostrando {filteredOrders.length} de {orders.length} órdenes canceladas
      </div>
    </div>
  );
};

export default CancelManagement;
