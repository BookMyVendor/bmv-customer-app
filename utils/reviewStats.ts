import { Review } from '@/types/review.types';

export interface ReviewAggregate {
  averageRating: number | null;
  count: number;
}

/** Merge business reviews with the signed-in user's review when it is not in the list yet. */
export function mergeReviewsForStats(
  businessReviews: Review[],
  userReview: Review | null
): Review[] {
  if (!userReview) return businessReviews;
  if (businessReviews.some((r) => r.id === userReview.id)) return businessReviews;
  return [...businessReviews, userReview];
}

export function computeReviewAggregate(reviews: Review[]): ReviewAggregate {
  const rated = reviews.filter((r) => {
    const n = Number(r.rating);
    return Number.isFinite(n) && n > 0;
  });

  if (rated.length === 0) {
    return { averageRating: null, count: 0 };
  }

  const sum = rated.reduce((acc, r) => acc + Number(r.rating), 0);
  return {
    averageRating: sum / rated.length,
    count: rated.length,
  };
}

/**
 * Prefer live stats from the reviews API; fall back to search-index fields when the list is empty.
 */
export function resolveVendorReviewDisplay(
  businessReviews: Review[],
  userReview: Review | null,
  backendRating: number | null | undefined,
  backendCount: number | null | undefined
): { rating: number | null; count: number } {
  const merged = mergeReviewsForStats(businessReviews, userReview);
  const fromReviews = computeReviewAggregate(merged);

  if (fromReviews.count > 0) {
    return { rating: fromReviews.averageRating, count: fromReviews.count };
  }

  const parsedBackend =
    backendRating != null && backendRating !== ''
      ? Number(backendRating)
      : NaN;
  const rating = Number.isFinite(parsedBackend) && parsedBackend > 0 ? parsedBackend : null;
  const count = backendCount ?? 0;

  return { rating, count };
}

/** Full stars for aggregate display (4.6 → 5, 4.4 → 4). */
export function starFillCount(rating: number | null | undefined): number {
  if (rating == null || !Number.isFinite(rating)) return 0;
  return Math.min(5, Math.max(0, Math.round(rating)));
}
