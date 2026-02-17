import { StoreComparison } from '../types/domain';

const PRICE_BAR_COLORS = ['#137FEC', '#94A3B8', '#CBD5E1', '#CBD5E1'] as const;

export type PriceComparisonRow = {
  item: StoreComparison;
  widthPercent: number;
  color: string;
  isBest: boolean;
};

export type RecommendationRow = {
  item: StoreComparison;
  rank: number;
  savingsYen: number;
};

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};

export const buildPriceComparisonRows = (
  comparisons: StoreComparison[],
  limit = 4
): PriceComparisonRow[] => {
  const rows = comparisons
    .slice()
    .sort((a, b) => {
      if (a.latestPriceYen !== b.latestPriceYen) {
        return a.latestPriceYen - b.latestPriceYen;
      }

      return a.storeName.localeCompare(b.storeName);
    })
    .slice(0, limit);
  if (rows.length === 0) {
    return [];
  }

  const prices = rows.map((item) => item.latestPriceYen);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = Math.max(1, maxPrice - minPrice);

  return rows.map((item, index) => {
    const relative = (item.latestPriceYen - minPrice) / priceRange;
    const widthPercent = minPrice === maxPrice ? 60 : 35 + relative * 30;

    return {
      item,
      widthPercent: clamp(widthPercent, 25, 100),
      color: PRICE_BAR_COLORS[index] ?? PRICE_BAR_COLORS[PRICE_BAR_COLORS.length - 1],
      isBest: index === 0
    };
  });
};

export const buildRecommendationRows = (
  comparisons: StoreComparison[],
  limit = 3
): RecommendationRow[] => {
  if (comparisons.length <= 1) {
    return [];
  }

  const maxPrice = Math.max(...comparisons.map((item) => item.latestPriceYen));

  return comparisons.slice(1, 1 + limit).map((item, index) => ({
    item,
    rank: index + 2,
    savingsYen: Math.max(0, maxPrice - item.latestPriceYen)
  }));
};

export const computeVsAvgPercent = (comparisons: StoreComparison[]): number => {
  if (comparisons.length === 0) {
    return 0;
  }

  const average = comparisons.reduce((total, item) => total + item.latestPriceYen, 0) / comparisons.length;
  if (average <= 0) {
    return 0;
  }

  const bestPrice = comparisons[0].latestPriceYen;
  return Math.round(((bestPrice - average) / average) * 100);
};

export const formatRelativeAge = (isoDate: string, now = new Date()): string => {
  const observedAt = new Date(isoDate);
  if (Number.isNaN(observedAt.getTime())) {
    return 'now';
  }

  const diffMs = Math.max(0, now.getTime() - observedAt.getTime());
  const minutes = Math.floor(diffMs / (60 * 1000));

  if (minutes < 1) {
    return 'now';
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};
