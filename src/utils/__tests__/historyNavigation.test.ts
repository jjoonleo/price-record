import {
  buildCompareHistoryIntentParams,
  parseCompareHistoryIntent,
  resolveValidHistoryProductFilter
} from '../historyNavigation';

describe('historyNavigation', () => {
  it('builds compare intent params with product id', () => {
    const params = buildCompareHistoryIntentParams('product-123', 1700000000000);

    expect(params).toEqual({
      source: 'compare',
      productId: 'product-123',
      intentId: '1700000000000'
    });
  });

  it('omits product id when empty', () => {
    const params = buildCompareHistoryIntentParams('   ', 1700000000000);

    expect(params).toEqual({
      source: 'compare',
      intentId: '1700000000000'
    });
  });

  it('parses compare intent with new intent id', () => {
    const parsed = parseCompareHistoryIntent(
      {
        source: 'compare',
        productId: 'product-123',
        intentId: 'intent-1'
      },
      null
    );

    expect(parsed).toEqual({
      intentId: 'intent-1',
      productFilterId: 'product-123'
    });
  });

  it('does not re-apply the same intent id', () => {
    const parsed = parseCompareHistoryIntent(
      {
        source: 'compare',
        productId: 'product-123',
        intentId: 'intent-1'
      },
      'intent-1'
    );

    expect(parsed).toBeNull();
  });

  it('falls back to null product filter for missing product id', () => {
    const parsed = parseCompareHistoryIntent(
      {
        source: 'compare',
        intentId: 'intent-2'
      },
      null
    );

    expect(parsed).toEqual({
      intentId: 'intent-2',
      productFilterId: null
    });
  });

  it('returns null for non-compare sources', () => {
    const parsed = parseCompareHistoryIntent(
      {
        source: 'history',
        productId: 'product-123',
        intentId: 'intent-3'
      },
      null
    );

    expect(parsed).toBeNull();
  });

  it('keeps valid product filter and clears invalid product filter', () => {
    expect(resolveValidHistoryProductFilter('product-1', ['product-1', 'product-2'])).toBe(
      'product-1'
    );
    expect(resolveValidHistoryProductFilter('missing-product', ['product-1', 'product-2'])).toBe(
      null
    );
  });
});
