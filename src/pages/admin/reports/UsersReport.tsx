import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, DollarSign, ShoppingCart } from "lucide-react";

interface UserStats {
  user_id: string;
  email: string;
  total_orders: number;
  total_spent: number;
  balance: number;
  enabled: boolean;
  created_at: string;
}

const UsersReport = () => {
  const [userStats, setUserStats] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    total_users: 0,
    active_users: 0,
    total_balance: 0,
    total_spent: 0,
  });

  useEffect(() => {
    fetchUsersData();
  }, []);

  const fetchUsersData = async () => {
    setLoading(true);
    try {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch orders per user
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("user_id, charge_user");

      if (ordersError) throw ordersError;

      // Aggregate orders by user
      const orderMap = new Map<string, { count: number; total: number }>();
      orders?.forEach((order) => {
        const current = orderMap.get(order.user_id) || { count: 0, total: 0 };
        current.count += 1;
        current.total += Number(order.charge_user);
        orderMap.set(order.user_id, current);
      });

      const stats: UserStats[] = profiles?.map((profile) => {
        const orderData = orderMap.get(profile.id) || { count: 0, total: 0 };
        return {
          user_id: profile.id,
          email: profile.email || "N/A",
          total_orders: orderData.count,
          total_spent: orderData.total,
          balance: Number(profile.balance),
          enabled: profile.enabled,
          created_at: profile.created_at || "",
        };
      }) || [];

      setUserStats(stats);

      // Calculate summary
      const totalBalance = stats.reduce((sum, s) => sum + s.balance, 0);
      const totalSpent = stats.reduce((sum, s) => sum + s.total_spent, 0);
      const activeUsers = stats.filter((s) => s.enabled).length;

      setSummary({
        total_users: stats.length,
        active_users: activeUsers,
        total_balance: totalBalance,
        total_spent: totalSpent,
      });
    } catch (error) {
      console.error("Error fetching users data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">Users Report</h2>
          <p className="text-muted-foreground">Estadísticas de usuarios y actividad</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-[100px]" />
              ))}
            </div>
            <Skeleton className="h-[400px] w-full" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-bold text-foreground">{summary.total_users}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <UserPlus className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active Users</p>
                    <p className="text-2xl font-bold text-foreground">{summary.active_users}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <DollarSign className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Balance</p>
                    <p className="text-2xl font-bold text-foreground">${summary.total_balance.toFixed(2)}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-500/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/20 rounded-lg">
                    <ShoppingCart className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Spent</p>
                    <p className="text-2xl font-bold text-foreground">${summary.total_spent.toFixed(2)}</p>
                  </div>
                </div>
              </Card>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Total Spent</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userStats
                  .sort((a, b) => b.total_spent - a.total_spent)
                  .slice(0, 50)
                  .map((stat) => (
                    <TableRow key={stat.user_id}>
                      <TableCell className="font-medium">{stat.email}</TableCell>
                      <TableCell className="text-right">{stat.total_orders}</TableCell>
                      <TableCell className="text-right">${stat.total_spent.toFixed(2)}</TableCell>
                      <TableCell className="text-right">${stat.balance.toFixed(2)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={stat.enabled ? "default" : "secondary"}>
                          {stat.enabled ? "Active" : "Suspended"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(stat.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </>
        )}
      </Card>
    </div>
  );
};

export default UsersReport;
