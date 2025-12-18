import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface OrderStats {
  day: number;
  [month: string]: number;
}

const OrdersReport = () => {
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [orderStats, setOrderStats] = useState<OrderStats[]>([]);
  const [loading, setLoading] = useState(true);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  useEffect(() => {
    fetchOrdersData();
  }, [year]);

  const fetchOrdersData = async () => {
    setLoading(true);
    try {
      const startDate = new Date(parseInt(year), 0, 1).toISOString();
      const endDate = new Date(parseInt(year), 11, 31, 23, 59, 59).toISOString();

      const { data: orders, error } = await supabase
        .from("orders")
        .select("created_at")
        .gte("created_at", startDate)
        .lte("created_at", endDate);

      if (error) throw error;

      // Initialize stats for all days (1-31) and months
      const stats: OrderStats[] = [];
      for (let day = 1; day <= 31; day++) {
        const dayStats: OrderStats = { day };
        months.forEach((month) => {
          dayStats[month] = 0;
        });
        stats.push(dayStats);
      }

      // Count orders per day/month
      orders?.forEach((order) => {
        const date = new Date(order.created_at!);
        const day = date.getDate();
        const monthIndex = date.getMonth();
        const monthName = months[monthIndex];
        
        if (stats[day - 1]) {
          stats[day - 1][monthName] = (stats[day - 1][monthName] || 0) + 1;
        }
      });

      setOrderStats(stats);
    } catch (error) {
      console.error("Error fetching orders data:", error);
    } finally {
      setLoading(false);
    }
  };

  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const y = new Date().getFullYear() - i;
    return y.toString();
  });

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Orders Report</h2>
            <p className="text-muted-foreground">Órdenes por día y mes</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Year:</span>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {loading ? (
          <Skeleton className="h-[600px] w-full" />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-background z-10">#</TableHead>
                  {months.map((month) => (
                    <TableHead key={month} className="text-center min-w-[100px]">
                      {month}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderStats.map((stat) => (
                  <TableRow key={stat.day}>
                    <TableCell className="sticky left-0 bg-background z-10 font-medium">
                      {stat.day}
                    </TableCell>
                    {months.map((month) => (
                      <TableCell key={month} className="text-center">
                        {stat[month] || 0}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                <TableRow className="font-bold bg-muted/50">
                  <TableCell className="sticky left-0 bg-muted/50 z-10">Total</TableCell>
                  {months.map((month) => {
                    const total = orderStats.reduce((sum, stat) => sum + (stat[month] || 0), 0);
                    return (
                      <TableCell key={month} className="text-center">
                        {total}
                      </TableCell>
                    );
                  })}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default OrdersReport;
