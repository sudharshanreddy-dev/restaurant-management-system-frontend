import { ordersApi } from "@/api/mockApi";
import { getCurrentUserId } from "./auth.service";
import type { CreateOrderPayload, Order, PaginatedResponse } from "@/types";

export const orderService = {
  getAll: async (params?: { status?: string; page?: number; limit?: number }): Promise<PaginatedResponse<Order>> => {
    return ordersApi.getAll(params);
  },

  getById: async (id: string): Promise<Order> => {
    const res = await ordersApi.getById(id);
    return res.data;
  },

  create: async (data: CreateOrderPayload): Promise<Order> => {
    const userId = getCurrentUserId();
    const res = await ordersApi.create(data, userId || undefined);
    return res.data;
  },

  update: async (id: string, _data: Partial<CreateOrderPayload>): Promise<Order> => {
    // For simplicity, just get the existing order
    const res = await ordersApi.getById(id);
    return res.data;
  },

  updateStatus: async (id: string, status: string): Promise<Order> => {
    const res = await ordersApi.updateStatus(id, status);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await ordersApi.delete(id);
  },

  recordPayment: async (id: string, paymentMethod: string): Promise<Order> => {
    const res = await ordersApi.recordPayment(id, paymentMethod);
    return res.data;
  },

  getInvoice: async (id: string): Promise<Order> => {
    const res = await ordersApi.getById(id);
    return res.data;
  },
};
