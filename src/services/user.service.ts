import { usersApi } from "@/api/mockApi";
import type { User } from "@/types";

export const userService = {
  getAll: async (): Promise<User[]> => {
    const res = await usersApi.getAll();
    return res.data;
  },

  update: async (id: string, data: Partial<User>): Promise<User> => {
    const res = await usersApi.update(id, data);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await usersApi.delete(id);
  },
};
