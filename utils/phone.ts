/**
 * Indian customer phone → E.164 (+91XXXXXXXXXX).
 * Accepts 10-digit mobile, 91…, or +91….
 */
export function toCustomerPhoneE164(phone: string): string {
  const trimmed = (phone || '').trim();
  const digits = trimmed.replace(/\D/g, '');

  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return `+91${digits}`;
  }
  if (digits.startsWith('91') && digits.length >= 12) {
    return `+${digits}`;
  }
  if (trimmed.startsWith('+') && digits.length > 0) {
    return `+${digits}`;
  }
  if (digits.length > 0) {
    return `+${digits}`;
  }
  return trimmed;
}
