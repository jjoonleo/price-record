export type ProductPriceDetailScreenState = {
  isFavorite: boolean;
  productImageUri: string;
  statusMessage: string | null;
};

export type ProductPriceDetailScreenActions = {
  toggleFavorite: () => void;
  setStatusMessage: (message: string | null) => void;
  resetState: () => void;
  loadProductImage: (productId: string | null) => Promise<void>;
};

export type ProductPriceDetailScreenStoreState = ProductPriceDetailScreenState &
  ProductPriceDetailScreenActions;

export const createInitialProductPriceDetailScreenState = (): ProductPriceDetailScreenState => ({
  isFavorite: false,
  productImageUri: '',
  statusMessage: null
});
