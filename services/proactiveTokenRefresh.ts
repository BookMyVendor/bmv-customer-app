import AsyncStorage from '@react-native-async-storage/async-storage';
import { ACCESS_TOKEN_EXPIRES_AT_KEY } from '@/constants/authStorage';
import { PROACTIVE_REFRESH_BUFFER_SEC } from '@/constants/tokenRefresh';

const MAX_SET_TIMEOUT_MS = 2147483647;

let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
let refreshHandler: (() => Promise<void>) | null = null;
let proactiveRunInFlight = false;

export function setProactiveRefreshHandler(handler: (() => Promise<void>) | null): void {
  refreshHandler = handler;
}

export function clearProactiveRefreshSchedule(): void {
  if (timeoutHandle != null) {
    clearTimeout(timeoutHandle);
    timeoutHandle = null;
  }
}

async function runProactiveRefresh(): Promise<void> {
  timeoutHandle = null;
  if (!refreshHandler || proactiveRunInFlight) {
    await rescheduleProactiveTokenRefresh();
    return;
  }
  proactiveRunInFlight = true;
  try {
    await refreshHandler();
  } catch {
    // Session cleared on failure inside refresh / api layer
  } finally {
    proactiveRunInFlight = false;
    await rescheduleProactiveTokenRefresh();
  }
}

/**
 * Schedules a single `setTimeout` to refresh shortly before access token expiry.
 */
export async function rescheduleProactiveTokenRefresh(): Promise<void> {
  clearProactiveRefreshSchedule();

  const expiresAtStr = await AsyncStorage.getItem(ACCESS_TOKEN_EXPIRES_AT_KEY);
  if (!expiresAtStr || !refreshHandler) {
    return;
  }

  const expiresAt = Number(expiresAtStr);
  if (!Number.isFinite(expiresAt)) {
    return;
  }

  const bufferMs = Math.max(30_000, PROACTIVE_REFRESH_BUFFER_SEC * 1000);
  const delayMs = expiresAt - bufferMs - Date.now();

  if (delayMs <= 0) {
    timeoutHandle = setTimeout(() => {
      void runProactiveRefresh();
    }, 0);
    return;
  }

  timeoutHandle = setTimeout(
    () => {
      void runProactiveRefresh();
    },
    Math.min(delayMs, MAX_SET_TIMEOUT_MS)
  );
}

/**
 * When the app returns to foreground, refresh if we're already inside the buffer window.
 */
export async function refreshIfAccessTokenInBufferWindow(): Promise<void> {
  const expiresAtStr = await AsyncStorage.getItem(ACCESS_TOKEN_EXPIRES_AT_KEY);
  if (!expiresAtStr || !refreshHandler) {
    return;
  }
  const expiresAt = Number(expiresAtStr);
  if (!Number.isFinite(expiresAt)) {
    return;
  }
  const bufferMs = Math.max(30_000, PROACTIVE_REFRESH_BUFFER_SEC * 1000);
  if (Date.now() >= expiresAt - bufferMs) {
    if (!proactiveRunInFlight) {
      proactiveRunInFlight = true;
      try {
        await refreshHandler();
      } catch {
        // cleared elsewhere
      } finally {
        proactiveRunInFlight = false;
      }
    }
  }
  await rescheduleProactiveTokenRefresh();
}
