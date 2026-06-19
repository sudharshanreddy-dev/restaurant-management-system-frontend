import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  DollarSign,
  Flame,
  UtensilsCrossed,
  TrendingUp,
} from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { PageContainer } from "@/components/shared/PageContainer";
import { StatCard } from "@/components/shared/StatCard";
import { StatusBadge, PaymentBadge } from "@/components/shared/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { analyticsService } from "@/services/analytics.service";
import { orderService } from "@/services/order.service";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["analytics-stats"],
    queryFn: analyticsService.getStats,
  });

  const { data: dailySales, isLoading: salesLoading } = useQuery({
    queryKey: ["daily-sales"],
    queryFn: () => analyticsService.getDailySales(),
  });

  const { data: bestSellers, isLoading: sellersLoading } = useQuery({
    queryKey: ["best-sellers"],
    queryFn: () => analyticsService.getBestSellers({ limit: 5 }),
  });

  const { data: recentOrdersData, isLoading: ordersLoading } = useQuery({
    queryKey: ["recent-orders"],
    queryFn: () => orderService.getAll({ page: 1, limit: 5 }),
  });

  const recentOrders = recentOrdersData?.data || [];

  return (
    <PageContainer
      title={`Welcome back, ${user?.name || "Admin"} 👋`}
      description={format(new Date(), "EEEE, MMMM d, yyyy")}
    >
      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
          ))
        ) : (
          <>
            <StatCard
              title="Orders Today"
              value={stats?.totalOrdersToday || 0}
              icon={ShoppingCart}
              trend="+12% from yesterday"
              trendUp={true}
              color="bg-primary"
              index={0}
            />
            <StatCard
              title="Revenue Today"
              value={`$${(stats?.revenueToday || 0).toLocaleString()}`}
              icon={DollarSign}
              trend="+8% from yesterday"
              trendUp={true}
              color="bg-secondary"
              index={1}
            />
            <StatCard
              title="Active Orders"
              value={stats?.activeOrders || 0}
              icon={Flame}
              color="bg-accent"
              index={2}
            />
            <StatCard
              title="Menu Items"
              value={stats?.menuItemCount || 0}
              icon={UtensilsCrossed}
              color="bg-violet-500"
              index={3}
            />
          </>
        )}
      </div>

      {/* Charts */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-6 lg:grid-cols-2"
      >
        <motion.div variants={itemVariants}>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Daily Sales Trend</CardTitle>
                <Badge variant="muted" className="gap-1">
                  <TrendingUp className="h-3 w-3" />
                  This Week
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {salesLoading ? (
                <Skeleton className="h-[280px] w-full" />
              ) : (
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailySales || []}>
                      <defs>
                        <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#E63946" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#E63946" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#6B7280" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#6B7280" />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "12px",
                          border: "1px solid #E5E7EB",
                          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                        }}
                        formatter={(value) => [`$${Number(value).toLocaleString()}`, "Sales"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="totalSales"
                        stroke="#E63946"
                        strokeWidth={2}
                        fill="url(#salesGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Best Sellers</CardTitle>
                <Badge variant="muted">Top 5</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {sellersLoading ? (
                <Skeleton className="h-[280px] w-full" />
              ) : (
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={bestSellers || []} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 12 }} stroke="#6B7280" />
                      <YAxis
                        dataKey="name"
                        type="category"
                        tick={{ fontSize: 12 }}
                        stroke="#6B7280"
                        width={100}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "12px",
                          border: "1px solid #E5E7EB",
                          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                        }}
                      />
                      <Bar dataKey="totalQuantity" fill="#2A9D8F" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Recent Orders */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <p className="text-center text-sm text-text-secondary py-8">No orders yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-text-secondary">
                      <th className="pb-3 font-medium">Order #</th>
                      <th className="pb-3 font-medium">Time</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Payment</th>
                      <th className="pb-3 font-medium text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order, idx) => (
                      <motion.tr
                        key={order._id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                      >
                        <td className="py-3 font-medium">{order.orderNumber}</td>
                        <td className="py-3 text-sm text-text-secondary">{timeAgo(order.createdAt)}</td>
                        <td className="py-3"><StatusBadge status={order.status} /></td>
                        <td className="py-3"><PaymentBadge status={order.paymentStatus} /></td>
                        <td className="py-3 text-right font-semibold">${order.total.toFixed(2)}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </PageContainer>
  );
}
