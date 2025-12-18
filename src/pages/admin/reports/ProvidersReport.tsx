import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface ProviderStats {
  provider_id: number;
  provider_name: string;
  total_orders: number;
  total_cost: number;
  total_revenue: number;
  profit: number;
  enabled: boolean;
  balance: number;
}

const ProvidersReport = () => {
  const [providerStats, setProviderStats] = useState<ProviderStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProvidersData();
  }, []);

  const fetchProvidersData = async () => {
    setLoading(true);
    try {
      const { data: providers, error: providersError } = await supabase
        .from("providers")
        .select("*");

      if (providersError) throw providersError;

      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("provider_id, charge_user, cost_provider");

      if (ordersError) throw ordersError;

      // Aggregate by provider
      const statsMap = new Map<number, ProviderStats>();

      providers?.forEach((provider) => {
        statsMap.set(provider.id, {
          provider_id: provider.id,
          provider_name: provider.name,
          total_orders: 0,
          total_cost: 0,
          total_revenue: 0,
          profit: 0,
          enabled: provider.enabled,
          balance: Number(provider.balance_cached || 0),
        });
      });

      orders?.forEach((order) => {
        const stats = statsMap.get(order.provider_id);
        if (!stats) return;

        const cost = Number(order.cost_provider || 0);
        const revenue = Number(order.charge_user);

        stats.total_orders += 1;
        stats.total_cost += cost;
        stats.total_revenue += revenue;
        stats.profit += revenue - cost;
      });

      const statsArray = Array.from(statsMap.values())
        .sort((a, b) => b.total_revenue - a.total_revenue);

      setProviderStats(statsArray);
    } catch (error) {
      console.error("Error fetching providers data:", error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['hsl(var(--primary))', 'hsl(142, 76%, 36%)', 'hsl(24, 95%, 53%)', 'hsl(262, 83%, 58%)', 'hsl(346, 77%, 50%)'];

  const pieData = providerStats
    .filter((s) => s.total_orders > 0)
    .map((stat) => ({
      name: stat.provider_name,
      value: stat.total_orders,
    }));

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">Providers Report</h2>
          <p className="text-muted-foreground">Rendimiento y estadísticas de proveedores</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-[300px] w-full" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Distribución de Órdenes por Proveedor</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="hsl(var(--primary))"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider Name</TableHead>
                  <TableHead className="text-right">Total Orders</TableHead>
                  <TableHead className="text-right">Total Cost</TableHead>
                  <TableHead className="text-right">Total Revenue</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {providerStats.map((stat) => (
                  <TableRow key={stat.provider_id}>
                    <TableCell className="font-medium">{stat.provider_name}</TableCell>
                    <TableCell className="text-right">{stat.total_orders}</TableCell>
                    <TableCell className="text-right">${stat.total_cost.toFixed(2)}</TableCell>
                    <TableCell className="text-right">${stat.total_revenue.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <span className={stat.profit >= 0 ? "text-green-600" : "text-red-600"}>
                        ${stat.profit.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">${stat.balance.toFixed(2)}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={stat.enabled ? "default" : "secondary"}>
                        {stat.enabled ? "Active" : "Inactive"}
                      </Badge>
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

export default ProvidersReport;
