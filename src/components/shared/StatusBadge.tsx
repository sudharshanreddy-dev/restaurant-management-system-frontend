import { Badge } from "@/components/ui/badge";
import type { OrderStatus, PaymentStatus } from "@/types";

const statusConfig: Record<OrderStatus, { label: string; variant: "warning" | "info" | "success" | "secondary" | "destructive" }> = {
  pending: { label: "Pending", variant: "warning" },
  preparing: { label: "Preparing", variant: "info" },
  ready: { label: "Ready", variant: "success" },
  completed: { label: "Completed", variant: "secondary" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const config = statusConfig[status] || { label: status, variant: "muted" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge variant={status === "paid" ? "success" : "warning"}>
      {status === "paid" ? "Paid" : "Unpaid"}
    </Badge>
  );
}
