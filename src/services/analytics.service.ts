import { analyticsApi } from "@/api/mockApi";
import type { AnalyticsStats, DailySales, BestSeller } from "@/types";

export const analyticsService = {
  getStats: async (): Promise<AnalyticsStats> => {
    const res = await analyticsApi.getStats();
    return res.data;
  },

  getDailySales: async (date?: string): Promise<DailySales[]> => {
    const res = await analyticsApi.getDailySales(date);
    return res.data;
  },

  getBestSellers: async (params?: { startDate?: string; endDate?: string; limit?: number }): Promise<BestSeller[]> => {
    const res = await analyticsApi.getBestSellers({ limit: params?.limit });
    return res.data;
  },
};
