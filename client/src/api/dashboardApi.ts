import { apiClient } from '@/api/client';
import { ApiEnvelope, Category, Transaction } from '@/api/types';

/**
 * ===========================================================================
 * DASHBOARD API — thin wrapper around /api/v1/dashboard/summary.
 * ===========================================================================
 * Each function does ONE http call and returns `response.data`
 * (the full envelope). No state, no side effects — that belongs in a
 * Redux slice / context.
 * ===========================================================================
 */

const DASHBOARD_BASE = '/dashboard';

// ---- Request/response types ----------------------------------------------

export interface DashboardSummaryParams {
  startDate?: string;
  endDate?: string;
}

export interface DashboardCategoryBreakdown {
  category: Category;
  total: number;
}

export interface DashboardSummaryResponse {
  income: number;
  expense: number;
  balance: number;
  categories: DashboardCategoryBreakdown[];
  recentTransactions: Transaction[];
}

// ---- Endpoint functions ---------------------------------------------------

export const dashboardApi = {
  /** GET /summary — income/expense/balance + category breakdown + recent transactions. */
  getSummary: async (params?: DashboardSummaryParams) => {
    const { data } = await apiClient.get<ApiEnvelope<DashboardSummaryResponse>>(
      `${DASHBOARD_BASE}/summary`,
      { params }
    );
    return data;
  },
};
