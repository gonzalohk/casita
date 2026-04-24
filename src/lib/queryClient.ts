/**
 * queryClient.ts  —  TanStack Query client and offline persistence
 *
 * queryClient   — configured with 5-minute staleTime (reduces Supabase requests
 *                  in areas with poor connectivity) and 24-hour gcTime for offline.
 * asyncStoragePersister — persists the query cache to AsyncStorage so the app
 *                         shows data immediately after launch, even offline.
 * queryKeys     — centralized key factory. All hooks must use these keys so that
 *                 invalidateQueries() correctly propagates after mutations.
 *                 Structure mirrors the Supabase table names.
 */
import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── QueryClient ─────────────────────────────────────────────
// staleTime: 5 min — data is fresh for 5 minutes (reduces requests in obra)
// gcTime: 24 h — keep cached data offline for 24 hours
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,    // 5 min
      gcTime: 1000 * 60 * 60 * 24, // 24 h
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

// ─── Offline persistence (AsyncStorage) ──────────────────────
// Persists the query cache to device storage so the app works
// fully offline after the first load.
export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'casita-query-cache',
  throttleTime: 1000,
});

// ─── Query keys ──────────────────────────────────────────────
// Centralized query key factory to avoid typos.
export const queryKeys = {
  project: ['project'] as const,
  balance: ['balance'] as const,
  expenses: {
    all: ['expenses'] as const,
    list: (filters?: object) => ['expenses', 'list', filters] as const,
    detail: (id: string) => ['expenses', id] as const,
  },
  categories: ['expense_categories'] as const,
  materials: {
    all: ['materials'] as const,
    detail: (id: string) => ['materials', id] as const,
    movements: (materialId: string) => ['materials', materialId, 'movements'] as const,
  },
  workers: {
    all: ['workers'] as const,
    detail: (id: string) => ['workers', id] as const,
    payroll: (workerId: string) => ['workers', workerId, 'payroll'] as const,
  },
  payroll: ['payroll'] as const,
  income: ['income'] as const,
  monthlyExpenses: (months: number) => ['monthlyExpenses', months] as const,
  suppliers: {
    all: ['suppliers'] as const,
    detail: (id: string) => ['suppliers', id] as const,
  },
  schedule: {
    all: ['schedule'] as const,
    detail: (id: string) => ['schedule', id] as const,
  },
  phases: {
    all: ['phases'] as const,
    detail: (id: string) => ['phases', id] as const,
  },
};
