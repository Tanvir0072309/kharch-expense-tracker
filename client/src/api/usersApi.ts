import { apiClient } from '@/api/client';
import { ApiEnvelope } from '@/api/types';

/**
 * ===========================================================================
 * USERS API — thin wrappers around every /api/v1/users endpoint.
 * ===========================================================================
 * Each function does ONE http call and returns `response.data`
 * (the full envelope, matching the authApi.ts convention). No state,
 * no side effects — that belongs in a Redux slice.
 * `Authorization: Bearer <accessToken>` is attached automatically by
 * the apiClient request interceptor, so nothing to do here.
 * ===========================================================================
 */

const USERS_BASE = '/users';

// ---- Request/response types ----------------------------------------------

export interface User {
  id: number;
  name: string;
  email: string;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GetMeResponse {
  user: User;
}

export interface UpdateMePayload {
  name: string;
}
export interface UpdateMeResponse {
  user: User;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

// ---- Endpoint functions ---------------------------------------------------

export const usersApi = {
  /** GET /me — current user profile. */
  getMe: async () => {
    const { data } = await apiClient.get<ApiEnvelope<GetMeResponse>>(`${USERS_BASE}/me`);
    return data;
  },

  /** PATCH /me — only `name` is accepted by the backend, everything else is ignored. */
  updateMe: async (payload: UpdateMePayload) => {
    const { data } = await apiClient.patch<ApiEnvelope<UpdateMeResponse>>(
      `${USERS_BASE}/me`,
      payload
    );
    return data;
  },

  /**
   * POST /me/change-password
   * NOTE: on success the backend revokes every refresh token for this user.
   * The caller (e.g. an auth/user slice) should clear stored tokens and
   * force the user back to the login screen after this resolves.
   */
  changePassword: async (payload: ChangePasswordPayload) => {
    const { data } = await apiClient.post<ApiEnvelope<null>>(
      `${USERS_BASE}/me/change-password`,
      payload
    );
    return data;
  },
};
