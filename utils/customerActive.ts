import type { Customer } from '@/types/customer.types';
import type { ApiError } from '@/types/auth.types';

export const INACTIVE_CUSTOMER_MESSAGE =
  'Your account has been deactivated. Please contact BookMyVenue support to reactivate your account.';

export const INACTIVE_ACCOUNT_ALERT_TITLE = 'Account Deactivated';

export function isCustomerInactive(customer: Pick<Customer, 'is_active'> | null | undefined): boolean {
  return customer?.is_active === false;
}

function extractApiErrorPayload(error: unknown): ApiError | null {
  const axiosLike = error as { response?: { data?: Record<string, unknown> } };
  const data = axiosLike?.response?.data;
  if (data && typeof data === 'object') {
    const errText = data.error ?? data.message;
    const code = data.code;
    if (typeof errText === 'string' || typeof code === 'string') {
      return {
        success: false,
        error: typeof errText === 'string' ? errText : '',
        code: typeof code === 'string' ? code : undefined,
      };
    }
  }

  const direct = error as ApiError;
  if (direct && typeof direct === 'object' && ('error' in direct || 'code' in direct)) {
    return direct;
  }

  return null;
}

export function isInactiveAccountError(error: unknown): boolean {
  if (error == null) return false;

  if (typeof error === 'string') {
    return isInactiveAccountMessage(error);
  }

  const apiError = extractApiErrorPayload(error);
  if (apiError?.code === 'ACCOUNT_INACTIVE') return true;

  const message =
    (error instanceof Error ? error.message : undefined) ??
    apiError?.error ??
    '';

  return isInactiveAccountMessage(message);
}

function isInactiveAccountMessage(message: string): boolean {
  const normalized = message.trim().toLowerCase();
  if (!normalized) return false;
  if (message === INACTIVE_CUSTOMER_MESSAGE) return true;
  return normalized.includes('deactivated') || normalized.includes('account_inactive');
}

export function inactiveAccountError(): Error {
  return new Error(INACTIVE_CUSTOMER_MESSAGE);
}

export function resolveAuthError(error: unknown, fallback: string): Error {
  if (isInactiveAccountError(error)) {
    return inactiveAccountError();
  }
  const apiError = extractApiErrorPayload(error);
  if (apiError?.error) {
    return new Error(apiError.error);
  }
  if (error instanceof Error) {
    return error;
  }
  return new Error(fallback);
}

export function assertCustomerIsActive(customer: Pick<Customer, 'is_active'> | null | undefined): void {
  if (isCustomerInactive(customer)) {
    throw inactiveAccountError();
  }
}
