export type TransactionType = 'expense' | 'profit';

export type Transaction = {
  id: string;
  title: string;
  category: string;
  amount: number;
  type: TransactionType;
  date: string; // ISO date
  note?: string;
  /** Backend numeric id, kept for update/delete calls. Same value as `id` for real data. */
  backendId?: number;
  /** Backend category id, needed when editing/creating via the API. */
  categoryId?: number | null;
};
