import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useAuth } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AppLayout } from "./components/layout/AppLayout";
import { LoadingScreen } from "./components/shared/LoadingScreen";

// Lazy loaded pages
const LoginPage = lazy(() => import("./pages/LoginPage"));
const DashboardPage = lazy(() => import("./pages/admin/DashboardPage"));
const MenuPage = lazy(() => import("./pages/admin/MenuPage"));
const OrdersPage = lazy(() => import("./pages/cashier/OrdersPage"));
const KitchenPage = lazy(() => import("./pages/kitchen/KitchenPage"));
const AnalyticsPage = lazy(() => import("./pages/admin/AnalyticsPage"));
const UsersPage = lazy(() => import("./pages/admin/UsersPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const ForbiddenPage = lazy(() => import("./pages/ForbiddenPage"));

function RootRedirect() {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case "admin":
      return <Navigate to="/admin" replace />;
    case "cashier":
      return <Navigate to="/cashier/orders" replace />;
    case "kitchen":
      return <Navigate to="/kitchen" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
}

export default function App() {
  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Root redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Protected routes with layout */}
          <Route
            element={
              <ProtectedRoute allowedRoles={["admin", "cashier", "kitchen"]}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* Admin routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/menu"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <MenuPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <ProtectedRoute allowedRoles={["admin", "cashier"]}>
                  <AnalyticsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <UsersPage />
                </ProtectedRoute>
              }
            />

            {/* Cashier routes */}
            <Route
              path="/cashier/orders"
              element={
                <ProtectedRoute allowedRoles={["admin", "cashier"]}>
                  <OrdersPage />
                </ProtectedRoute>
              }
            />

            {/* Kitchen routes */}
            <Route
              path="/kitchen"
              element={
                <ProtectedRoute allowedRoles={["admin", "kitchen"]}>
                  <KitchenPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Error pages */}
          <Route path="/403" element={<ForbiddenPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
}
