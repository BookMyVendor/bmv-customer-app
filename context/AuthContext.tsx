import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AuthState,
  AuthContextType,
  DeviceInfo,
  SendOtpResponse,
  VerifyOtpResponse,
  ResendOtpResponse,
  RefreshTokenResponse,
} from '@/types/auth.types';
import { sendOtp, verifyOtp, resendOtp, signOut } from '@/services/authService';
import { getCustomerByPhone, updateMe } from '@/services/customerService';
import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  USER_KEY,
  ACCESS_TOKEN_EXPIRES_AT_KEY,
  clearAuthStorage,
  persistSessionTokens,
} from '@/constants/authStorage';
import { setAuthBridgeListener } from '@/services/authSessionBridge';
import { refreshSessionTokens } from '@/services/apiClient';
import {
  setProactiveRefreshHandler,
  clearProactiveRefreshSchedule,
  rescheduleProactiveTokenRefresh,
  refreshIfAccessTokenInBufferWindow,
} from '@/services/proactiveTokenRefresh';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type RefreshFn = (options?: { silent?: boolean }) => Promise<RefreshTokenResponse>;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    accessToken: null,
    refreshToken: null,
    isLoading: true,
    error: null,
  });

  const refreshForProactiveRef = useRef<RefreshFn | null>(null);

  useEffect(() => {
    loadAuthData();
  }, []);

  useEffect(() => {
    setAuthBridgeListener((payload) => {
      if (payload.kind === 'tokens') {
        setAuthState((prev) => ({
          ...prev,
          accessToken: payload.accessToken,
          refreshToken: payload.refreshToken,
        }));
        void rescheduleProactiveTokenRefresh();
        return;
      }
      clearProactiveRefreshSchedule();
      setAuthState({
        isAuthenticated: false,
        user: null,
        accessToken: null,
        refreshToken: null,
        isLoading: false,
        error: null,
      });
    });
    return () => setAuthBridgeListener(null);
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void refreshIfAccessTokenInBufferWindow();
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (authState.isAuthenticated && authState.accessToken && !authState.isLoading) {
      void rescheduleProactiveTokenRefresh();
    }
    if (!authState.isAuthenticated) {
      clearProactiveRefreshSchedule();
    }
  }, [authState.isAuthenticated, authState.accessToken, authState.isLoading]);

  useEffect(() => {
    if (!authState.isAuthenticated || authState.isLoading) {
      return;
    }
    let cancelled = false;
    (async () => {
      const exp = await AsyncStorage.getItem(ACCESS_TOKEN_EXPIRES_AT_KEY);
      if (exp || cancelled) {
        return;
      }
      try {
        await refreshSessionTokens();
      } catch {
        // Invalid / rotated refresh without stored expiry — session cleared in client
      } finally {
        if (!cancelled) {
          await rescheduleProactiveTokenRefresh();
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authState.isAuthenticated, authState.isLoading]);

  useEffect(() => {
    setProactiveRefreshHandler(async () => {
      await refreshForProactiveRef.current?.({ silent: true });
    });
    return () => {
      setProactiveRefreshHandler(null);
      clearProactiveRefreshSchedule();
    };
  }, []);

  const loadAuthData = async () => {
    try {
      const [accessToken, refreshToken, userStr] = await Promise.all([
        AsyncStorage.getItem(ACCESS_TOKEN_KEY),
        AsyncStorage.getItem(REFRESH_TOKEN_KEY),
        AsyncStorage.getItem(USER_KEY),
      ]);

      if (accessToken && refreshToken && userStr) {
        const user = JSON.parse(userStr);
        setAuthState({
          isAuthenticated: true,
          user,
          accessToken,
          refreshToken,
          isLoading: false,
          error: null,
        });
      } else {
        setAuthState({
          isAuthenticated: false,
          user: null,
          accessToken: null,
          refreshToken: null,
          isLoading: false,
          error: null,
        });
      }
    } catch (error) {
      setAuthState({
        isAuthenticated: false,
        user: null,
        accessToken: null,
        refreshToken: null,
        isLoading: false,
        error: 'Failed to load auth data',
      });
    }
  };

  const handleSendOtp = async (
    phone: string,
    deviceInfo?: DeviceInfo
  ): Promise<SendOtpResponse> => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await sendOtp(phone, deviceInfo);
      setAuthState((prev) => ({ ...prev, isLoading: false }));
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send OTP';
      setAuthState((prev) => ({ ...prev, isLoading: false, error: errorMessage }));
      throw error;
    }
  };

  const handleVerifyOtp = async (
    phone: string,
    otp: string,
    deviceInfo?: DeviceInfo,
    fullName?: string
  ): Promise<VerifyOtpResponse> => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await verifyOtp(phone, otp, deviceInfo);
      
      // Call customers-by-phone as requested
      const customerResponse = await getCustomerByPhone(phone);
      
      // If fullName is provided, call customers-me-update
      if (fullName) {
        await updateMe({
          name: fullName,
          email: response.user.email || undefined,
          registration_source: 'mobile',
          // other fields as null as per payload example
          address: null,
          city: null,
          state: null,
          pincode: null,
        } as any, response.accessToken);
      }

      // Re-fetch customer data if updated or just use the response
      const updatedCustomer = fullName ? await getCustomerByPhone(phone) : customerResponse;

      const enrichedUser = {
        ...response.user,
        first_name: updatedCustomer.customer?.name?.split(' ')[0] || response.user.first_name,
        last_name: updatedCustomer.customer?.name?.split(' ').slice(1).join(' ') || response.user.last_name,
        phone: updatedCustomer.customer?.phone || response.user.phone,
        created_at: updatedCustomer.customer?.created_at || response.user.created_at,
      };
      
      await persistSessionTokens(
        response.accessToken,
        response.refreshToken,
        response.expiresIn
      );
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(enrichedUser));

      setAuthState({
        isAuthenticated: true,
        user: enrichedUser,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        isLoading: false,
        error: null,
      });

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to verify OTP';
      setAuthState((prev) => ({ ...prev, isLoading: false, error: errorMessage }));
      throw error;
    }
  };

  const handleResendOtp = async (phone: string): Promise<ResendOtpResponse> => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await resendOtp(phone);
      setAuthState((prev) => ({ ...prev, isLoading: false }));
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to resend OTP';
      setAuthState((prev) => ({ ...prev, isLoading: false, error: errorMessage }));
      throw error;
    }
  };

  const handleLogout = useCallback(async () => {
    clearProactiveRefreshSchedule();
    try {
      await clearAuthStorage();

      setAuthState({
        isAuthenticated: false,
        user: null,
        accessToken: null,
        refreshToken: null,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setAuthState((prev) => ({
        ...prev,
        error: 'Failed to logout',
      }));
    }
  }, []);

  const handleRefreshAccessToken = useCallback(
    async (options?: { silent?: boolean }): Promise<RefreshTokenResponse> => {
      const stored = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      if (!stored) {
        throw new Error('No refresh token available');
      }

      if (!options?.silent) {
        setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));
      }
      try {
        const result = await refreshSessionTokens();
        if (!options?.silent) {
          setAuthState((prev) => ({
            ...prev,
            isLoading: false,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
          }));
        }
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to refresh token';
        if (!options?.silent) {
          setAuthState((prev) => ({ ...prev, isLoading: false, error: errorMessage }));
        }
        throw error;
      }
    },
    []
  );

  refreshForProactiveRef.current = handleRefreshAccessToken;

  const handleSignOut = async (accessToken?: string) => {
    try {
      await signOut(accessToken);
      await handleLogout();
    } catch (error) {
      await handleLogout();
    }
  };

  const handleUpdateProfileName = async (fullName: string) => {
    if (!authState.accessToken || !authState.user) {
      throw new Error('User not authenticated');
    }

    try {
      setAuthState((prev) => ({ ...prev, isLoading: true }));
      
      await updateMe({
        name: fullName,
        email: authState.user.email || undefined,
        registration_source: 'mobile',
        address: null,
        city: null,
        state: null,
        pincode: null,
      } as any, authState.accessToken);

      // Re-fetch customer data to get enriched user
      const updatedCustomer = await getCustomerByPhone(authState.user.phone);
      
      const enrichedUser = {
        ...authState.user,
        first_name: updatedCustomer.customer?.name?.split(' ')[0] || authState.user.first_name,
        last_name: updatedCustomer.customer?.name?.split(' ').slice(1).join(' ') || authState.user.last_name,
      };

      await AsyncStorage.setItem(USER_KEY, JSON.stringify(enrichedUser));

      setAuthState((prev) => ({
        ...prev,
        user: enrichedUser,
        isLoading: false,
      }));
    } catch (error) {
      setAuthState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const clearError = () => {
    setAuthState((prev) => ({ ...prev, error: null }));
  };

  const contextValue: AuthContextType = {
    ...authState,
    sendOtp: handleSendOtp,
    verifyOtp: handleVerifyOtp,
    resendOtp: handleResendOtp,
    refreshAccessToken: handleRefreshAccessToken,
    signOut: handleSignOut,
    logout: handleLogout,
    updateProfileName: handleUpdateProfileName,
    clearError,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
