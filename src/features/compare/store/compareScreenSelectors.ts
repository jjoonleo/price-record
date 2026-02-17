import { CompareScreenStoreState } from '../model/compareScreenModel';

export const compareScreenSelectors = {
  products: (state: CompareScreenStoreState) => state.products,
  comparisons: (state: CompareScreenStoreState) => state.comparisons,
  selectedProductImageUri: (state: CompareScreenStoreState) =>
    state.selectedProductImageUri,
  userLocation: (state: CompareScreenStoreState) => state.userLocation,
  isLoading: (state: CompareScreenStoreState) => state.isLoading,
  errorMessage: (state: CompareScreenStoreState) => state.errorMessage,
  statusMessage: (state: CompareScreenStoreState) => state.statusMessage,
  hydrateScreen: (state: CompareScreenStoreState) => state.hydrateScreen,
  setStatusMessage: (state: CompareScreenStoreState) => state.setStatusMessage
};
