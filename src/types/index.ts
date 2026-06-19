export type UserRole = "admin" | "cashier" | "kitchen";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  menuItem: MenuItem | string;
  quantity: number;
  price: number;
  name?: string;
}

export type OrderStatus = "pending" | "preparing" | "ready" | "completed" | "cancelled";
export type PaymentMethod = "cash" | "card" | "upi" | "unpaid";
export type PaymentStatus = "paid" | "unpaid";

export interface Order {
  _id: string;
  orderNumber: string;
  items: OrderItem[];
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  createdBy?: User | string;
  createdAt: string;
  updatedAt: string;
}

export interface DailySales {
  date: string;
  totalSales: number;
  totalOrders: number;
  avgOrderValue: number;
}

export interface BestSeller {
  name: string;
  totalQuantity: number;
  totalRevenue: number;
}

export interface AnalyticsStats {
  totalOrdersToday: number;
  revenueToday: number;
  activeOrders: number;
  menuItemCount: number;
  avgOrderValue: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  message?: string;
}

export interface CreateOrderPayload {
  items: { menuItem: string; quantity: number }[];
  paymentMethod: PaymentMethod;
  notes?: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}
