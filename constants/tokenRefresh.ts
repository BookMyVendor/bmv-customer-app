/**
 * Proactive refresh runs when the access token is within this many seconds of expiry.
 * Override with EXPO_PUBLIC_ACCESS_TOKEN_REFRESH_BUFFER_SEC (integer seconds).
 */
export const PROACTIVE_REFRESH_BUFFER_SEC = (() => {
  const raw = process.env.EXPO_PUBLIC_ACCESS_TOKEN_REFRESH_BUFFER_SEC;
  if (raw != null && raw !== '') {
    const n = Number.parseInt(raw, 10);
    if (Number.isFinite(n) && n >= 30 && n <= 86400) {
      return n;
    }
  }
  return 180;
})();
