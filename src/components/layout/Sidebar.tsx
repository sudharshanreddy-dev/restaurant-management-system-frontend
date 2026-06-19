import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingCart,
  ChefHat,
  BarChart3,
  Users,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/utils/cn";
import { useState } from "react";

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  roles: string[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard, roles: ["admin"] },
  { label: "Menu", path: "/admin/menu", icon: UtensilsCrossed, roles: ["admin"] },
  { label: "Orders", path: "/cashier/orders", icon: ShoppingCart, roles: ["admin", "cashier"] },
  { label: "Kitchen", path: "/kitchen", icon: ChefHat, roles: ["admin", "kitchen"] },
  { label: "Analytics", path: "/admin/analytics", icon: BarChart3, roles: ["admin", "cashier"] },
  { label: "Users", path: "/admin/users", icon: Users, roles: ["admin"] },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const filteredItems = navItems.filter(
    (item) => user && item.roles.includes(user.role)
  );

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
          <UtensilsCrossed className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight">RestroHub</h1>
          <p className="text-xs text-text-secondary">Management System</p>
        </div>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {filteredItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== "/admin" && location.pathname.startsWith(item.path));
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-text-secondary hover:bg-muted hover:text-text-primary"
              )}
            >
              <item.icon className={cn("h-5 w-5 transition-colors", isActive ? "text-primary" : "text-text-secondary group-hover:text-text-primary")} />
              {item.label}
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="ml-auto h-2 w-2 rounded-full bg-primary"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </NavLink>
          );
        })}
      </nav>

      <Separator />

      {/* User info */}
      <div className="p-4">
        <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name || "User"}</p>
            <p className="text-xs text-text-secondary capitalize">{user?.role || "unknown"}</p>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={logout}
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center gap-3 border-b bg-surface px-4 py-3 lg:hidden">
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <UtensilsCrossed className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold">RestroHub</span>
        </div>
      </div>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-0 top-0 z-50 h-full w-[280px] border-r bg-surface shadow-xl lg:hidden"
          >
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-[260px] lg:flex-col lg:border-r lg:bg-surface">
        {sidebarContent}
      </aside>
    </>
  );
}
