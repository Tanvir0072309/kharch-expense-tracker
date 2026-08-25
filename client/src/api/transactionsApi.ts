import { apiClient } from '@/api/client';
import { ApiEnvelope, PaginationMeta, Transaction, TransactionType } from '@/api/types';

/**
 * ===========================================================================
 * TRANSACTIONS API — thin wrappers around every /api/v1/transactions endpoint.
 * ===========================================================================
 * Each function does ONE http call and returns `response.data`
 * (the full envelope). No state, no side effects — that belongs in a
 * Redux slice / context.
 * ===========================================================================
 */

const TRANSACTIONS_BASE = '/transactions';

// ---- Request/response types ----------------------------------------------

export interface CreateTransactionPayload {
  type: TransactionType;
  amount: number;
  categoryId?: number;
  description?: string;
  /** ISO date string, e.g. "2026-08-23" */
  transactionDate?: string;
}
export interface CreateTransactionResponse {
  transaction: Transaction;
}

export type TransactionSortBy = 'transactionDate' | 'amount' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

export interface ListTransactionsParams {
  page?: number;
  limit?: number;
  type?: TransactionType;
  categoryId?: number;
  startDate?: string;
  endDate?: string;
  search?: string;
  sortBy?: TransactionSortBy;
  sortOrder?: SortOrder;
}
export interface ListTransactionsResponse {
  transactions: Transaction[];
  pagination: PaginationMeta;
}

export interface GetTransactionResponse {
  transaction: Transaction;
}

export interface UpdateTransactionPayload {
  amount?: number;
  categoryId?: number;
  description?: string;
  transactionDate?: string;
}
export interface UpdateTransactionResponse {
  transaction: Transaction;
}

// ---- Endpoint functions ---------------------------------------------------

export const transactionsApi = {
  /** POST / — create a transaction. */
  create: async (payload: CreateTransactionPayload) => {
    const { data } = await apiClient.post<ApiEnvelope<CreateTransactionResponse>>(
      TRANSACTIONS_BASE,
      payload
    );
    return data;
  },

  /** GET / — paginated, filterable list of transactions. All params optional. */
  list: async (params?: ListTransactionsParams) => {
    const { data } = await apiClient.get<ApiEnvelope<ListTransactionsResponse>>(
      TRANSACTIONS_BASE,
      { params }
    );
    return data;
  },

  /** GET /:id — a single transaction. */
  getById: async (id: number | string) => {
    const { data } = await apiClient.get<ApiEnvelope<GetTransactionResponse>>(
      `${TRANSACTIONS_BASE}/${id}`
    );
    return data;
  },

  /** PATCH /:id — send only the fields that changed. */
  update: async (id: number | string, payload: UpdateTransactionPayload) => {
    const { data } = await apiClient.patch<ApiEnvelope<UpdateTransactionResponse>>(
      `${TRANSACTIONS_BASE}/${id}`,
      payload
    );
    return data;
  },

  /** DELETE /:id */
  remove: async (id: number | string) => {
    const { data } = await apiClient.delete<ApiEnvelope<null>>(`${TRANSACTIONS_BASE}/${id}`);
    return data;
  },
};
