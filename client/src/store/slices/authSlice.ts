import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

import {
  authApi,
  AuthUser,
  ForgotPasswordPayload,
  LoginPayload,
  ResendOtpPayload,
  ResetPasswordPayload,
  SignupPayload,
  VerifyLoginOtpPayload,
  VerifyResetOtpPayload,
  VerifySignupOtpPayload,
} from '@/api/authApi';
import { ApiErrorShape, registerAuthLogoutHandler } from '@/api/client';
import { tokenStorage } from '@/api/storage';
import { ChangePasswordPayload, UpdateMePayload, usersApi } from '@/api/usersApi';

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

type PendingAction = 'signup' | 'login' | 'reset' | null;

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  /** Which OTP flow is currently in progress, so the OTP screen knows what to do next. */
  pendingAction: PendingAction;
  pendingEmail: string | null;
  loading: boolean;
  resending: boolean;
  error: string | null;
  /** Set to true once reset-password OTP has been verified, gating the reset-password screen. */
  resetOtpVerified: boolean;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  pendingAction: null,
  pendingEmail: null,
  loading: false,
  resending: false,
  error: null,
  resetOtpVerified: false,
};

const extractErrorMessage = (err: unknown): string => {
  const shaped = err as ApiErrorShape;
  return shaped?.message || 'Something went wrong. Please try again.';
};

// ---------------------------------------------------------------------------
// Thunks — one per backend endpoint
// ---------------------------------------------------------------------------

export const signup = createAsyncThunk('auth/signup', async (payload: SignupPayload, { rejectWithValue }) => {
  try {
    const res = await authApi.signup(payload);
    return res.data; // { userId, email }
  } catch (err) {
    return rejectWithValue(extractErrorMessage(err));
  }
});

export const verifySignupOtp = createAsyncThunk(
  'auth/verifySignupOtp',
  async (payload: VerifySignupOtpPayload, { rejectWithValue }) => {
    try {
      const res = await authApi.verifySignupOtp(payload);
      await tokenStorage.setTokens(res.data.accessToken, res.data.refreshToken);
      return res.data; // { user, accessToken, refreshToken, ... }
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err));
    }
  }
);

export const login = createAsyncThunk('auth/login', async (payload: LoginPayload, { rejectWithValue }) => {
  try {
    const res = await authApi.login(payload);
    return res.data; // { userId, email }
  } catch (err) {
    return rejectWithValue(extractErrorMessage(err));
  }
});

export const verifyLoginOtp = createAsyncThunk(
  'auth/verifyLoginOtp',
  async (payload: VerifyLoginOtpPayload, { rejectWithValue }) => {
    try {
      const res = await authApi.verifyLoginOtp(payload);
      await tokenStorage.setTokens(res.data.accessToken, res.data.refreshToken);
      return res.data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err));
    }
  }
);

export const logoutUser = createAsyncThunk('auth/logout', async (_: void, { rejectWithValue }) => {
  try {
    const refreshToken = await tokenStorage.getRefreshToken();
    if (refreshToken) {
      await authApi.logout({ refreshToken });
    }
    await tokenStorage.clearTokens();
    return true;
  } catch (err) {
    // Even if the server call fails, clear local tokens so the user isn't stuck.
    await tokenStorage.clearTokens();
    return rejectWithValue(extractErrorMessage(err));
  }
});

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (payload: ForgotPasswordPayload, { rejectWithValue }) => {
    try {
      const res = await authApi.forgotPassword(payload);
      return res.data; // { email }
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err));
    }
  }
);

export const verifyResetOtp = createAsyncThunk(
  'auth/verifyResetOtp',
  async (payload: VerifyResetOtpPayload, { rejectWithValue }) => {
    try {
      const res = await authApi.verifyResetOtp(payload);
      return { ...res.data, email: payload.email, otp: payload.otp };
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err));
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (payload: ResetPasswordPayload, { rejectWithValue }) => {
    try {
      const res = await authApi.resetPassword(payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err));
    }
  }
);

export const resendOtp = createAsyncThunk(
  'auth/resendOtp',
  async (payload: ResendOtpPayload, { rejectWithValue }) => {
    try {
      const res = await authApi.resendOtp(payload);
      return res.data; // { email, expiresIn }
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err));
    }
  }
);

/** /users/me returns `isEmailVerified`; normalize onto the existing AuthUser shape used by state.user. */
function toAuthUser(user: { id: number; name: string; email: string; isEmailVerified: boolean }): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    is_email_verified: user.isEmailVerified,
  };
}

/** Fetches the full profile from GET /users/me (used on session restore and after edits). */
export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_: void, { rejectWithValue }) => {
    try {
      const res = await usersApi.getMe();
      return toAuthUser(res.data.user); // { id, name, email, isEmailVerified, createdAt, updatedAt }
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err));
    }
  }
);

/** PATCH /users/me — only `name` is accepted by the backend. */
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (payload: UpdateMePayload, { rejectWithValue }) => {
    try {
      const res = await usersApi.updateMe(payload);
      return toAuthUser(res.data.user);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err));
    }
  }
);

/**
 * POST /users/me/change-password
 * NOTE: on success the backend revokes every refresh token, so this thunk
 * also clears local tokens and logs the user out — the screen that calls
 * it should navigate back to login afterwards.
 */
export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (payload: ChangePasswordPayload, { rejectWithValue }) => {
    try {
      await usersApi.changePassword(payload);
      await tokenStorage.clearTokens();
      return true;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err));
    }
  }
);

/** Rehydrates auth state on app start by checking for a stored access token. */
export const restoreSession = createAsyncThunk('auth/restoreSession', async (_: void, { dispatch }) => {
  const accessToken = await tokenStorage.getAccessToken();
  if (!accessToken) {
    return { accessToken: null };
  }

  try {
    // Token exists locally — confirm it's still valid and hydrate the real profile.
    await dispatch(fetchCurrentUser()).unwrap();
    return { accessToken };
  } catch {
    // Access token expired/invalid and refresh (handled by the axios
    // interceptor) also failed — treat this as logged out.
    await tokenStorage.clearTokens();
    return { accessToken: null };
  }
});

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
    /** Used by the axios interceptor (via registerAuthLogoutHandler) when a refresh fails. */
    forceLogout(state) {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // -------- signup --------
      .addCase(signup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signup.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingAction = 'signup';
        state.pendingEmail = action.payload.email;
      })
      .addCase(signup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // -------- verify signup otp --------
      .addCase(verifySignupOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifySignupOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
        state.pendingAction = null;
        state.pendingEmail = null;
      })
      .addCase(verifySignupOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // -------- login --------
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingAction = 'login';
        state.pendingEmail = action.payload.email;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // -------- verify login otp --------
      .addCase(verifyLoginOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyLoginOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
        state.pendingAction = null;
        state.pendingEmail = null;
      })
      .addCase(verifyLoginOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // -------- logout --------
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
      })
      .addCase(logoutUser.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
      })

      // -------- forgot password --------
      .addCase(forgotPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingAction = 'reset';
        state.pendingEmail = action.payload.email;
        state.resetOtpVerified = false;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // -------- verify reset otp --------
      .addCase(verifyResetOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyResetOtp.fulfilled, (state) => {
        state.loading = false;
        state.resetOtpVerified = true;
      })
      .addCase(verifyResetOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // -------- reset password --------
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.loading = false;
        state.pendingAction = null;
        state.pendingEmail = null;
        state.resetOtpVerified = false;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // -------- resend otp --------
      .addCase(resendOtp.pending, (state) => {
        state.resending = true;
        state.error = null;
      })
      .addCase(resendOtp.fulfilled, (state) => {
        state.resending = false;
      })
      .addCase(resendOtp.rejected, (state, action) => {
        state.resending = false;
        state.error = action.payload as string;
      })

      // -------- restore session --------
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = !!action.payload.accessToken;
      })

      // -------- fetch current user (GET /users/me) --------
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
      })

      // -------- update profile (PATCH /users/me) --------
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // -------- change password (POST /users/me/change-password) --------
      // Backend revokes all refresh tokens on success, so this always ends in a logout.
      .addCase(changePassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearAuthError, forceLogout } = authSlice.actions;
export default authSlice.reducer;

// Wire the axios 401-refresh-failure handler to this slice's forceLogout.
// Call this once, e.g. from the Redux store setup file.
export function attachAuthLogoutHandler(dispatch: (action: any) => void) {
  registerAuthLogoutHandler(() => dispatch(forceLogout()));
}
