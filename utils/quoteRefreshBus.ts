type QuoteRefreshListener = (event: QuoteRefreshEvent) => void;

export interface QuoteRefreshEvent {
  /** Optimistic count bump before API refetch (e.g. 1 per successful submit). */
  delta?: number;
}

const listeners = new Set<QuoteRefreshListener>();

export function subscribeQuoteRefresh(listener: QuoteRefreshListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Call after a quote is successfully submitted so profile + my-quotes stay in sync. */
export function notifyQuotesChanged(delta = 1): void {
  const event: QuoteRefreshEvent = { delta };
  listeners.forEach((listener) => listener(event));
}
