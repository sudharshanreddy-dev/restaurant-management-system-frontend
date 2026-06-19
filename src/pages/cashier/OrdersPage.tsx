import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  ShoppingCart,
  Minus,
  X,
  CreditCard,
  Banknote,
  Smartphone,
  Eye,
  Loader2,
  Clock,
  FileText,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { PageContainer } from "@/components/shared/PageContainer";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge, PaymentBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { orderService } from "@/services/order.service";
import { menuService } from "@/services/menu.service";
import type { MenuItem, Order, PaymentMethod } from "@/types";

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export default function OrdersPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [menuSearch, setMenuSearch] = useState("");
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [cashTendered, setCashTendered] = useState("");
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ["orders", statusFilter],
    queryFn: () => orderService.getAll({ status: statusFilter === "all" ? undefined : statusFilter, page: 1, limit: 50 }),
    staleTime: 30 * 1000,
  });

  const { data: menuData } = useQuery({
    queryKey: ["menu-for-order"],
    queryFn: () => menuService.getAll({ limit: 100 }),
    staleTime: 5 * 60 * 1000,
  });

  const orders = ordersData?.data || [];
  const menuItems = (menuData?.data || []).filter(i => i.isAvailable);

  const filteredOrders = orders.filter((order) =>
    order.orderNumber.toLowerCase().includes(search.toLowerCase())
  );

  const filteredMenuItems = menuItems.filter((item) =>
    item.name.toLowerCase().includes(menuSearch.toLowerCase())
  );

  const createMutation = useMutation({
    mutationFn: orderService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["kitchen-orders"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-stats"] });
      toast.success("Order placed successfully!");
      setShowCreatePanel(false);
      setCart([]);
      setPaymentMethod("cash");
      setCashTendered("");
    },
    onError: () => toast.error("Failed to create order"),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => orderService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["kitchen-orders"] });
      toast.success("Order status updated!");
    },
    onError: () => toast.error("Failed to update status"),
  });

  const paymentMutation = useMutation({
    mutationFn: ({ id, method }: { id: string; method: string }) => orderService.recordPayment(id, method),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Payment recorded!");
      setShowPaymentDialog(false);
    },
    onError: () => toast.error("Failed to record payment"),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => orderService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["kitchen-orders"] });
      toast.success("Order cancelled!");
      setShowCancelDialog(false);
    },
    onError: () => toast.error("Failed to cancel order"),
  });

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItem._id === item._id);
      if (existing) {
        return prev.map((c) => c.menuItem._id === item._id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { menuItem: item, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev.map((c) => c.menuItem._id === itemId ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c).filter((c) => c.quantity > 0)
    );
  };

  const subtotal = cart.reduce((sum, c) => sum + c.menuItem.price * c.quantity, 0);
  const tax = subtotal * 0.05;
  const total = subtotal + tax;
  const change = paymentMethod === "cash" && cashTendered ? Math.max(0, parseFloat(cashTendered) - total) : 0;

  const placeOrder = () => {
    if (cart.length === 0) return;
    createMutation.mutate({
      items: cart.map((c) => ({ menuItem: c.menuItem._id, quantity: c.quantity })),
      paymentMethod,
    });
  };

  const statuses = ["all", "pending", "preparing", "ready", "completed", "cancelled"];

  return (
    <PageContainer
      title="Orders"
      description="Manage and create orders"
      action={
        <Button onClick={() => setShowCreatePanel(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Order
        </Button>
      }
    >
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-all ${
                statusFilter === s
                  ? "bg-primary text-white"
                  : "bg-muted text-text-secondary hover:text-text-primary"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
          <Input
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-9"
          />
        </div>
      </div>

      {/* Orders List */}
      {ordersLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <EmptyState 
          icon={ShoppingCart} 
          title="No orders found" 
          description={search ? "Try adjusting your search" : "Create your first order to get started"}
          action={
            <Button onClick={() => setShowCreatePanel(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              New Order
            </Button>
          }
        />
      ) : (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }}
          className="space-y-3"
        >
          {filteredOrders.map((order) => (
            <motion.div
              key={order._id}
              variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } }}
              layout
            >
              <Card className="hover:shadow-md transition-all duration-200">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-lg">{order.orderNumber}</span>
                          <StatusBadge status={order.status} />
                          <PaymentBadge status={order.paymentStatus} />
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-text-secondary flex-wrap">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {timeAgo(order.createdAt)}
                          </span>
                          <span>{order.items.length} item(s)</span>
                          <span className="capitalize">{order.paymentMethod}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xl font-bold">${order.total.toFixed(2)}</span>
                      <div className="flex gap-1 ml-2">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => { setSelectedOrder(order); setShowDetailDialog(true); }}
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => { setSelectedOrder(order); setShowInvoiceDialog(true); }}
                          title="Invoice"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        {order.paymentStatus === "unpaid" && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => { setSelectedOrder(order); setShowPaymentDialog(true); }}
                          >
                            <CreditCard className="h-3 w-3 mr-1" />
                            Pay
                          </Button>
                        )}
                        {(order.status === "ready" || order.status === "preparing") && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => statusMutation.mutate({ id: order._id, status: order.status === "ready" ? "completed" : "ready" })}
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            {order.status === "ready" ? "Complete" : "Served"}
                          </Button>
                        )}
                        {order.status === "pending" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => { setSelectedOrder(order); setShowCancelDialog(true); }}
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Create Order Panel */}
      <AnimatePresence>
        {showCreatePanel && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50"
              onClick={() => setShowCreatePanel(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 z-50 h-full w-full max-w-lg bg-surface shadow-2xl overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">New Order</h2>
                  <Button variant="ghost" size="icon" onClick={() => setShowCreatePanel(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                {/* Menu search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                  <Input
                    placeholder="Search menu..."
                    value={menuSearch}
                    onChange={(e) => setMenuSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Menu items */}
                <div className="space-y-2 max-h-[300px] overflow-y-auto mb-6">
                  {filteredMenuItems.length === 0 ? (
                    <p className="text-sm text-text-secondary text-center py-4">No menu items available</p>
                  ) : (
                    filteredMenuItems.map((item) => {
                      const inCart = cart.find((c) => c.menuItem._id === item._id);
                      return (
                        <motion.div
                          key={item._id}
                          whileHover={{ scale: 1.01 }}
                          className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => addToCart(item)}
                        >
                          <div>
                            <p className="font-medium text-sm">{item.name}</p>
                            <p className="text-xs text-text-secondary">${item.price.toFixed(2)}</p>
                          </div>
                          {inCart ? (
                            <Badge variant="default">{inCart.quantity}</Badge>
                          ) : (
                            <Plus className="h-4 w-4 text-text-secondary" />
                          )}
                        </motion.div>
                      );
                    })
                  )}
                </div>

                <Separator className="my-4" />

                {/* Cart */}
                <h3 className="font-semibold mb-3">Order Items ({cart.length})</h3>
                {cart.length === 0 ? (
                  <p className="text-sm text-text-secondary text-center py-4">Add items from the menu above</p>
                ) : (
                  <div className="space-y-2 mb-4">
                    {cart.map((item) => (
                      <div key={item.menuItem._id} className="flex items-center justify-between rounded-lg bg-muted p-3">
                        <div>
                          <p className="font-medium text-sm">{item.menuItem.name}</p>
                          <p className="text-xs text-text-secondary">
                            ${item.menuItem.price.toFixed(2)} × {item.quantity}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">${(item.menuItem.price * item.quantity).toFixed(2)}</span>
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon-sm"
                              variant="outline"
                              onClick={(e) => { e.stopPropagation(); updateQuantity(item.menuItem._id, -1); }}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                            <Button
                              size="icon-sm"
                              variant="outline"
                              onClick={(e) => { e.stopPropagation(); updateQuantity(item.menuItem._id, 1); }}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {cart.length > 0 && (
                  <>
                    {/* Totals */}
                    <div className="space-y-2 rounded-lg bg-muted p-4 mb-4">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal</span>
                        <span>${subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Tax (5%)</span>
                        <span>${tax.toFixed(2)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>${total.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Payment Method */}
                    <div className="mb-4">
                      <Label className="mb-2 block">Payment Method</Label>
                      <div className="grid grid-cols-4 gap-2">
                        {([
                          { value: "cash" as const, label: "Cash", icon: Banknote },
                          { value: "card" as const, label: "Card", icon: CreditCard },
                          { value: "upi" as const, label: "UPI", icon: Smartphone },
                          { value: "unpaid" as const, label: "Unpaid", icon: Clock },
                        ]).map(({ value, label, icon: Icon }) => (
                          <button
                            key={value}
                            onClick={() => setPaymentMethod(value)}
                            className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-xs font-medium transition-all ${
                              paymentMethod === value
                                ? "border-primary bg-primary/5 text-primary"
                                : "hover:bg-muted"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {paymentMethod === "cash" && (
                      <div className="mb-4 space-y-2">
                        <Label htmlFor="cashTendered">Amount Tendered</Label>
                        <Input
                          id="cashTendered"
                          type="number"
                          step="0.01"
                          value={cashTendered}
                          onChange={(e) => setCashTendered(e.target.value)}
                          placeholder="0.00"
                        />
                        {change > 0 && (
                          <p className="text-sm font-semibold text-secondary">
                            Change: ${change.toFixed(2)}
                          </p>
                        )}
                      </div>
                    )}

                    <Button
                      className="w-full h-12 text-base font-semibold"
                      onClick={placeOrder}
                      disabled={createMutation.isPending}
                    >
                      {createMutation.isPending ? (
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      ) : (
                        <ShoppingCart className="h-5 w-5 mr-2" />
                      )}
                      Place Order (${total.toFixed(2)})
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Order Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Order {selectedOrder?.orderNumber}</DialogTitle>
            <DialogDescription>Order details and items</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <StatusBadge status={selectedOrder.status} />
                <PaymentBadge status={selectedOrder.paymentStatus} />
                <Badge variant="muted" className="capitalize">{selectedOrder.paymentMethod}</Badge>
              </div>
              <div className="space-y-2">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between rounded-lg bg-muted p-3">
                    <span className="text-sm font-medium">{item.name || "Item"} × {item.quantity}</span>
                    <span className="text-sm font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="space-y-1">
                <div className="flex justify-between text-sm"><span>Subtotal</span><span>${selectedOrder.subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm"><span>Tax</span><span>${selectedOrder.tax.toFixed(2)}</span></div>
                <div className="flex justify-between font-bold"><span>Total</span><span>${selectedOrder.total.toFixed(2)}</span></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Invoice Dialog */}
      <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invoice</DialogTitle>
            <DialogDescription>{selectedOrder?.orderNumber}</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="print-area space-y-4 text-sm">
              <div className="text-center border-b pb-3">
                <h3 className="font-bold text-lg">RestroHub</h3>
                <p className="text-text-secondary text-xs">123 Food Street, Culinary City</p>
              </div>
              <div className="flex justify-between text-xs text-text-secondary">
                <span>{selectedOrder.orderNumber}</span>
                <span>{new Date(selectedOrder.createdAt).toLocaleString()}</span>
              </div>
              <div className="space-y-1">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{item.name || "Item"} × {item.quantity}</span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="space-y-1">
                <div className="flex justify-between"><span>Subtotal</span><span>${selectedOrder.subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Tax (5%)</span><span>${selectedOrder.tax.toFixed(2)}</span></div>
                <div className="flex justify-between font-bold text-base"><span>Total</span><span>${selectedOrder.total.toFixed(2)}</span></div>
              </div>
              <div className="text-center text-xs text-text-secondary pt-2 border-t">
                <p>Thank you for dining with us!</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => window.print()}>
              <FileText className="h-4 w-4 mr-2" />
              Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              {selectedOrder?.orderNumber} — ${selectedOrder?.total.toFixed(2)}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-2">
            {(["cash", "card", "upi"] as const).map((method) => (
              <button
                key={method}
                onClick={() => selectedOrder && paymentMutation.mutate({ id: selectedOrder._id, method })}
                disabled={paymentMutation.isPending}
                className="flex flex-col items-center gap-2 rounded-lg border p-4 text-sm font-medium hover:border-primary hover:bg-primary/5 transition-all capitalize"
              >
                {method === "cash" ? <Banknote className="h-6 w-6" /> : method === "card" ? <CreditCard className="h-6 w-6" /> : <Smartphone className="h-6 w-6" />}
                {method}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel {selectedOrder?.orderNumber}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>No, keep it</Button>
            <Button
              variant="destructive"
              onClick={() => selectedOrder && cancelMutation.mutate(selectedOrder._id)}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Yes, cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
