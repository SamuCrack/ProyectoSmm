import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, TrendingUp, DollarSign, Percent } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { DateRange } from "react-day-picker";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";

interface ProfitData {
  date: string;
  revenue: number;
  cost: number;
  profit: number;
}

const ProfitsReport = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [profitData, setprofitData] = useState<ProfitData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({ revenue: 0, cost: 0, profit: 0, margin: 0 });

  useEffect(() => {
    fetchProfitsData();
  }, [dateRange]);

  const fetchProfitsData = async () => {
    if (!dateRange?.from || !dateRange?.to) return;

    setLoading(true);
    try {
      const { data: orders, error } = await supabase
        .from("orders")
        .select("created_at, charge_user, cost_provider")
        .gte("created_at", dateRange.from.toISOString())
        .lte("created_at", dateRange.to.toISOString())
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Aggregate by date
      const dateMap = new Map<string, { revenue: number; cost: number }>();
      let totalRevenue = 0;
      let totalCost = 0;

      orders?.forEach((order) => {
        const date = format(new Date(order.created_at!), "yyyy-MM-dd");
        const revenue = Number(order.charge_user);
        const cost = Number(order.cost_provider || 0);
        
        totalRevenue += revenue;
        totalCost += cost;

        const current = dateMap.get(date) || { revenue: 0, cost: 0 };
        dateMap.set(date, {
          revenue: current.revenue + revenue,
          cost: current.cost + cost,
        });
      });

      const profits: ProfitData[] = Array.from(dateMap.entries())
        .map(([date, data]) => ({
          date: format(new Date(date), "MMM dd"),
          revenue: data.revenue,
          cost: data.cost,
          profit: data.revenue - data.cost,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setprofitData(profits);

      const totalProfit = totalRevenue - totalCost;
      const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

      setTotals({
        revenue: totalRevenue,
        cost: totalCost,
        profit: totalProfit,
        margin: profitMargin,
      });
    } catch (error) {
      console.error("Error fetching profits data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Profits Report</h2>
            <p className="text-muted-foreground">Análisis de ganancias y márgenes</p>
          </div>

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
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-[120px]" />
              ))}
            </div>
            <Skeleton className="h-[400px] w-full" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card className="p-4 bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Revenue</p>
                    <p className="text-2xl font-bold text-foreground">${totals.revenue.toFixed(2)}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-500/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/20 rounded-lg">
                    <DollarSign className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cost</p>
                    <p className="text-2xl font-bold text-foreground">${totals.cost.toFixed(2)}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Profit</p>
                    <p className="text-2xl font-bold text-foreground">${totals.profit.toFixed(2)}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Percent className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Margin</p>
                    <p className="text-2xl font-bold text-foreground">{totals.margin.toFixed(1)}%</p>
                  </div>
                </div>
              </Card>
            </div>

            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={profitData}>
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
                <Bar dataKey="revenue" fill="hsl(142, 76%, 36%)" name="Revenue" />
                <Bar dataKey="cost" fill="hsl(24, 95%, 53%)" name="Cost" />
                <Bar dataKey="profit" fill="hsl(221, 83%, 53%)" name="Profit" />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </Card>
    </div>
  );
};

export default ProfitsReport;
