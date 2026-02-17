import { ProductOption, StoreComparison, Coordinates } from '../../../types/domain';

export type CompareScreenFeatureState = {
  products: ProductOption[];
  comparisons: StoreComparison[];
  selectedProductImageUri: string;
  userLocation?: Coordinates;
  isLoading: boolean;
  errorMessage: string | null;
  statusMessage: string | null;
};

export type CompareScreenFeatureActions = {
  hydrateScreen: (input: {
    selectedProductId: string | null;
    setSelectedProductId: (value: string | null) => void;
    clearHistoryStoreFilter: () => void;
    compareLoadErrorMessage: string;
  }) => Promise<void>;
  setStatusMessage: (message: string | null) => void;
};

export type CompareScreenStoreState = CompareScreenFeatureState &
  CompareScreenFeatureActions;

export const createInitialCompareScreenState = (): CompareScreenFeatureState => ({
  products: [],
  comparisons: [],
  selectedProductImageUri: '',
  userLocation: undefined,
  isLoading: false,
  errorMessage: null,
  statusMessage: null
});
