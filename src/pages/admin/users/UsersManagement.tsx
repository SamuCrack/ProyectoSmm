import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import UsersTable from "@/components/admin/users/UsersTable";
import CreateUserModal from "@/components/admin/users/CreateUserModal";
import { Download } from "lucide-react";

interface UserData {
  id: string;
  email: string;
  username: string | null;
  whatsapp: string | null;
  balance: number;
  custom_discount: number;
  enabled: boolean;
  created_at: string;
  last_auth?: string;
  last_ip?: string;
  total_spent: number;
}

const UsersManagement = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterUsername, setFilterUsername] = useState("");
  const [filterEmail, setFilterEmail] = useState("");
  const [filterWhatsapp, setFilterWhatsapp] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [totalUsers, setTotalUsers] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sortField, setSortField] = useState("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("profiles")
        .select("*", { count: "exact" });

      // Apply filters
      if (filterUsername) {
        query = query.ilike("username", `%${filterUsername}%`);
      }
      if (filterEmail) {
        query = query.ilike("email", `%${filterEmail}%`);
      }
      if (searchQuery) {
        query = query.or(`email.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`);
      }
      if (filterStatus !== "all") {
        query = query.eq("enabled", filterStatus === "active");
      }

      // Sorting
      query = query.order(sortField, { ascending: sortDirection === "asc" });

      // Pagination
      const from = (currentPage - 1) * perPage;
      const to = from + perPage - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      // Calculate total spent for each user
      const userIds = (data || []).map(u => u.id);
      let spentMap: Record<string, number> = {};
      
      if (userIds.length > 0) {
        const { data: ordersData, error: ordersError } = await supabase
          .from("orders")
          .select("user_id, charge_user")
          .in("user_id", userIds);
        
        if (!ordersError && ordersData) {
          spentMap = ordersData.reduce((acc, order) => {
            acc[order.user_id] = (acc[order.user_id] || 0) + (order.charge_user || 0);
            return acc;
          }, {} as Record<string, number>);
        }
      }

      const usersWithSpent = (data || []).map(user => ({
        ...user,
        total_spent: spentMap[user.id] || 0
      }));

      setUsers(usersWithSpent);
      setTotalUsers(count || 0);
    } catch (error: any) {
      toast.error("Error al cargar usuarios: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Silent fetch - updates data without showing loading state (preserves scroll position)
  const fetchUsersSilent = async () => {
    try {
      let query = supabase
        .from("profiles")
        .select("*", { count: "exact" });

      if (filterUsername) {
        query = query.ilike("username", `%${filterUsername}%`);
      }
      if (filterEmail) {
        query = query.ilike("email", `%${filterEmail}%`);
      }
      if (searchQuery) {
        query = query.or(`email.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`);
      }
      if (filterStatus !== "all") {
        query = query.eq("enabled", filterStatus === "active");
      }

      query = query.order(sortField, { ascending: sortDirection === "asc" });

      const from = (currentPage - 1) * perPage;
      const to = from + perPage - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;

      // Calculate total spent for each user
      const userIds = (data || []).map(u => u.id);
      let spentMap: Record<string, number> = {};
      
      if (userIds.length > 0) {
        const { data: ordersData, error: ordersError } = await supabase
          .from("orders")
          .select("user_id, charge_user")
          .in("user_id", userIds);
        
        if (!ordersError && ordersData) {
          spentMap = ordersData.reduce((acc, order) => {
            acc[order.user_id] = (acc[order.user_id] || 0) + (order.charge_user || 0);
            return acc;
          }, {} as Record<string, number>);
        }
      }

      const usersWithSpent = (data || []).map(user => ({
        ...user,
        total_spent: spentMap[user.id] || 0
      }));

      setUsers(usersWithSpent);
      setTotalUsers(count || 0);
    } catch (error: any) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, perPage, sortField, sortDirection, filterStatus]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchUsers();
  };

  const handleReset = () => {
    setSearchQuery("");
    setFilterUsername("");
    setFilterEmail("");
    setFilterWhatsapp("");
    setFilterStatus("all");
    setCurrentPage(1);
    fetchUsers();
  };

  const handleExport = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .csv();

      if (error) throw error;

      const blob = new Blob([data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `users_export_${new Date().toISOString()}.csv`;
      a.click();
      toast.success("Exportación completada");
    } catch (error: any) {
      toast.error("Error al exportar: " + error.message);
    }
  };

  const totalPages = Math.ceil(totalUsers / perPage);

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center gap-2 bg-card p-4 rounded-lg border border-border">
        <Input
          placeholder="Search (user, email, whatsapp)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-background"
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <Select value="all">
          <SelectTrigger className="w-24 bg-background">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleSearch} className="bg-primary hover:bg-primary/90">
          Search
        </Button>
        <Button onClick={handleReset} variant="outline">
          Reset
        </Button>
        <Button onClick={handleExport} variant="outline" className="bg-[#00CC88] hover:bg-[#00CC88]/90 text-white border-[#00CC88]">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Filters Row */}
      <div className="flex items-center gap-2 bg-card p-4 rounded-lg border border-border">
        <Input
          placeholder="Usuario"
          value={filterUsername}
          onChange={(e) => setFilterUsername(e.target.value)}
          className="w-48 bg-background"
        />
        <Input
          placeholder="Email"
          value={filterEmail}
          onChange={(e) => setFilterEmail(e.target.value)}
          className="w-48 bg-background"
        />
        <Input
          placeholder="WhatsApp (solo dígitos o +)"
          value={filterWhatsapp}
          onChange={(e) => setFilterWhatsapp(e.target.value)}
          className="w-64 bg-background"
        />
        <Input
          placeholder="0"
          className="w-20 bg-background"
        />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-32 bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Activo</SelectItem>
            <SelectItem value="suspended">Suspendido</SelectItem>
          </SelectContent>
        </Select>
        <Input
          placeholder="Pass (opc.)"
          className="w-32 bg-background"
        />
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="bg-primary hover:bg-primary/90"
        >
          Crear
        </Button>
      </div>

      {/* Users Table */}
      <UsersTable
        users={users}
        loading={loading}
        onRefresh={fetchUsers}
        onRefreshSilent={fetchUsersSilent}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={(field) => {
          if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
          } else {
            setSortField(field);
            setSortDirection("desc");
          }
        }}
      />

      {/* Pagination */}
      <div className="flex items-center justify-between bg-card p-4 rounded-lg border border-border">
        <div className="text-sm text-muted-foreground">
          Mostrando página {currentPage} de {totalPages} ({totalUsers} usuarios) ·{" "}
          <button className="text-primary hover:underline">Mostrar totals</button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {perPage} / page
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            -
          </Button>
          <span className="px-3 py-1 bg-primary text-primary-foreground rounded">
            {currentPage}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            +
          </Button>
        </div>
      </div>

      {/* Modals */}
      <CreateUserModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchUsersSilent}
      />
    </div>
  );
};

export default UsersManagement;
