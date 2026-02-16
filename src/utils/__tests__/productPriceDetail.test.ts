import {
  buildProductPriceDetailRouteParams,
  formatDetailObservedAt,
  parseProductPriceDetailRouteParams,
  resolveDetailDealTone
} from '../productPriceDetail';

describe('buildProductPriceDetailRouteParams', () => {
  it('serializes compare data into route params', () => {
    const params = buildProductPriceDetailRouteParams(
      {
        storeId: 'store-1',
        storeName: 'MEGA Don Quijote',
        cityArea: 'Shibuya, Tokyo',
        latitude: 35.658,
        longitude: 139.7016,
        latestPriceYen: 398,
        observedAt: '2026-02-12T09:00:00.000Z',
        distanceKm: 1.1,
        score: 0.22,
        tags: ['BEST']
      },
      { id: 'product-1', name: 'Matcha KitKat' }
    );

    expect(params).toEqual({
      productId: 'product-1',
      productName: 'Matcha KitKat',
      storeId: 'store-1',
      storeName: 'MEGA Don Quijote',
      cityArea: 'Shibuya, Tokyo',
      latitude: '35.658',
      longitude: '139.7016',
      latestPriceYen: '398',
      observedAt: '2026-02-12T09:00:00.000Z'
    });
  });
});

describe('parseProductPriceDetailRouteParams', () => {
  it('returns null when required params are missing', () => {
    expect(
      parseProductPriceDetailRouteParams({
        productId: 'p1',
        storeId: 's1'
      })
    ).toBeNull();
  });

  it('parses complete route params', () => {
    const parsed = parseProductPriceDetailRouteParams({
      productId: 'p1',
      productName: 'Matcha KitKat',
      storeId: 's1',
      storeName: 'MEGA Don Quijote',
      cityArea: 'Shibuya, Tokyo',
      latitude: '35.658',
      longitude: '139.7016',
      latestPriceYen: '398',
      observedAt: '2026-02-12T09:00:00.000Z'
    });

    expect(parsed).toEqual({
      productId: 'p1',
      productName: 'Matcha KitKat',
      storeId: 's1',
      storeName: 'MEGA Don Quijote',
      cityArea: 'Shibuya, Tokyo',
      latitude: 35.658,
      longitude: 139.7016,
      latestPriceYen: 398,
      observedAt: '2026-02-12T09:00:00.000Z'
    });
  });
});

describe('detail formatting helpers', () => {
  it('formats observed date using locale-aware formatter', () => {
    const iso = '2023-10-24T12:00:00.000Z';
    const expected = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(iso));

    expect(formatDetailObservedAt(iso, 'en-US')).toBe(expected);
  });

  it('resolves deal tone from price', () => {
    expect(resolveDetailDealTone(398)).toBe('great');
    expect(resolveDetailDealTone(880)).toBe('standard');
  });
});
