import {
  buildPriceComparisonRows,
  buildRecommendationRows,
  computeVsAvgPercent,
  formatRelativeAge
} from '../compareScreen';
import { StoreComparison } from '../../types/domain';

const createComparison = (
  storeId: string,
  latestPriceYen: number,
  distanceKm = 1,
  score = 1
): StoreComparison => ({
  storeId,
  storeName: `Store ${storeId}`,
  cityArea: 'Shibuya',
  latitude: 35.659,
  longitude: 139.7,
  latestPriceYen,
  observedAt: '2026-02-17T10:00:00.000Z',
  distanceKm,
  score,
  tags: []
});

describe('compareScreen utilities', () => {
  it('builds price comparison rows with normalized widths and colors', () => {
    const rows = buildPriceComparisonRows([
      createComparison('b', 145),
      createComparison('a', 128),
      createComparison('c', 162),
      createComparison('d', 168)
    ]);

    expect(rows).toHaveLength(4);
    expect(rows[0].isBest).toBe(true);
    expect(rows[0].item.storeId).toBe('a');
    expect(rows[0].color).toBe('#137FEC');
    expect(rows[1].color).toBe('#94A3B8');
    expect(rows[0].widthPercent).toBeLessThan(rows[3].widthPercent);
  });

  it('builds recommendation rows from ranked rows after the top result', () => {
    const rows = buildRecommendationRows([
      createComparison('a', 128),
      createComparison('b', 138),
      createComparison('c', 142),
      createComparison('d', 168)
    ]);

    expect(rows).toHaveLength(3);
    expect(rows[0].rank).toBe(2);
    expect(rows[0].item.storeId).toBe('b');
    expect(rows[0].savingsYen).toBe(30);
    expect(rows[1].savingsYen).toBe(26);
    expect(rows[2].savingsYen).toBe(0);
  });

  it('computes signed percent versus average price', () => {
    const percent = computeVsAvgPercent([
      createComparison('a', 128),
      createComparison('b', 138),
      createComparison('c', 142),
      createComparison('d', 168)
    ]);

    expect(percent).toBe(-17);
  });

  it('formats relative age in minute, hour, and day buckets', () => {
    const now = new Date('2026-02-17T12:00:00.000Z');

    expect(formatRelativeAge('2026-02-17T11:58:30.000Z', now)).toBe('1m ago');
    expect(formatRelativeAge('2026-02-17T10:00:00.000Z', now)).toBe('2h ago');
    expect(formatRelativeAge('2026-02-15T12:00:00.000Z', now)).toBe('2d ago');
  });
});
