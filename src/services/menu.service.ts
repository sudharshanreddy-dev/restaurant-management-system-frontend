import { menuApi } from "@/api/mockApi";
import type { MenuItem, PaginatedResponse } from "@/types";

export const menuService = {
  getAll: async (params?: { page?: number; limit?: number; category?: string }): Promise<PaginatedResponse<MenuItem>> => {
    return menuApi.getAll(params);
  },

  getById: async (id: string): Promise<MenuItem> => {
    const res = await menuApi.getById(id);
    return res.data;
  },

  getCategories: async (): Promise<string[]> => {
    const res = await menuApi.getCategories();
    return res.data;
  },

  create: async (data: Partial<MenuItem>): Promise<MenuItem> => {
    const res = await menuApi.create(data);
    return res.data;
  },

  update: async (id: string, data: Partial<MenuItem>): Promise<MenuItem> => {
    const res = await menuApi.update(id, data);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await menuApi.delete(id);
  },
};
