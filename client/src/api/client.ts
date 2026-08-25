import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

import { API_BASE_URL, API_TIMEOUT_MS } from '@/config/env';
import { tokenStorage } from '@/api/storage';

/**
 * ===========================================================================
 * CENTRALIZED API CLIENT
 * ===========================================================================
 * This is the ONE axios instance used by the entire app. Every API call
 * (auth, transactions, profile, etc.) should go through `apiClient` instead
 * of creating new axios() calls scattered around screens.
 *
 * Responsibilities handled here, in one place:
 *  1. Base URL + timeout + default headers
 *  2. Attaching the access token to every outgoing request
 *  3. Detecting an expired access token (401) and transparently refreshing
 *     it using the refresh token, then retrying the original request
 *  4. Normalizing error shapes so screens/slices get a consistent object
 * ===========================================================================
 */

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

// -----------------------------------------------------------------------
// Request interceptor — attach access token
// -----------------------------------------------------------------------
apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await tokenStorage.getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// -----------------------------------------------------------------------
// Response interceptor — normalize errors + auto-refresh on 401
// -----------------------------------------------------------------------

type QueueItem = {
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
};

let isRefreshing = false;
let refreshQueue: QueueItem[] = [];

function resolveQueue(token: string) {
  refreshQueue.forEach((p) => p.resolve(token));
  refreshQueue = [];
}

function rejectQueue(err: unknown) {
  refreshQueue.forEach((p) => p.reject(err));
  refreshQueue = [];
}

// Called by the auth slice so this file doesn't need to import the store
// (avoids circular imports between client.ts <-> authSlice.ts <-> store.ts).
let onAuthLogout: (() => void) | null = null;
export function registerAuthLogoutHandler(handler: () => void) {
  onAuthLogout = handler;
}

export type ApiErrorShape = {
  message: string;
  code?: string;
  status?: number;
  raw?: unknown;
};

function normalizeError(error: AxiosError<any>): ApiErrorShape {
  if (error.response) {
    const data = error.response.data as any;
    return {
      message: data?.message || data?.error || 'Something went wrong. Please try again.',
      code: data?.code,
      status: error.response.status,
      raw: data,
    };
  }
  if (error.request) {
    return {
      message: 'Could not reach the server. Check your connection and try again.',
    };
  }
  return { message: error.message || 'Unexpected error occurred.' };
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;

    const isAuthEndpoint =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/signup') ||
      originalRequest?.url?.includes('/auth/refresh');

    // Attempt a silent token refresh exactly once per request on 401s,
    // skipping the auth endpoints themselves to avoid infinite loops.
    if (status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      const refreshToken = await tokenStorage.getRefreshToken();

      if (!refreshToken) {
        onAuthLogout?.();
        return Promise.reject(normalizeError(error));
      }

      if (isRefreshing) {
        // Queue this request until the in-flight refresh resolves.
        try {
          const newToken = await new Promise<string>((resolve, reject) => {
            refreshQueue.push({ resolve, reject });
          });
          originalRequest.headers = originalRequest.headers ?? {};
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          originalRequest._retry = true;
          return apiClient(originalRequest);
        } catch (queueErr) {
          return Promise.reject(normalizeError(queueErr as AxiosError));
        }
      }

      isRefreshing = true;
      originalRequest._retry = true;

      try {
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
        const newAccessToken: string = data?.data?.accessToken;
        const newRefreshToken: string = data?.data?.refreshToken;

        if (!newAccessToken) throw new Error('No access token returned from refresh');

        await tokenStorage.setTokens(newAccessToken, newRefreshToken ?? refreshToken);
        resolveQueue(newAccessToken);

        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshErr) {
        rejectQueue(refreshErr);
        await tokenStorage.clearTokens();
        onAuthLogout?.();
        return Promise.reject(normalizeError(error));
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(normalizeError(error));
  }
);

export type { AxiosRequestConfig };
