import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ServiceStats {
  service_id: number;
  service_name: string;
  category_name: string;
  total_orders: number;
  total_revenue: number;
  avg_order_value: number;
  enabled: boolean;
}

const ServicesReport = () => {
  const [serviceStats, setServiceStats] = useState<ServiceStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServicesData();
  }, []);

  const fetchServicesData = async () => {
    setLoading(true);
    try {
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select(`
          service_id,
          charge_user,
          services (
            id,
            name,
            enabled,
            service_categories (
              name
            )
          )
        `);

      if (ordersError) throw ordersError;

      // Aggregate stats by service
      const statsMap = new Map<number, ServiceStats>();
      
      orders?.forEach((order) => {
        const serviceId = order.service_id;
        const service = order.services as any;
        
        if (!service) return;

        const current = statsMap.get(serviceId) || {
          service_id: serviceId,
          service_name: service.name,
          category_name: service.service_categories?.name || "Sin categoría",
          total_orders: 0,
          total_revenue: 0,
          avg_order_value: 0,
          enabled: service.enabled,
        };

        current.total_orders += 1;
        current.total_revenue += Number(order.charge_user);
        current.avg_order_value = current.total_revenue / current.total_orders;

        statsMap.set(serviceId, current);
      });

      const stats = Array.from(statsMap.values())
        .sort((a, b) => b.total_revenue - a.total_revenue);

      setServiceStats(stats);
    } catch (error) {
      console.error("Error fetching services data:", error);
    } finally {
      setLoading(false);
    }
  };

  const topServices = serviceStats.slice(0, 10);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">Services Report</h2>
          <p className="text-muted-foreground">Rendimiento de servicios más populares</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-[300px] w-full" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Top 10 Servicios por Revenue</h3>
              <ResponsiveContainer width="100%" height={450}>
                <BarChart data={topServices} layout="vertical" barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                  <YAxis 
                    dataKey="service_name" 
                    type="category" 
                    width={300}
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value: string) => value.length > 45 ? `${value.substring(0, 45)}...` : value}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                    labelFormatter={(label: string) => label}
                  />
                  <Bar dataKey="total_revenue" fill="hsl(var(--primary))" name="Revenue ($)" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="max-w-[350px]">Service Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Total Orders</TableHead>
                  <TableHead className="text-right">Total Revenue</TableHead>
                  <TableHead className="text-right">Avg Order Value</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serviceStats.map((stat) => (
                  <TableRow key={stat.service_id}>
                    <TableCell className="font-medium max-w-[350px]">
                      <span className="block truncate" title={stat.service_name}>
                        {stat.service_name}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{stat.category_name}</TableCell>
                    <TableCell className="text-right">{stat.total_orders}</TableCell>
                    <TableCell className="text-right">${stat.total_revenue.toFixed(2)}</TableCell>
                    <TableCell className="text-right">${stat.avg_order_value.toFixed(2)}</TableCell>
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

export default ServicesReport;
