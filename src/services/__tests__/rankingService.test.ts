import { buildStoreComparisons, distanceKmBetween } from '../rankingService';
import { LatestStorePrice } from '../../db/repositories/priceEntriesRepo';

describe('distanceKmBetween', () => {
  it('computes realistic distance between Tokyo Station and Shibuya', () => {
    const km = distanceKmBetween(
      { latitude: 35.6812, longitude: 139.7671 },
      { latitude: 35.6580, longitude: 139.7016 }
    );

    expect(km).toBeGreaterThan(5.0);
    expect(km).toBeLessThan(7.5);
  });
});

describe('buildStoreComparisons', () => {
  const rows: LatestStorePrice[] = [
    {
      storeId: 'a',
      storeName: 'Store A',
      cityArea: 'Shibuya',
      latitude: 35.6580,
      longitude: 139.7016,
      latestPriceYen: 980,
      observedAt: '2026-02-12T09:00:00.000Z'
    },
    {
      storeId: 'b',
      storeName: 'Store B',
      cityArea: 'Shibuya',
      latitude: 35.6618,
      longitude: 139.7041,
      latestPriceYen: 1020,
      observedAt: '2026-02-12T09:02:00.000Z'
    },
    {
      storeId: 'c',
      storeName: 'Store C',
      cityArea: 'Shibuya',
      latitude: 35.6656,
      longitude: 139.6984,
      latestPriceYen: 1120,
      observedAt: '2026-02-12T09:05:00.000Z'
    }
  ];

  it('returns deterministic sorted ranking and applies BEST tag', () => {
    const ranked = buildStoreComparisons(rows, {
      latitude: 35.6590,
      longitude: 139.7005
    });

    expect(ranked).toHaveLength(3);
    expect(ranked[0].tags).toContain('BEST');
    expect(ranked[0].storeId).toBe('a');
    expect(ranked[0].score).toBeLessThanOrEqual(ranked[1].score);
    expect(ranked[1].score).toBeLessThanOrEqual(ranked[2].score);
  });

  it('falls back to price-priority ordering when user location is unavailable', () => {
    const ranked = buildStoreComparisons(rows);

    expect(ranked[0].storeId).toBe('a');
    expect(ranked[0].tags).toContain('CHEAPEST');
    expect(ranked[0].distanceKm).toBe(0);
  });
});
