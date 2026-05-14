export interface DeviceInfo {
  deviceId?: string;
  deviceType?: string;
  os?: string;
  appVersion?: string;
  browser?: string;
  userAgent?: string;
}

export interface SendOtpRequest {
  phone: string;
  deviceInfo?: DeviceInfo;
}

export interface SendOtpResponse {
  success: boolean;
  expiresIn: number;
}

export interface VerifyOtpRequest {
  phone: string;
  otp: string;
  deviceInfo?: DeviceInfo;
}

export interface VerifyOtpResponse {
  success: boolean;
  newUser: boolean;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    phone: string;
    email: string | null;
    first_name: string | null;
    last_name: string | null;
    created_at: string;
  };
}

export interface ResendOtpRequest {
  phone: string;
}

export interface ResendOtpResponse {
  success: boolean;
  expiresIn: number;
}

export interface CheckMobileExistsRequest {
  phone: string;
}

export interface CheckMobileExistsResponse {
  exists: boolean;
  message: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
  retryAfter?: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: VerifyOtpResponse['user'] | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface AuthContextType extends AuthState {
  sendOtp: (phone: string, deviceInfo?: DeviceInfo) => Promise<SendOtpResponse>;
  verifyOtp: (phone: string, otp: string, deviceInfo?: DeviceInfo) => Promise<VerifyOtpResponse>;
  resendOtp: (phone: string) => Promise<ResendOtpResponse>;
  refreshAccessToken: (options?: { silent?: boolean }) => Promise<RefreshTokenResponse>;
  signOut: (accessToken?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfileName: (fullName: string) => Promise<void>;
  clearError: () => void;
}
