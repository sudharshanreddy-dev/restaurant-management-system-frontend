import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ChefHat, CheckCircle2, Timer, AlertCircle, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { kitchenService } from "@/services/kitchen.service";
import type { Order } from "@/types";

function ElapsedTime({ createdAt }: { createdAt: string }) {
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    const update = () => {
      const seconds = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      setElapsed(`${minutes}:${secs.toString().padStart(2, "0")}`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [createdAt]);

  const minutes = parseInt(elapsed.split(":")[0] || "0");
  const isUrgent = minutes >= 10;
  const isWarning = minutes >= 5;

  return (
    <span className={`flex items-center gap-1 text-sm font-mono font-bold ${isUrgent ? "text-destructive" : isWarning ? "text-accent" : "text-text-secondary"}`}>
      <Timer className={`h-3.5 w-3.5 ${isUrgent ? "animate-pulse" : ""}`} />
      {elapsed}
    </span>
  );
}

interface KitchenColumnProps {
  title: string;
  icon: React.ElementType;
  orders: Order[];
  color: string;
  bgColor: string;
  actionLabel?: string;
  onAction?: (orderId: string) => void;
  isPending?: boolean;
}

function KitchenColumn({ title, icon: Icon, orders, color, bgColor, actionLabel, onAction, isPending }: KitchenColumnProps) {
  return (
    <div className="flex flex-col">
      <div className={`${bgColor} rounded-t-xl p-4 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${color}`} />
          <h2 className={`font-bold ${color}`}>{title}</h2>
        </div>
        <Badge variant="outline" className={`${color} border-current`}>
          {orders.length}
        </Badge>
      </div>
      <div className="flex-1 space-y-3 rounded-b-xl bg-muted/50 p-3 min-h-[200px]">
        <AnimatePresence mode="popLayout">
          {orders.map((order) => {
            const minutes = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
            const isUrgent = minutes >= 10;
            return (
              <motion.div
                key={order._id}
                layoutId={`kitchen-${order._id}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
                whileHover={{ scale: 1.02 }}
              >
                <Card className={`overflow-hidden transition-all ${isUrgent && order.status === "pending" ? "ring-2 ring-destructive ring-offset-2 shadow-lg shadow-destructive/20" : "hover:shadow-md"}`}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold">{order.orderNumber}</span>
                      <ElapsedTime createdAt={order.createdAt} />
                    </div>

                    <div className="space-y-1.5">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="font-medium">{item.name || "Item"}</span>
                          <Badge variant="muted" className="font-bold">×{item.quantity}</Badge>
                        </div>
                      ))}
                    </div>

                    {order.notes && (
                      <div className="rounded-lg bg-accent/10 p-2 text-xs text-accent flex items-start gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                        {order.notes}
                      </div>
                    )}

                    {actionLabel && onAction && (
                      <Button
                        className="w-full"
                        variant={order.status === "pending" ? "default" : "secondary"}
                        onClick={() => onAction(order._id)}
                        disabled={isPending}
                      >
                        {order.status === "pending" ? (
                          <ChefHat className="h-4 w-4 mr-2" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                        )}
                        {actionLabel}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {orders.length === 0 && (
          <div className="flex items-center justify-center py-12 text-text-secondary text-sm">
            No orders
          </div>
        )}
      </div>
    </div>
  );
}

export default function KitchenPage() {
  const queryClient = useQueryClient();

  const { data: kitchenOrders, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["kitchen-orders"],
    queryFn: kitchenService.getOrders,
    refetchInterval: 10000,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => kitchenService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kitchen-orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order updated!");
    },
    onError: () => toast.error("Failed to update order"),
  });

  const orders = kitchenOrders || [];
  const pending = orders.filter((o) => o.status === "pending");
  const preparing = orders.filter((o) => o.status === "preparing");
  const ready = orders.filter((o) => o.status === "ready");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <ChefHat className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Kitchen Display</h1>
            <p className="text-sm text-text-secondary flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Live • Auto-refreshes every 10s
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <div className="flex gap-2">
            <Badge variant="warning">{pending.length} Pending</Badge>
            <Badge variant="info">{preparing.length} Preparing</Badge>
            <Badge variant="success">{ready.length} Ready</Badge>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="h-14 rounded-t-xl bg-muted animate-pulse" />
              <div className="space-y-3 p-3 rounded-b-xl bg-muted/30">
                {Array.from({ length: 2 }).map((_, j) => (
                  <div key={j} className="h-32 rounded-xl bg-muted animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <KitchenColumn
            title="Pending"
            icon={Clock}
            orders={pending}
            color="text-accent"
            bgColor="bg-accent/10"
            actionLabel="Start Preparing"
            onAction={(id) => statusMutation.mutate({ id, status: "preparing" })}
            isPending={statusMutation.isPending}
          />
          <KitchenColumn
            title="Preparing"
            icon={ChefHat}
            orders={preparing}
            color="text-blue-600"
            bgColor="bg-blue-50"
            actionLabel="Mark Ready"
            onAction={(id) => statusMutation.mutate({ id, status: "ready" })}
            isPending={statusMutation.isPending}
          />
          <KitchenColumn
            title="Ready"
            icon={CheckCircle2}
            orders={ready}
            color="text-secondary"
            bgColor="bg-secondary/10"
          />
        </div>
      )}
    </motion.div>
  );
}
