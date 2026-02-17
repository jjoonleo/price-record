import { useFiltersStore } from '../useFiltersStore';

describe('useFiltersStore', () => {
  beforeEach(() => {
    useFiltersStore.setState({
      selectedProductId: null,
      selectedCityArea: null,
      selectedStoreId: null
    });
  });

  it('clears only history store filter for full history navigation', () => {
    useFiltersStore.setState({
      selectedProductId: 'product-1',
      selectedCityArea: 'Shibuya',
      selectedStoreId: 'store-1'
    });

    useFiltersStore.getState().clearHistoryStoreFilter();

    const state = useFiltersStore.getState();
    expect(state.selectedProductId).toBe('product-1');
    expect(state.selectedCityArea).toBe('Shibuya');
    expect(state.selectedStoreId).toBeNull();
  });
});
