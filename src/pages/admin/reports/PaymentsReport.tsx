import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { DateRange } from "react-day-picker";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";

interface PaymentData {
  payment_method: string;
  amount: number;
  count: number;
  average: number;
}

interface ChartDataPoint {
  date: string;
  [key: string]: number | string;
}

const PaymentsReport = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");
  const [paymentData, setPaymentData] = useState<PaymentData[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPaymentsData();
  }, [dateRange]);

  const fetchPaymentsData = async () => {
    if (!dateRange?.from || !dateRange?.to) return;

    setLoading(true);
    try {
      const { data: recharges, error } = await supabase
        .from("recharges")
        .select("*")
        .in("status", ["Approved", "Completed"])
        .gte("created_at", dateRange.from.toISOString())
        .lte("created_at", dateRange.to.toISOString())
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Aggregate by payment method
      const methodMap = new Map<string, { total: number; count: number }>();
      recharges?.forEach((r) => {
        const method = r.payment_method || "Manual";
        const current = methodMap.get(method) || { total: 0, count: 0 };
        methodMap.set(method, {
          total: current.total + Number(r.amount),
          count: current.count + 1,
        });
      });

      const aggregated: PaymentData[] = Array.from(methodMap.entries()).map(
        ([method, data]) => ({
          payment_method: method,
          amount: data.total,
          count: data.count,
          average: data.total / data.count,
        })
      );

      setPaymentData(aggregated);

      // Generate chart data (daily aggregation)
      const dateMap = new Map<string, Record<string, number>>();
      recharges?.forEach((r) => {
        const date = format(new Date(r.created_at!), "yyyy-MM-dd");
        const method = r.payment_method || "Manual";
        const current = dateMap.get(date) || {};
        current[method] = (current[method] || 0) + Number(r.amount);
        dateMap.set(date, current);
      });

      const chartPoints: ChartDataPoint[] = Array.from(dateMap.entries())
        .map(([date, methods]) => ({
          date: format(new Date(date), "MMM dd"),
          ...methods,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setChartData(chartPoints);
    } catch (error) {
      console.error("Error fetching payments data:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = paymentData.reduce((sum, p) => sum + p.amount, 0);
  const totalCount = paymentData.reduce((sum, p) => sum + p.count, 0);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Payments Report</h2>
            <p className="text-muted-foreground">Ingresos por método de pago</p>
          </div>

          <div className="flex items-center gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>

            <div className="flex gap-2">
              <Button
                variant={viewMode === "chart" ? "default" : "outline"}
                onClick={() => setViewMode("chart")}
              >
                Chart
              </Button>
              <Button
                variant={viewMode === "table" ? "default" : "outline"}
                onClick={() => setViewMode("table")}
              >
                Table
              </Button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-[300px] w-full" />
            <Skeleton className="h-[200px] w-full" />
          </div>
        ) : (
          <>
            {viewMode === "chart" && (
              <div className="mb-8">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    {Array.from(new Set(paymentData.map((p) => p.payment_method))).map(
                      (method, index) => (
                        <Line
                          key={method}
                          type="monotone"
                          dataKey={method}
                          stroke={`hsl(${(index * 60) % 360}, 70%, 50%)`}
                          strokeWidth={2}
                        />
                      )
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                  <TableHead className="text-right">Average</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentData.map((p) => (
                  <TableRow key={p.payment_method}>
                    <TableCell className="font-medium">{p.payment_method}</TableCell>
                    <TableCell className="text-right">${p.amount.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{p.count}</TableCell>
                    <TableCell className="text-right">${p.average.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold bg-muted/50">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right">${totalAmount.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{totalCount}</TableCell>
                  <TableCell className="text-right">
                    ${totalCount > 0 ? (totalAmount / totalCount).toFixed(2) : "0.00"}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </>
        )}
      </Card>
    </div>
  );
};

export default PaymentsReport;
