import { createCompareScreenStore } from '../createCompareScreenStore';

describe('createCompareScreenStore', () => {
  it('hydrates compare data and resolves selected product image', async () => {
    const setSelectedProductId = jest.fn();
    const clearHistoryStoreFilter = jest.fn();
    const buildStoreComparisons = jest.fn().mockReturnValue([
      {
        storeId: 'store-1',
        priceEntryId: 'entry-1',
        storeName: 'Don Quijote',
        cityArea: 'Shibuya',
        addressLine: '1-1-1',
        latitude: 35.66,
        longitude: 139.7,
        latestPriceYen: 398,
        observedAt: '2026-02-17T10:00:00.000Z',
        distanceKm: 1.2,
        score: 0.92,
        tags: ['BEST']
      }
    ]);

    const store = createCompareScreenStore({
      listProductOptions: jest.fn().mockResolvedValue([
        { id: 'product-1', name: 'Matcha', entryCount: 4 }
      ]),
      captureCurrentLocation: jest.fn().mockResolvedValue({
        status: 'granted',
        coordinates: { latitude: 35.66, longitude: 139.7 },
        cityArea: 'Shibuya'
      }),
      getProductById: jest.fn().mockResolvedValue({
        id: 'product-1',
        name: 'Matcha',
        normalizedName: 'matcha',
        note: '',
        imageUri: 'data:image/jpeg;base64,ABC',
        createdAt: '2026-02-16T00:00:00.000Z'
      }),
      getLatestStorePricesByProduct: jest.fn().mockResolvedValue([
        {
          storeId: 'store-1',
          priceEntryId: 'entry-1',
          storeName: 'Don Quijote',
          cityArea: 'Shibuya',
          addressLine: '1-1-1',
          latitude: 35.66,
          longitude: 139.7,
          latestPriceYen: 398,
          observedAt: '2026-02-17T10:00:00.000Z'
        }
      ]),
      buildStoreComparisons
    });

    await store.getState().hydrateScreen({
      selectedProductId: null,
      setSelectedProductId,
      clearHistoryStoreFilter,
      compareLoadErrorMessage: 'load failed'
    });

    const state = store.getState();
    expect(setSelectedProductId).toHaveBeenCalledWith('product-1');
    expect(clearHistoryStoreFilter).toHaveBeenCalled();
    expect(buildStoreComparisons).toHaveBeenCalled();
    expect(state.products).toHaveLength(1);
    expect(state.comparisons).toHaveLength(1);
    expect(state.selectedProductImageUri).toBe('data:image/jpeg;base64,ABC');
    expect(state.errorMessage).toBeNull();
    expect(state.isLoading).toBe(false);
  });
});
