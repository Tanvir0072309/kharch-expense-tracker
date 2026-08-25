import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { Category, categoriesApi } from '@/api/categoriesApi';
import { dashboardApi } from '@/api/dashboardApi';
import {
  CreateTransactionPayload,
  transactionsApi,
  UpdateTransactionPayload,
} from '@/api/transactionsApi';
import { ApiErrorShape } from '@/api/client';
import { useAppSelector } from '@/store/hooks';
import { Transaction, TransactionType } from '@/types/transaction';

/**
 * ===========================================================================
 * TRANSACTIONS CONTEXT — now backed by the real backend.
 * ===========================================================================
 * Pulls categories, the dashboard summary (for accurate income/expense/
 * balance totals) and the transaction list from the API, and maps the
 * backend shape onto the `Transaction` type the existing UI already knows
 * how to render (title/category/type/date/note).
 * ===========================================================================
 */

// How many transactions to pull for the in-app lists (home "recent",
// expenses tab, analytics breakdown). Bump this if you add real pagination.
const LIST_LIMIT = 200;

type NewTransactionInput = {
  title: string;
  category: string;
  amount: number;
  type: TransactionType;
  date: string;
  categoryId?: number | null;
};

type TransactionsContextValue = {
  transactions: Transaction[];
  categories: Category[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  addTransaction: (t: NewTransactionInput) => Promise<void>;
  updateTransaction: (id: number | string, payload: UpdateTransactionPayload) => Promise<void>;
  deleteTransaction: (id: number | string) => Promise<void>;
  refresh: () => Promise<void>;
  totalBalance: number;
  totalExpense: number;
  totalProfit: number;
};

const TransactionsContext = createContext<TransactionsContextValue | undefined>(undefined);

function mapType(type: TransactionType): 'income' | 'expense' {
  return type === 'profit' ? 'income' : 'expense';
}

function extractErrorMessage(err: unknown): string {
  const shaped = err as ApiErrorShape;
  return shaped?.message || 'Something went wrong. Please try again.';
}

export function TransactionsProvider({ children }: { children: ReactNode }) {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totals, setTotals] = useState({ income: 0, expense: 0, balance: 0 });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    try {
      setError(null);
      const [categoriesRes, summaryRes, listRes] = await Promise.all([
        categoriesApi.getAll(),
        dashboardApi.getSummary(),
        transactionsApi.list({
          limit: LIST_LIMIT,
          sortBy: 'transactionDate',
          sortOrder: 'desc',
        }),
      ]);

      const fetchedCategories = categoriesRes.data.categories;
      setCategories(fetchedCategories);

      const nameById = new Map<number, string>();
      fetchedCategories.forEach((c) => nameById.set(c.id, c.name));

      const mapped = listRes.data.transactions.map((t) => {
        const categoryName =
          t.category?.name || (t.categoryId != null ? nameById.get(t.categoryId) : undefined) || 'Other';
        const title =
          t.description?.trim() || categoryName || (t.type === 'income' ? 'Income' : 'Expense');
        return {
          id: String(t.id),
          backendId: t.id,
          title,
          category: categoryName,
          amount: t.amount,
          type: t.type === 'income' ? ('profit' as const) : ('expense' as const),
          date: t.transactionDate,
          note: title !== categoryName ? categoryName : undefined,
          categoryId: t.categoryId,
        };
      });

      setTransactions(mapped);
      setTotals({
        income: summaryRes.data.income,
        expense: summaryRes.data.expense,
        balance: summaryRes.data.balance,
      });
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      // Logged out (or not yet restored) — clear any stale data from a
      // previous session and don't hit the API.
      setTransactions([]);
      setCategories([]);
      setTotals({ income: 0, expense: 0, balance: 0 });
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      await loadAll();
      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, loadAll]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }, [loadAll]);

  const addTransaction = useCallback(
    async (t: NewTransactionInput) => {
      const payload: CreateTransactionPayload = {
        type: mapType(t.type),
        amount: t.amount,
        transactionDate: t.date.slice(0, 10),
      };
      if (t.categoryId != null) payload.categoryId = t.categoryId;
      if (t.title) payload.description = t.title;

      await transactionsApi.create(payload);
      await loadAll();
    },
    [loadAll]
  );

  const updateTransaction = useCallback(
    async (id: number | string, payload: UpdateTransactionPayload) => {
      await transactionsApi.update(id, payload);
      await loadAll();
    },
    [loadAll]
  );

  const deleteTransaction = useCallback(
    async (id: number | string) => {
      await transactionsApi.remove(id);
      await loadAll();
    },
    [loadAll]
  );

  const value = useMemo(
    () => ({
      transactions,
      categories,
      loading,
      refreshing,
      error,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      refresh,
      totalExpense: totals.expense,
      totalProfit: totals.income,
      totalBalance: totals.balance,
    }),
    [
      transactions,
      categories,
      loading,
      refreshing,
      error,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      refresh,
      totals,
    ]
  );

  return <TransactionsContext.Provider value={value}>{children}</TransactionsContext.Provider>;
}

export function useTransactions() {
  const ctx = useContext(TransactionsContext);
  if (!ctx) throw new Error('useTransactions must be used within TransactionsProvider');
  return ctx;
}
