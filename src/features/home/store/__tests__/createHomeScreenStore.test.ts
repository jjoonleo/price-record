import { createHomeScreenStore } from '../createHomeScreenStore';

describe('createHomeScreenStore', () => {
  it('hydrates items and product image map', async () => {
    const store = createHomeScreenStore({
      listHistoryEntries: jest.fn().mockResolvedValue([
        {
          id: 'entry-1',
          productId: 'product-1',
          productName: 'Matcha KitKat',
          storeId: 'store-1',
          storeName: 'Don Quijote',
          cityArea: 'Shibuya',
          priceYen: 398,
          observedAt: '2026-02-17T10:00:00.000Z',
          createdAt: '2026-02-17T10:05:00.000Z'
        }
      ]),
      getProductById: jest.fn().mockResolvedValue({
        id: 'product-1',
        name: 'Matcha KitKat',
        normalizedName: 'matcha kitkat',
        note: '',
        imageUri: 'data:image/jpeg;base64,ABC',
        createdAt: '2026-02-16T00:00:00.000Z'
      })
    });

    await store.getState().hydrateHome('load failed');

    const state = store.getState();
    expect(state.items).toHaveLength(1);
    expect(state.productImageById['product-1']).toBe('data:image/jpeg;base64,ABC');
    expect(state.errorMessage).toBeNull();
    expect(state.isLoading).toBe(false);
  });

  it('surfaces fallback error when hydration fails', async () => {
    const store = createHomeScreenStore({
      listHistoryEntries: jest.fn().mockRejectedValue('bad'),
      getProductById: jest.fn()
    });

    await store.getState().hydrateHome('load failed');

    const state = store.getState();
    expect(state.errorMessage).toBe('load failed');
    expect(state.productImageById).toEqual({});
    expect(state.isLoading).toBe(false);
  });
});
