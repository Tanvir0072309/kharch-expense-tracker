import { apiClient } from '@/api/client';

/**
 * ===========================================================================
 * AUTH API — thin wrappers around every backend auth endpoint.
 * ===========================================================================
 * Each function does ONE http call and returns `response.data.data`
 * (the `data` payload documented in the backend README). No state,
 * no side effects — that belongs in the Redux slice.
 * ===========================================================================
 */

const AUTH_BASE = '/auth';

// ---- Request/response types (from backend README) -----------------------

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
}
export interface SignupResponse {
  userId: number;
  email: string;
}

export interface VerifySignupOtpPayload {
  email: string;
  otp: string;
}
export interface AuthUser {
  id: number;
  name: string;
  email: string;
  is_email_verified: boolean;
}
export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: string;
  refreshTokenExpiresAt: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}
export interface LoginResponse {
  userId: number;
  email: string;
}

export interface VerifyLoginOtpPayload {
  email: string;
  otp: string;
}
export interface VerifyLoginOtpResponse {
  userId: number;
  email: string;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: string;
  refreshTokenExpiresAt: string;
}

export interface RefreshPayload {
  refreshToken: string;
}
export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: string;
  refreshTokenExpiresAt: string;
}

export interface LogoutPayload {
  refreshToken: string;
}

export interface ForgotPasswordPayload {
  email: string;
}
export interface ForgotPasswordResponse {
  email: string;
}

export interface VerifyResetOtpPayload {
  email: string;
  otp: string;
}

export interface ResetPasswordPayload {
  email: string;
  otp: string;
  password: string;
}

export type ResendOtpType = 'signup' | 'login' | 'reset';
export interface ResendOtpPayload {
  email: string;
  type: ResendOtpType;
}
export interface ResendOtpResponse {
  email: string;
  expiresIn: number;
}

// Generic envelope every endpoint returns: { success, message, data }
interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

// ---- Endpoint functions ---------------------------------------------------

export const authApi = {
  signup: async (payload: SignupPayload) => {
    const { data } = await apiClient.post<ApiEnvelope<SignupResponse>>(
      `${AUTH_BASE}/signup`,
      payload
    );
    return data;
  },

  verifySignupOtp: async (payload: VerifySignupOtpPayload) => {
    const { data } = await apiClient.post<ApiEnvelope<AuthSession>>(
      `${AUTH_BASE}/verify-signup-otp`,
      payload
    );
    return data;
  },

  login: async (payload: LoginPayload) => {
    const { data } = await apiClient.post<ApiEnvelope<LoginResponse>>(
      `${AUTH_BASE}/login`,
      payload
    );
    return data;
  },

  verifyLoginOtp: async (payload: VerifyLoginOtpPayload) => {
    const { data } = await apiClient.post<ApiEnvelope<VerifyLoginOtpResponse>>(
      `${AUTH_BASE}/verify-login-otp`,
      payload
    );
    return data;
  },

  refresh: async (payload: RefreshPayload) => {
    const { data } = await apiClient.post<ApiEnvelope<RefreshResponse>>(
      `${AUTH_BASE}/refresh`,
      payload
    );
    return data;
  },

  logout: async (payload: LogoutPayload) => {
    const { data } = await apiClient.post<ApiEnvelope<null>>(`${AUTH_BASE}/logout`, payload);
    return data;
  },

  forgotPassword: async (payload: ForgotPasswordPayload) => {
    const { data } = await apiClient.post<ApiEnvelope<ForgotPasswordResponse>>(
      `${AUTH_BASE}/forgot-password`,
      payload
    );
    return data;
  },

  verifyResetOtp: async (payload: VerifyResetOtpPayload) => {
    const { data } = await apiClient.post<ApiEnvelope<{ message: string }>>(
      `${AUTH_BASE}/verify-reset-otp`,
      payload
    );
    return data;
  },

  resetPassword: async (payload: ResetPasswordPayload) => {
    const { data } = await apiClient.post<ApiEnvelope<null>>(
      `${AUTH_BASE}/reset-password`,
      payload
    );
    return data;
  },

  resendOtp: async (payload: ResendOtpPayload) => {
    const { data } = await apiClient.post<ApiEnvelope<ResendOtpResponse>>(
      `${AUTH_BASE}/resend-otp`,
      payload
    );
    return data;
  },
};
