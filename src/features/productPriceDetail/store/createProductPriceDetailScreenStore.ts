import { createStore } from 'zustand/vanilla';
import { getProductById } from '../../../db/repositories/productsRepo';
import {
  createInitialProductPriceDetailScreenState,
  ProductPriceDetailScreenStoreState
} from '../model/productPriceDetailScreenModel';

export type ProductPriceDetailScreenStoreDependencies = {
  getProductById: typeof getProductById;
};

const defaultDependencies: ProductPriceDetailScreenStoreDependencies = {
  getProductById
};

export type ProductPriceDetailScreenStoreApi = ReturnType<
  typeof createProductPriceDetailScreenStore
>;

export const createProductPriceDetailScreenStore = (
  dependencies: ProductPriceDetailScreenStoreDependencies = defaultDependencies
) => {
  return createStore<ProductPriceDetailScreenStoreState>()((set) => ({
    ...createInitialProductPriceDetailScreenState(),

    toggleFavorite: () => {
      set((state) => ({ isFavorite: !state.isFavorite }));
    },

    setStatusMessage: (statusMessage) => {
      set({ statusMessage });
    },

    resetState: () => {
      set(createInitialProductPriceDetailScreenState());
    },

    loadProductImage: async (productId: string | null) => {
      if (!productId) {
        set({ productImageUri: '' });
        return;
      }

      try {
        const product = await dependencies.getProductById(productId);
        set({ productImageUri: product?.imageUri ?? '' });
      } catch {
        set({ productImageUri: '' });
      }
    }
  }));
};
