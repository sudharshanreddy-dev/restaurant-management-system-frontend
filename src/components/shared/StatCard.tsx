import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  color?: string;
  index?: number;
}

export function StatCard({ title, value, icon: Icon, trend, trendUp, color = "bg-primary", index = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      whileHover={{ scale: 1.02, y: -2 }}
    >
      <Card className="overflow-hidden hover:shadow-md">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-text-secondary">{title}</p>
              <p className="text-3xl font-bold tracking-tight">{value}</p>
              {trend && (
                <p className={`text-xs font-medium ${trendUp ? "text-secondary" : "text-destructive"}`}>
                  {trendUp ? "↑" : "↓"} {trend}
                </p>
              )}
            </div>
            <div className={`${color} rounded-xl p-3`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
