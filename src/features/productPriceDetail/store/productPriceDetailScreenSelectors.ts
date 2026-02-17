import { ProductPriceDetailScreenStoreState } from '../model/productPriceDetailScreenModel';

export const productPriceDetailScreenSelectors = {
  isFavorite: (state: ProductPriceDetailScreenStoreState) => state.isFavorite,
  productImageUri: (state: ProductPriceDetailScreenStoreState) =>
    state.productImageUri,
  statusMessage: (state: ProductPriceDetailScreenStoreState) =>
    state.statusMessage,
  toggleFavorite: (state: ProductPriceDetailScreenStoreState) =>
    state.toggleFavorite,
  setStatusMessage: (state: ProductPriceDetailScreenStoreState) =>
    state.setStatusMessage,
  resetState: (state: ProductPriceDetailScreenStoreState) => state.resetState,
  loadProductImage: (state: ProductPriceDetailScreenStoreState) =>
    state.loadProductImage
};
