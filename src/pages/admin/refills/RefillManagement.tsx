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
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, Search } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Refill {
  id: number;
  order_id: number;
  user_id: string;
  provider_id: number;
  service_id: number;
  external_refill_id: string | null;
  status: string;
  link: string;
  quantity: number;
  start_count: number | null;
  current_count: number | null;
  created_at: string;
}

interface UserProfile {
  id: string;
  email: string | null;
}

interface Service {
  id: number;
  name: string;
}

interface Provider {
  id: number;
  name: string;
}

const RefillManagement = () => {
  const [refills, setRefills] = useState<Refill[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch refills
      const { data: refillsData, error: refillsError } = await supabase
        .from("refills")
        .select("*")
        .order("created_at", { ascending: false });

      if (refillsError) throw refillsError;

      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from("profiles")
        .select("id, email");

      if (usersError) throw usersError;

      // Fetch services
      const { data: servicesData, error: servicesError } = await supabase
        .from("services")
        .select("id, name");

      if (servicesError) throw servicesError;

      // Fetch providers
      const { data: providersData, error: providersError } = await supabase
        .from("providers")
        .select("id, name");

      if (providersError) throw providersError;

      setRefills(refillsData || []);
      setUsers(usersData || []);
      setServices(servicesData || []);
      setProviders(providersData || []);
    } catch (error: any) {
      toast.error("Error al cargar refills: " + error.message);
    } finally {
      setLoading(false);
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

  const getProviderName = (providerId: number) => {
    const provider = providers.find((p) => p.id === providerId);
    return provider?.name || `Provider #${providerId}`;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      Pending: { label: "Pending", className: "bg-yellow-500/20 text-yellow-500" },
      Awaiting: { label: "Awaiting", className: "bg-blue-500/20 text-blue-500" },
      Rejected: { label: "Rejected", className: "bg-red-500/20 text-red-500" },
      "In progress": { label: "In progress", className: "bg-purple-500/20 text-purple-500" },
      Completed: { label: "Completed", className: "bg-green-500/20 text-green-500" },
    };

    const config = statusConfig[status] || {
      label: status,
      className: "bg-muted text-muted-foreground",
    };

    return (
      <Badge className={config.className} variant="secondary">
        {config.label}
      </Badge>
    );
  };

  const filteredRefills = refills.filter((refill) => {
    const matchesStatus = statusFilter === "all" || refill.status === statusFilter;
    const matchesSearch =
      searchQuery === "" ||
      refill.id.toString().includes(searchQuery) ||
      refill.order_id.toString().includes(searchQuery) ||
      getUserEmail(refill.user_id).toLowerCase().includes(searchQuery.toLowerCase()) ||
      getServiceName(refill.service_id).toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Refills Management</h2>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex gap-2">
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
            variant={statusFilter === "Awaiting" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("Awaiting")}
          >
            Awaiting
          </Button>
          <Button
            variant={statusFilter === "Rejected" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("Rejected")}
          >
            Rejected
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
        </div>

        <div className="flex-1 flex items-center gap-2 ml-auto max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <span className="text-sm text-muted-foreground whitespace-nowrap">Refill ID</span>
        </div>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg bg-card">
        <ScrollArea className="h-[600px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Order ID</TableHead>
                <TableHead>Link</TableHead>
                <TableHead>Start count</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Current count</TableHead>
                <TableHead>To refill</TableHead>
                <TableHead>Services</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={13} className="text-center py-8">
                    Cargando refills...
                  </TableCell>
                </TableRow>
              ) : filteredRefills.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={13} className="text-center py-8 text-muted-foreground">
                    No hay refills disponibles
                  </TableCell>
                </TableRow>
              ) : (
                filteredRefills.map((refill) => (
                  <TableRow key={refill.id}>
                    <TableCell className="font-medium">{refill.id}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">{getUserEmail(refill.user_id)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{refill.order_id}</span>
                        {refill.external_refill_id && (
                          <span className="text-xs text-muted-foreground">
                            {refill.external_refill_id}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <a 
                        href={refill.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate text-primary hover:underline block"
                      >
                        {refill.link}
                      </a>
                    </TableCell>
                    <TableCell>{refill.start_count || "-"}</TableCell>
                    <TableCell>{refill.quantity}</TableCell>
                    <TableCell>{refill.current_count || "-"}</TableCell>
                    <TableCell>
                      {refill.start_count && refill.current_count
                        ? refill.quantity - (refill.current_count - refill.start_count)
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">{getServiceName(refill.service_id)}</span>
                        <span className="text-xs text-muted-foreground">
                          {getProviderName(refill.provider_id)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(refill.status)}</TableCell>
                    <TableCell>
                      {format(new Date(refill.created_at), "yyyy-MM-dd HH:mm")}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">Auto</span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            Actions
                            <ChevronDown className="ml-2 h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View details</DropdownMenuItem>
                          <DropdownMenuItem>Update status</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      {/* Summary */}
      <div className="text-sm text-muted-foreground">
        Mostrando {filteredRefills.length} de {refills.length} refills
      </div>
    </div>
  );
};

export default RefillManagement;
