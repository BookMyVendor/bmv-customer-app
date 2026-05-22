import {
  SendOtpRequest,
  SendOtpResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
  ResendOtpRequest,
  ResendOtpResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  CheckMobileExistsRequest,
  CheckMobileExistsResponse,
  ApiError,
} from '@/types/auth.types';
import { resolveAuthError } from '@/utils/customerActive';
import { apiPost } from './apiClient';

export async function sendOtp(
  phone: string,
  deviceInfo?: SendOtpRequest['deviceInfo']
): Promise<SendOtpResponse> {
  try {
    console.log('[AUTH SERVICE] Sending OTP to phone:', phone);
    const response = await apiPost<SendOtpResponse>(
      'functions/v1/auth-customer-send-otp',
      { phone, deviceInfo }
    );
    console.log('[AUTH SERVICE] OTP sent successfully:', response);
    return response;
  } catch (error) {
    console.error('[AUTH SERVICE] Failed to send OTP:', error);
    throw resolveAuthError(error, 'Failed to send OTP');
  }
}

export async function verifyOtp(
  phone: string,
  otp: string,
  deviceInfo?: VerifyOtpRequest['deviceInfo']
): Promise<VerifyOtpResponse> {
  try {
    console.log('[AUTH SERVICE] Verifying OTP for phone:', phone);
    const response = await apiPost<VerifyOtpResponse>(
      'functions/v1/auth-customer-verify-otp',
      { phone, otp, deviceInfo }
    );
    console.log('[AUTH SERVICE] OTP verified successfully:', response);
    return response;
  } catch (error) {
    console.error('[AUTH SERVICE] Failed to verify OTP:', error);
    throw resolveAuthError(error, 'Failed to verify OTP');
  }
}

export async function checkMobileExists(
  phone: string
): Promise<CheckMobileExistsResponse> {
  try {
    console.log('[AUTH SERVICE] Checking if phone exists:', phone);
    const response = await apiPost<CheckMobileExistsResponse>(
      'functions/v1/auth-customer-check-number',
      { phone }
    );
    console.log('[AUTH SERVICE] Phone check result:', response);
    return response;
  } catch (error) {
    const apiError = error as ApiError;
    console.error('[AUTH SERVICE] Failed to check phone number:', apiError);
    throw new Error(apiError.error || 'Failed to check phone number');
  }
}

export async function resendOtp(phone: string): Promise<ResendOtpResponse> {
  try {
    console.log('[AUTH SERVICE] Resending OTP to phone:', phone);
    const response = await apiPost<ResendOtpResponse>(
      'functions/v1/auth-customer-resend-otp',
      { phone }
    );
    console.log('[AUTH SERVICE] OTP resent successfully:', response);
    return response;
  } catch (error) {
    console.error('[AUTH SERVICE] Failed to resend OTP:', error);
    throw resolveAuthError(error, 'Failed to resend OTP');
  }
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<RefreshTokenResponse> {
  try {
    console.log('[AUTH SERVICE] Refreshing access token');
    const response = await apiPost<RefreshTokenResponse>(
      'functions/v1/auth-refresh-token',
      { refreshToken }
    );
    console.log('[AUTH SERVICE] Access token refreshed successfully:', response);
    return response;
  } catch (error) {
    const apiError = error as ApiError;
    console.error('[AUTH SERVICE] Failed to refresh token:', apiError);
    throw new Error(apiError.error || 'Failed to refresh token');
  }
}

export async function signOut(accessToken?: string): Promise<void> {
  try {
    console.log('[AUTH SERVICE] Signing out');
    const headers: any = {};
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    await apiPost<void>(
      'functions/v1/auth-sign-out',
      {},
      headers
    );
    console.log('[AUTH SERVICE] Signed out successfully');
  } catch (error) {
    const apiError = error as ApiError;
    console.error('[AUTH SERVICE] Failed to sign out:', apiError);
    throw new Error(apiError.error || 'Failed to sign out');
  }
}
