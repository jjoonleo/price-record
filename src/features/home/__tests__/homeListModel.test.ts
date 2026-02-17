import { HistoryEntry } from '../../../types/domain';
import { buildLatestEntriesByProduct, filterHomeListItems } from '../homeListModel';

const buildEntry = (partial: Partial<HistoryEntry> & Pick<HistoryEntry, 'id'>): HistoryEntry => ({
  id: partial.id,
  productId: partial.productId ?? 'product-1',
  productName: partial.productName ?? 'Nissin Cup Noodle',
  storeId: partial.storeId ?? 'store-1',
  storeName: partial.storeName ?? '7-Eleven',
  cityArea: partial.cityArea ?? 'Shinjuku',
  priceYen: partial.priceYen ?? 158,
  observedAt: partial.observedAt ?? '2026-02-10T10:00:00.000Z',
  createdAt: partial.createdAt ?? '2026-02-10T10:05:00.000Z'
});

describe('buildLatestEntriesByProduct', () => {
  it('keeps only the latest entry per product by observedAt', () => {
    const latest = buildLatestEntriesByProduct([
      buildEntry({
        id: 'entry-old',
        productId: 'product-1',
        observedAt: '2026-02-10T09:00:00.000Z',
        createdAt: '2026-02-10T09:01:00.000Z',
        storeName: 'Store A'
      }),
      buildEntry({
        id: 'entry-new',
        productId: 'product-1',
        observedAt: '2026-02-10T11:00:00.000Z',
        createdAt: '2026-02-10T11:01:00.000Z',
        storeName: 'Store B'
      }),
      buildEntry({
        id: 'entry-other-product',
        productId: 'product-2',
        productName: 'KitKat Matcha',
        observedAt: '2026-02-10T10:30:00.000Z'
      })
    ]);

    expect(latest).toHaveLength(2);
    expect(latest.find((item) => item.productId === 'product-1')?.storeName).toBe('Store B');
    expect(latest.find((item) => item.productId === 'product-2')?.productName).toBe('KitKat Matcha');
  });

  it('uses createdAt as tie-breaker when observedAt timestamps are equal', () => {
    const latest = buildLatestEntriesByProduct([
      buildEntry({
        id: 'entry-earlier-created',
        productId: 'product-1',
        observedAt: '2026-02-10T11:00:00.000Z',
        createdAt: '2026-02-10T11:01:00.000Z',
        storeName: 'Store A'
      }),
      buildEntry({
        id: 'entry-later-created',
        productId: 'product-1',
        observedAt: '2026-02-10T11:00:00.000Z',
        createdAt: '2026-02-10T11:02:00.000Z',
        storeName: 'Store B'
      })
    ]);

    expect(latest).toHaveLength(1);
    expect(latest[0].storeName).toBe('Store B');
  });
});

describe('filterHomeListItems', () => {
  it('filters by product, store, or city area in a case-insensitive way', () => {
    const items = buildLatestEntriesByProduct([
      buildEntry({
        id: 'entry-1',
        productId: 'product-1',
        productName: 'Nissin Cup Noodle',
        storeName: '7-Eleven',
        cityArea: 'Shinjuku'
      }),
      buildEntry({
        id: 'entry-2',
        productId: 'product-2',
        productName: 'Sony WH-1000XM5',
        storeName: 'Bic Camera',
        cityArea: 'Ikebukuro'
      })
    ]);

    expect(filterHomeListItems(items, 'SONY')).toHaveLength(1);
    expect(filterHomeListItems(items, '7-eleven')).toHaveLength(1);
    expect(filterHomeListItems(items, 'ikebukuro')).toHaveLength(1);
    expect(filterHomeListItems(items, 'not-found')).toHaveLength(0);
    expect(filterHomeListItems(items, '   ')).toHaveLength(2);
  });
});
