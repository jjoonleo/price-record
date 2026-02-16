import { LatestStorePrice } from '../db/repositories/priceEntriesRepo';
import { Coordinates, StoreComparison, StoreComparisonTag } from '../types/domain';

const normalizeValue = (value: number, minValue: number, maxValue: number): number => {
  const denominator = Math.max(1, maxValue - minValue);
  return (value - minValue) / denominator;
};

const attachTag = (tags: StoreComparisonTag[], tag: StoreComparisonTag): StoreComparisonTag[] => {
  if (tags.includes(tag)) {
    return tags;
  }

  return [...tags, tag];
};

export const distanceKmBetween = (from: Coordinates, to: Coordinates): number => {
  const earthRadiusKm = 6371;
  const dLat = ((to.latitude - from.latitude) * Math.PI) / 180;
  const dLon = ((to.longitude - from.longitude) * Math.PI) / 180;

  const lat1 = (from.latitude * Math.PI) / 180;
  const lat2 = (to.latitude * Math.PI) / 180;

  const sinHalfDLat = Math.sin(dLat / 2);
  const sinHalfDLon = Math.sin(dLon / 2);

  const a =
    sinHalfDLat * sinHalfDLat +
    Math.cos(lat1) * Math.cos(lat2) * sinHalfDLon * sinHalfDLon;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
};

export const buildStoreComparisons = (
  latestRows: LatestStorePrice[],
  userLocation?: Coordinates
): StoreComparison[] => {
  if (latestRows.length === 0) {
    return [];
  }

  const prices = latestRows.map((row) => row.latestPriceYen);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  const distances = latestRows.map((row) => {
    if (!userLocation) {
      return 0;
    }

    return distanceKmBetween(userLocation, {
      latitude: row.latitude,
      longitude: row.longitude
    });
  });

  const minDistance = Math.min(...distances);
  const maxDistance = Math.max(...distances);

  let comparisons: StoreComparison[] = latestRows.map((row, index) => {
    const distanceKm = distances[index];
    const priceNorm = normalizeValue(row.latestPriceYen, minPrice, maxPrice);
    const distanceNorm = normalizeValue(distanceKm, minDistance, maxDistance);
    const score = 0.75 * priceNorm + 0.25 * distanceNorm;

    return {
      storeId: row.storeId,
      storeName: row.storeName,
      cityArea: row.cityArea,
      latitude: row.latitude,
      longitude: row.longitude,
      latestPriceYen: row.latestPriceYen,
      observedAt: row.observedAt,
      distanceKm,
      score,
      tags: []
    };
  });

  const cheapestIndex = comparisons.findIndex((item) => item.latestPriceYen === minPrice);
  const closestIndex = comparisons.findIndex((item) => item.distanceKm === minDistance);

  if (cheapestIndex >= 0) {
    comparisons[cheapestIndex] = {
      ...comparisons[cheapestIndex],
      tags: attachTag(comparisons[cheapestIndex].tags, 'CHEAPEST')
    };
  }

  if (closestIndex >= 0 && userLocation) {
    comparisons[closestIndex] = {
      ...comparisons[closestIndex],
      tags: attachTag(comparisons[closestIndex].tags, 'CLOSEST')
    };
  }

  comparisons = comparisons.sort((a, b) => {
    if (a.score !== b.score) {
      return a.score - b.score;
    }

    return a.latestPriceYen - b.latestPriceYen;
  });

  comparisons[0] = {
    ...comparisons[0],
    tags: attachTag(comparisons[0].tags, 'BEST')
  };

  return comparisons;
};
