import { buildProductPriceDetailView } from '../useProductPriceDetailController';

describe('buildProductPriceDetailView', () => {
  it('builds deterministic labels and price text', () => {
    const t = (key: string) => {
      if (key === 'detail_badge_great') return 'Great Deal';
      if (key === 'detail_badge_standard') return 'Recorded Price';
      return key;
    };

    const view = buildProductPriceDetailView(
      {
        productId: 'p1',
        productName: 'Matcha KitKat',
        storeId: 's1',
        storeName: 'MEGA Don Quijote',
        priceEntryId: 'entry-1',
        cityArea: 'Shibuya, Tokyo',
        latitude: 35.658,
        longitude: 139.7016,
        latestPriceYen: 398,
        observedAt: '2023-10-24T00:00:00.000Z'
      },
      'en-US',
      t
    );

    expect(view.dealTone).toBe('great');
    expect(view.dealLabel).toBe('Great Deal');
    expect(view.priceText).toBe('398');
    expect(view.observedLabel).toBe(
      new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }).format(new Date('2023-10-24T00:00:00.000Z'))
    );
  });
});
