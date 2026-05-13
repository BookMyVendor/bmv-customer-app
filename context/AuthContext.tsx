import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
import { sendOtp, verifyOtp, resendOtp, refreshAccessToken, signOut } from '@/services/authService';
import { getCustomerByPhone, updateMe } from '@/services/customerService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ACCESS_TOKEN_KEY = '@bmv_access_token';
const REFRESH_TOKEN_KEY = '@bmv_refresh_token';
const USER_KEY = '@bmv_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    accessToken: null,
    refreshToken: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    loadAuthData();
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
      
      await Promise.all([
        AsyncStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken),
        AsyncStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken),
        AsyncStorage.setItem(USER_KEY, JSON.stringify(enrichedUser)),
      ]);

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

  const handleRefreshAccessToken = async (): Promise<RefreshTokenResponse> => {
    if (!authState.refreshToken) {
      throw new Error('No refresh token available');
    }

    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await refreshAccessToken(authState.refreshToken);

      await Promise.all([
        AsyncStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken),
        AsyncStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken),
      ]);

      setAuthState((prev) => ({
        ...prev,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        isLoading: false,
      }));

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh token';
      setAuthState((prev) => ({ ...prev, isLoading: false, error: errorMessage }));
      await handleLogout();
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(ACCESS_TOKEN_KEY),
        AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
        AsyncStorage.removeItem(USER_KEY),
      ]);

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
  };

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
