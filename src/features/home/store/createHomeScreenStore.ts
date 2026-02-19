import { createStore } from 'zustand/vanilla';
import { getProductById, listProductOptions } from '../../../db/repositories/productsRepo';
import { listHistoryEntries } from '../../../db/repositories/priceEntriesRepo';
import { buildLatestEntriesByProduct } from '../homeListModel';
import {
  createInitialHomeScreenState,
  HomeScreenStoreState
} from '../model/homeScreenModel';

export type HomeScreenStoreDependencies = {
  listHistoryEntries: typeof listHistoryEntries;
  listProductOptions: typeof listProductOptions;
  getProductById: typeof getProductById;
};

const defaultDependencies: HomeScreenStoreDependencies = {
  listHistoryEntries,
  listProductOptions,
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
        const [rows, productOptions] = await Promise.all([
          dependencies.listHistoryEntries({ limit: 500 }),
          dependencies.listProductOptions()
        ]);
        const latestItems = buildLatestEntriesByProduct(rows);
        const latestProductIds = new Set(latestItems.map((item) => item.productId));
        const productIds = [
          ...new Set([
            ...latestItems.map((item) => item.productId),
            ...productOptions.map((product) => product.id)
          ])
        ];
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

        const noPriceItems = products
          .filter((product): product is NonNullable<(typeof products)[number]> => {
            return !!product && !latestProductIds.has(product.id);
          })
          .map((product) => ({
            productId: product.id,
            productName: product.name,
            storeId: '',
            storeName: '',
            cityArea: '',
            priceYen: null,
            observedAt: product.createdAt,
            createdAt: product.createdAt
          }))
          .sort((left, right) => {
            const createdAtDiff =
              new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
            if (createdAtDiff !== 0) {
              return createdAtDiff;
            }
            return left.productName.localeCompare(right.productName);
          });

        set({
          items: [...latestItems, ...noPriceItems],
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
