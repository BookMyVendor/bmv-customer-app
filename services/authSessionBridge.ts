export type AuthBridgePayload =
  | { kind: 'tokens'; accessToken: string; refreshToken: string }
  | { kind: 'cleared' };

type AuthBridgeListener = (payload: AuthBridgePayload) => void;

let listener: AuthBridgeListener | null = null;

export function setAuthBridgeListener(cb: AuthBridgeListener | null): void {
  listener = cb;
}

export function emitAuthTokensRefreshed(accessToken: string, refreshToken: string): void {
  listener?.({ kind: 'tokens', accessToken, refreshToken });
}

export function emitAuthSessionCleared(): void {
  listener?.({ kind: 'cleared' });
}
