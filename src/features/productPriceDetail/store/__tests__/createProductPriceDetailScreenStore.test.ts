import { createProductPriceDetailScreenStore } from '../createProductPriceDetailScreenStore';

describe('createProductPriceDetailScreenStore', () => {
  it('toggles favorite state', () => {
    const store = createProductPriceDetailScreenStore({
      getProductById: jest.fn()
    });

    expect(store.getState().isFavorite).toBe(false);
    store.getState().toggleFavorite();
    expect(store.getState().isFavorite).toBe(true);
  });

  it('loads product image for a valid product id', async () => {
    const store = createProductPriceDetailScreenStore({
      getProductById: jest.fn().mockResolvedValue({
        id: 'product-1',
        name: 'Matcha',
        normalizedName: 'matcha',
        note: '',
        imageUri: 'data:image/jpeg;base64,ABC',
        createdAt: '2026-02-16T00:00:00.000Z'
      })
    });

    await store.getState().loadProductImage('product-1');
    expect(store.getState().productImageUri).toBe('data:image/jpeg;base64,ABC');
  });

  it('clears image when product id is missing', async () => {
    const store = createProductPriceDetailScreenStore({
      getProductById: jest.fn()
    });
    store.setState({ productImageUri: 'data:image/jpeg;base64,ABC' });

    await store.getState().loadProductImage(null);
    expect(store.getState().productImageUri).toBe('');
  });
});
