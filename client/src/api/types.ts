/**
 * ===========================================================================
 * SHARED API TYPES
 * ===========================================================================
 * Common shapes reused across the users / transactions / categories /
 * dashboard / analytics API modules, so we don't redefine the same
 * envelope or domain object five times.
 * ===========================================================================
 */

// Generic envelope every endpoint returns: { success, message, data }
export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Category {
  id: number;
  name: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: number;
  type: TransactionType;
  amount: number;
  categoryId: number | null;
  category?: Category | null;
  description: string | null;
  transactionDate: string;
  createdAt: string;
  updatedAt: string;
}
