import { createStore } from 'zustand/vanilla';
import { getProductById } from '../../../db/repositories/productsRepo';
import { listHistoryEntries } from '../../../db/repositories/priceEntriesRepo';
import { buildLatestEntriesByProduct } from '../homeListModel';
import {
  createInitialHomeScreenState,
  HomeScreenStoreState
} from '../model/homeScreenModel';

export type HomeScreenStoreDependencies = {
  listHistoryEntries: typeof listHistoryEntries;
  getProductById: typeof getProductById;
};

const defaultDependencies: HomeScreenStoreDependencies = {
  listHistoryEntries,
  getProductById
};

export type HomeScreenStoreApi = ReturnType<typeof createHomeScreenStore>;

export const createHomeScreenStore = (
  dependencies: HomeScreenStoreDependencies = defaultDependencies
) => {
  return createStore<HomeScreenStoreState>()((set) => ({
    ...createInitialHomeScreenState(),

    setSearchText: (searchText) => {
      set({ searchText });
    },

    clearSearchText: () => {
      set({ searchText: '' });
    },

    hydrateHome: async (loadErrorMessage: string) => {
      set({
        isLoading: true,
        errorMessage: null
      });

      try {
        const rows = await dependencies.listHistoryEntries({ limit: 500 });
        const latestItems = buildLatestEntriesByProduct(rows);
        const productIds = [...new Set(latestItems.map((item) => item.productId))];
        const products = await Promise.all(
          productIds.map((id) => dependencies.getProductById(id))
        );
        const nextImageById: Record<string, string> = {};

        products.forEach((product) => {
          if (!product) {
            return;
          }
          nextImageById[product.id] = product.imageUri;
        });

        set({
          items: latestItems,
          productImageById: nextImageById,
          isLoading: false
        });
      } catch (error) {
        set({
          errorMessage: error instanceof Error ? error.message : loadErrorMessage,
          productImageById: {},
          isLoading: false
        });
      }
    }
  }));
};
