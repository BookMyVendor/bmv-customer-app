const PLACEHOLDER_NAMES = new Set(['user', 'customer', 'guest', 'unknown']);

function isPlaceholderName(name: string): boolean {
  const normalized = name.trim().toLowerCase();
  if (!normalized) return true;
  const firstWord = normalized.split(/\s+/)[0];
  return PLACEHOLDER_NAMES.has(firstWord);
}

/** True when the user has a real display name (customer record or auth profile). */
export function hasCompleteProfileName(
  customerName?: string | null,
  firstName?: string | null,
  lastName?: string | null
): boolean {
  const fromCustomer = customerName?.trim();
  if (fromCustomer && fromCustomer.length >= 2 && !isPlaceholderName(fromCustomer)) {
    return true;
  }

  const combined = [firstName, lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ');

  return combined.length >= 2 && !isPlaceholderName(combined);
}

export function resolveNeedsProfileSetup(
  customerName?: string | null,
  firstName?: string | null,
  lastName?: string | null
): boolean {
  return !hasCompleteProfileName(customerName, firstName, lastName);
}
