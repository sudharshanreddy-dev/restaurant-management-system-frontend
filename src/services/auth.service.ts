import { authApi } from "@/api/mockApi";
import type { LoginCredentials, User } from "@/types";

let currentUserId: string | null = null;

export const setCurrentUserId = (id: string | null) => {
  currentUserId = id;
};

export const getCurrentUserId = () => currentUserId;

export const authService = {
  login: async (credentials: LoginCredentials): Promise<User> => {
    const res = await authApi.login(credentials.email, credentials.password);
    currentUserId = res.data.user._id;
    return res.data.user;
  },

  logout: async () => {
    currentUserId = null;
  },

  getMe: async (): Promise<User> => {
    if (!currentUserId) throw new Error("Not authenticated");
    const res = await authApi.getMe(currentUserId);
    return res.data;
  },

  register: async (data: { name: string; email: string; password: string; role: string }): Promise<User> => {
    const res = await authApi.register(data);
    return res.data;
  },
};
