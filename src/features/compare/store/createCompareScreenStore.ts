import { createStore } from 'zustand/vanilla';
import { getLatestStorePricesByProduct } from '../../../db/repositories/priceEntriesRepo';
import { getProductById, listProductOptions } from '../../../db/repositories/productsRepo';
import { captureCurrentLocation } from '../../../services/locationService';
import { buildStoreComparisons } from '../../../services/rankingService';
import {
  CompareScreenStoreState,
  createInitialCompareScreenState
} from '../model/compareScreenModel';

export type CompareScreenStoreDependencies = {
  listProductOptions: typeof listProductOptions;
  captureCurrentLocation: typeof captureCurrentLocation;
  getProductById: typeof getProductById;
  getLatestStorePricesByProduct: typeof getLatestStorePricesByProduct;
  buildStoreComparisons: typeof buildStoreComparisons;
};

const defaultDependencies: CompareScreenStoreDependencies = {
  listProductOptions,
  captureCurrentLocation,
  getProductById,
  getLatestStorePricesByProduct,
  buildStoreComparisons
};

export type CompareScreenStoreApi = ReturnType<typeof createCompareScreenStore>;

export const createCompareScreenStore = (
  dependencies: CompareScreenStoreDependencies = defaultDependencies
) => {
  return createStore<CompareScreenStoreState>()((set) => ({
    ...createInitialCompareScreenState(),

    hydrateScreen: async ({
      selectedProductId,
      setSelectedProductId,
      clearHistoryStoreFilter,
      compareLoadErrorMessage
    }) => {
      set({
        isLoading: true,
        errorMessage: null
      });

      try {
        const [productOptions, locationResult] = await Promise.all([
          dependencies.listProductOptions(),
          dependencies.captureCurrentLocation()
        ]);

        const resolvedProductId = selectedProductId ?? productOptions[0]?.id ?? null;
        if (resolvedProductId !== selectedProductId) {
          setSelectedProductId(resolvedProductId);
          clearHistoryStoreFilter();
        }

        const selectedProductDetails = resolvedProductId
          ? await dependencies.getProductById(resolvedProductId)
          : null;

        const resolvedLocation =
          locationResult.status === 'granted'
            ? locationResult.coordinates
            : undefined;

        const latestRows = resolvedProductId
          ? await dependencies.getLatestStorePricesByProduct(resolvedProductId)
          : [];

        set({
          products: productOptions,
          comparisons: dependencies.buildStoreComparisons(
            latestRows,
            resolvedLocation
          ),
          selectedProductImageUri: selectedProductDetails?.imageUri ?? '',
          userLocation: resolvedLocation,
          isLoading: false
        });
      } catch (error) {
        set({
          errorMessage:
            error instanceof Error ? error.message : compareLoadErrorMessage,
          isLoading: false
        });
      }
    },

    setStatusMessage: (statusMessage) => {
      set({ statusMessage });
    }
  }));
};
