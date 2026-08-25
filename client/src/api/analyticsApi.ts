import { apiClient } from '@/api/client';
import { ApiEnvelope, Category } from '@/api/types';

/**
 * ===========================================================================
 * ANALYTICS API — thin wrappers around every /api/v1/analytics endpoint.
 * ===========================================================================
 * Each function does ONE http call and returns `response.data`
 * (the full envelope). No state, no side effects — that belongs in a
 * Redux slice / context.
 * ===========================================================================
 */

const ANALYTICS_BASE = '/analytics';

// ---- Request/response types ----------------------------------------------

export interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}

export interface AnalyticsOverviewResponse {
  income: number;
  expense: number;
  balance: number;
  transactionCount: number;
}

export interface AnalyticsCategoryBreakdown {
  category: Category;
  total: number;
  percentage: number;
}
export interface AnalyticsCategoriesResponse {
  categories: AnalyticsCategoryBreakdown[];
}

export interface MonthlyAnalyticsParams {
  year: number;
}
export interface MonthlyBreakdown {
  month: string;
  income: number;
  expense: number;
}
export interface MonthlyAnalyticsResponse {
  year: number;
  months: MonthlyBreakdown[];
}

// ---- Endpoint functions ---------------------------------------------------

export const analyticsApi = {
  /** GET /overview — income/expense/balance totals for the given range. */
  getOverview: async (params?: DateRangeParams) => {
    const { data } = await apiClient.get<ApiEnvelope<AnalyticsOverviewResponse>>(
      `${ANALYTICS_BASE}/overview`,
      { params }
    );
    return data;
  },

  /** GET /categories — spend/earn breakdown per category for the given range. */
  getCategoriesBreakdown: async (params?: DateRangeParams) => {
    const { data } = await apiClient.get<ApiEnvelope<AnalyticsCategoriesResponse>>(
      `${ANALYTICS_BASE}/categories`,
      { params }
    );
    return data;
  },

  /** GET /monthly?year=YYYY — month-by-month income/expense for a year. */
  getMonthly: async (params: MonthlyAnalyticsParams) => {
    const { data } = await apiClient.get<ApiEnvelope<MonthlyAnalyticsResponse>>(
      `${ANALYTICS_BASE}/monthly`,
      { params }
    );
    return data;
  },
};
