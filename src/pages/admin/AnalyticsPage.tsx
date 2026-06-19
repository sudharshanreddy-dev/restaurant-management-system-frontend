import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Calendar,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { PageContainer } from "@/components/shared/PageContainer";
import { StatCard } from "@/components/shared/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { analyticsService } from "@/services/analytics.service";

const PIE_COLORS = ["#E63946", "#2A9D8F", "#F4A261", "#264653", "#E9C46A", "#606C38"];

const paymentBreakdown = [
  { name: "Card", value: 45 },
  { name: "Cash", value: 30 },
  { name: "UPI", value: 20 },
  { name: "Unpaid", value: 5 },
];

export default function AnalyticsPage() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["analytics-stats"],
    queryFn: analyticsService.getStats,
  });

  const { data: dailySales, isLoading: salesLoading } = useQuery({
    queryKey: ["daily-sales", date],
    queryFn: () => analyticsService.getDailySales(date),
  });

  const { data: bestSellers, isLoading: sellersLoading } = useQuery({
    queryKey: ["best-sellers-full"],
    queryFn: () => analyticsService.getBestSellers({ limit: 10 }),
  });

  return (
    <PageContainer title="Analytics" description="Track your restaurant's performance">
      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {statsLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
          ))
        ) : (
          <>
            <StatCard
              title="Total Sales Today"
              value={`$${(stats?.revenueToday || 0).toLocaleString()}`}
              icon={DollarSign}
              trend="+12% from yesterday"
              trendUp
              color="bg-primary"
              index={0}
            />
            <StatCard
              title="Orders Today"
              value={stats?.totalOrdersToday || 0}
              icon={ShoppingCart}
              trend="+8% from yesterday"
              trendUp
              color="bg-secondary"
              index={1}
            />
            <StatCard
              title="Avg Order Value"
              value={`$${(stats?.avgOrderValue || 0).toFixed(2)}`}
              icon={TrendingUp}
              trend="+3% from last week"
              trendUp
              color="bg-accent"
              index={2}
            />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Daily Sales Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base font-semibold">Daily Sales</CardTitle>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-text-secondary" />
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="h-8 w-auto text-xs"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {salesLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailySales || []}>
                      <defs>
                        <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#E63946" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#E63946" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#6B7280" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#6B7280" />
                      <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #E5E7EB" }} />
                      <Area type="monotone" dataKey="totalSales" stroke="#E63946" strokeWidth={2} fill="url(#salesGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Best Sellers Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base font-semibold">Best Sellers</CardTitle>
                <Badge variant="muted">Top Items</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {sellersLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={(bestSellers || []).slice(0, 8)} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 12 }} stroke="#6B7280" />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="#6B7280" width={100} />
                      <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #E5E7EB" }} />
                      <Bar dataKey="totalQuantity" fill="#2A9D8F" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Payment Breakdown & Revenue Table */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Payment Methods</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {paymentBreakdown.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #E5E7EB" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {paymentBreakdown.map((item, idx) => (
                  <div key={item.name} className="flex items-center gap-1.5 text-xs">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[idx] }} />
                    <span>{item.name} ({item.value}%)</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2"
        >
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Revenue Breakdown</CardTitle>
                <Badge variant="muted">This Week</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {sellersLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-3 font-medium text-text-secondary">Item</th>
                        <th className="pb-3 font-medium text-text-secondary text-right">Qty Sold</th>
                        <th className="pb-3 font-medium text-text-secondary text-right">Revenue</th>
                        <th className="pb-3 font-medium text-text-secondary text-right">Avg Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(bestSellers || []).map((item, idx) => (
                        <motion.tr
                          key={item.name}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 + idx * 0.03 }}
                          className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                        >
                          <td className="py-3 font-medium">{item.name}</td>
                          <td className="py-3 text-right">{item.totalQuantity}</td>
                          <td className="py-3 text-right font-semibold">${item.totalRevenue.toLocaleString()}</td>
                          <td className="py-3 text-right text-text-secondary">
                            ${(item.totalRevenue / item.totalQuantity).toFixed(2)}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PageContainer>
  );
}
