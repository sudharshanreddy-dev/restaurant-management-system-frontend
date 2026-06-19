import { kitchenApi } from "@/api/mockApi";
import type { Order } from "@/types";

export const kitchenService = {
  getOrders: async (): Promise<Order[]> => {
    const res = await kitchenApi.getOrders();
    return res.data;
  },

  updateStatus: async (id: string, status: string): Promise<Order> => {
    const res = await kitchenApi.updateStatus(id, status);
    return res.data;
  },
};
