import { apiClient } from '@/api/client';
import { ApiEnvelope, Category } from '@/api/types';

export type { Category };

/**
 * ===========================================================================
 * CATEGORIES API — thin wrappers around every /api/v1/categories endpoint.
 * ===========================================================================
 * Each function does ONE http call and returns `response.data`
 * (the full envelope). No state, no side effects — that belongs in a
 * Redux slice / context.
 * ===========================================================================
 */

const CATEGORIES_BASE = '/categories';

// ---- Request/response types ----------------------------------------------

export interface GetCategoriesResponse {
  categories: Category[];
}

export interface CreateCategoryPayload {
  name: string;
}
export interface CreateCategoryResponse {
  category: Category;
}

export interface UpdateCategoryPayload {
  name: string;
}
export interface UpdateCategoryResponse {
  category: Category;
}

// ---- Endpoint functions ---------------------------------------------------

export const categoriesApi = {
  /** GET / — both the user's own categories and the default (system) ones. */
  getAll: async () => {
    const { data } = await apiClient.get<ApiEnvelope<GetCategoriesResponse>>(CATEGORIES_BASE);
    return data;
  },

  /** POST / — create a custom category. */
  create: async (payload: CreateCategoryPayload) => {
    const { data } = await apiClient.post<ApiEnvelope<CreateCategoryResponse>>(
      CATEGORIES_BASE,
      payload
    );
    return data;
  },

  /** PATCH /:id — rename a category. */
  update: async (id: number | string, payload: UpdateCategoryPayload) => {
    const { data } = await apiClient.patch<ApiEnvelope<UpdateCategoryResponse>>(
      `${CATEGORIES_BASE}/${id}`,
      payload
    );
    return data;
  },

  /**
   * DELETE /:id
   * NOTE: only custom categories the user created can be deleted;
   * default (system) categories will be rejected by the backend.
   */
  remove: async (id: number | string) => {
    const { data } = await apiClient.delete<ApiEnvelope<null>>(`${CATEGORIES_BASE}/${id}`);
    return data;
  },
};
