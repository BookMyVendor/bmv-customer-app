import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ACCESS_TOKEN_KEY,
  clearAuthStorage,
  persistSessionTokens,
  REFRESH_TOKEN_KEY,
  ACCESS_TOKEN_EXPIRES_AT_KEY,
} from '@/constants/authStorage';
import { PROACTIVE_REFRESH_BUFFER_SEC } from '@/constants/tokenRefresh';
import { emitAuthSessionCleared, emitAuthTokensRefreshed } from '@/services/authSessionBridge';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://49.248.202.218:5000/';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  retryAfter?: number;
}

const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

/** No interceptors — used only for refresh to avoid re-entry / loops */
const noAuthClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

const SKIP_REFRESH_401_URL_PARTS = [
  'auth-customer-send-otp',
  'auth-customer-verify-otp',
  'auth-customer-resend-otp',
  'auth-customer-check-number',
  'auth-refresh-token',
  'auth-sign-out',
];

let refreshInFlight: Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> | null =
  null;

function shouldAttemptRefreshForUrl(url: string | undefined): boolean {
  if (!url) return false;
  return !SKIP_REFRESH_401_URL_PARTS.some((fragment) => url.includes(fragment));
}

function getRequestAuthHeader(config: InternalAxiosRequestConfig): string | undefined {
  const headers = config.headers;
  if (!headers) return undefined;
  const h = headers as {
    get?: (name: string) => string | undefined;
    Authorization?: string;
    authorization?: string;
  };
  return (
    h.get?.('Authorization') ??
    h.Authorization ??
    h.authorization
  );
}

function setRequestAuthHeader(config: InternalAxiosRequestConfig, accessToken: string): void {
  const bearer = `Bearer ${accessToken}`;
  const headers = config.headers;
  if (!headers) {
    config.headers = { Authorization: bearer } as InternalAxiosRequestConfig['headers'];
    return;
  }
  const h = headers as { set?: (key: string, value: string) => void; Authorization?: string };
  if (typeof h.set === 'function') {
    h.set('Authorization', bearer);
  } else {
    h.Authorization = bearer;
  }
}

async function doTokenRefresh(): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
  const storedRefresh = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  if (!storedRefresh) {
    await clearAuthStorage();
    emitAuthSessionCleared();
    throw new Error('No refresh token');
  }

  try {
    const res = await noAuthClient.post<Record<string, unknown>>('functions/v1/auth-refresh-token', {
      refreshToken: storedRefresh,
    });

    const data = res.data;
    if (data && typeof data === 'object' && 'success' in data && data.success === false) {
      throw new Error((data.error as string) || 'Refresh failed');
    }

    const accessToken = data?.accessToken as string | undefined;
    const refreshToken = (data?.refreshToken as string | undefined) || storedRefresh;

    if (!accessToken) {
      throw new Error('Invalid refresh response');
    }

    const expiresInSec =
      typeof data?.expiresIn === 'number' && Number.isFinite(data.expiresIn) ? data.expiresIn : 3600;

    await persistSessionTokens(accessToken, refreshToken, expiresInSec);

    emitAuthTokensRefreshed(accessToken, refreshToken);
    return { accessToken, refreshToken, expiresIn: expiresInSec };
  } catch (e) {
    await clearAuthStorage();
    emitAuthSessionCleared();
    throw e;
  }
}

function ensureTokenRefresh(): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
  if (!refreshInFlight) {
    refreshInFlight = doTokenRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

/** Shared refresh used by 401 retry, proactive refresh, and manual refresh — single-flight. */
export function refreshSessionTokens(): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  return ensureTokenRefresh();
}

function getRefreshBufferMs(): number {
  return Math.max(30_000, PROACTIVE_REFRESH_BUFFER_SEC * 1000);
}

/**
 * Refresh access token before it expires (single-flight). Used on every protected request
 * and by proactive scheduling so foreground/background transitions stay authenticated.
 */
export async function ensureAccessTokenFreshBeforeRequest(): Promise<void> {
  const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) {
    return;
  }

  const expiresAtStr = await AsyncStorage.getItem(ACCESS_TOKEN_EXPIRES_AT_KEY);
  const bufferMs = getRefreshBufferMs();
  const expiresAt = expiresAtStr ? Number(expiresAtStr) : NaN;
  const needsRefresh =
    !expiresAtStr || !Number.isFinite(expiresAt) || Date.now() >= expiresAt - bufferMs;

  if (needsRefresh) {
    await ensureTokenRefresh();
  }
}

apiClient.interceptors.request.use(
  (config) => {
    console.log(`[API REQUEST] ${config.method?.toUpperCase()} ${config.url}`);
    console.log('[API REQUEST] Headers:', JSON.stringify(config.headers));
    if (config.data) {
      console.log('[API REQUEST] Body:', JSON.stringify(config.data));
    }
    return config;
  },
  (error) => {
    console.error('[API REQUEST ERROR]', error);
    return Promise.reject(error);
  }
);

/** Runs before logging: proactive refresh + always attach latest access token from storage. */
apiClient.interceptors.request.use(
  async (config) => {
    if (!shouldAttemptRefreshForUrl(config.url)) {
      return config;
    }
    try {
      await ensureAccessTokenFreshBeforeRequest();
      const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      if (accessToken) {
        setRequestAuthHeader(config, accessToken);
      }
    } catch {
      // Session cleared in doTokenRefresh — request will 401 and user is sent to login
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`[API RESPONSE] ${response.config.method?.toUpperCase()} ${response.config.url}`);
    console.log('[API RESPONSE] Status:', response.status);
    console.log('[API RESPONSE] Data:', JSON.stringify(response.data));
    return response;
  },
  async (error: AxiosError) => {
    console.error(`[API RESPONSE ERROR] ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
    console.error('[API RESPONSE ERROR] Status:', error.response?.status);
    console.error('[API RESPONSE ERROR] Data:', JSON.stringify(error.response?.data));
    console.error('[API RESPONSE ERROR] Message:', error.message);

    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;

    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      shouldAttemptRefreshForUrl(originalRequest.url)
    ) {
      const hadAuth = !!getRequestAuthHeader(originalRequest);
      if (hadAuth) {
        originalRequest._retry = true;
        try {
          const tokens = await ensureTokenRefresh();
          setRequestAuthHeader(originalRequest, tokens.accessToken);
          return apiClient.request(originalRequest);
        } catch {
          return Promise.reject(error);
        }
      }
    }

    return Promise.reject(error);
  }
);

export async function apiRequest<T>(
  endpoint: string,
  options: AxiosRequestConfig = {}
): Promise<T> {
  const response = await apiClient.request<T>({
    url: endpoint,
    ...options,
  });

  if (response.data && typeof response.data === 'object' && 'success' in response.data) {
    const apiResponse = response.data as ApiResponse<T>;
    if (!apiResponse.success) {
      throw {
        success: false,
        error: apiResponse.error || 'An error occurred',
        code: apiResponse.code,
        retryAfter: apiResponse.retryAfter,
      };
    }
  }

  return response.data;
}

export async function apiGet<T>(endpoint: string, headers?: any): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'GET',
    headers,
  });
}

export async function apiPost<T>(
  endpoint: string,
  body: any,
  headers?: any
): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    headers,
    data: body,
  });
}

export async function apiPut<T>(
  endpoint: string,
  body: any,
  headers?: any
): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'PUT',
    headers,
    data: body,
  });
}

export async function apiDelete<T>(endpoint: string, headers?: any): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'DELETE',
    headers,
  });
}

export default apiClient;
