import AsyncStorage from '@react-native-async-storage/async-storage';

export const ACCESS_TOKEN_KEY = '@bmv_access_token';
export const REFRESH_TOKEN_KEY = '@bmv_refresh_token';
export const USER_KEY = '@bmv_user';
/** Set to "1" when the user must complete their display name on login */
export const NEEDS_PROFILE_SETUP_KEY = '@bmv_needs_profile_setup';
/** Epoch ms when the access token should be treated as expired */
export const ACCESS_TOKEN_EXPIRES_AT_KEY = '@bmv_access_token_expires_at';

export async function persistSessionTokens(
  accessToken: string,
  refreshToken: string,
  expiresInSec: number
): Promise<void> {
  const ttlSec = Math.max(1, Math.floor(expiresInSec));
  const expiresAt = Date.now() + ttlSec * 1000;
  await AsyncStorage.multiSet([
    [ACCESS_TOKEN_KEY, accessToken],
    [REFRESH_TOKEN_KEY, refreshToken],
    [ACCESS_TOKEN_EXPIRES_AT_KEY, String(expiresAt)],
  ]);
}

export async function clearAuthStorage(): Promise<void> {
  await AsyncStorage.multiRemove([
    ACCESS_TOKEN_KEY,
    REFRESH_TOKEN_KEY,
    USER_KEY,
    NEEDS_PROFILE_SETUP_KEY,
    ACCESS_TOKEN_EXPIRES_AT_KEY,
  ]);
}
