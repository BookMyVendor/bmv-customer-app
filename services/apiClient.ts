import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

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

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`[API RESPONSE] ${response.config.method?.toUpperCase()} ${response.config.url}`);
    console.log('[API RESPONSE] Status:', response.status);
    console.log('[API RESPONSE] Data:', JSON.stringify(response.data));
    return response;
  },
  (error: AxiosError) => {
    console.error(`[API RESPONSE ERROR] ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
    console.error('[API RESPONSE ERROR] Status:', error.response?.status);
    console.error('[API RESPONSE ERROR] Data:', JSON.stringify(error.response?.data));
    console.error('[API RESPONSE ERROR] Message:', error.message);
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
