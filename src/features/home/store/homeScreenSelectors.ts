import { HomeScreenStoreState } from '../model/homeScreenModel';

export const homeScreenSelectors = {
  searchText: (state: HomeScreenStoreState) => state.searchText,
  items: (state: HomeScreenStoreState) => state.items,
  productImageById: (state: HomeScreenStoreState) => state.productImageById,
  isLoading: (state: HomeScreenStoreState) => state.isLoading,
  errorMessage: (state: HomeScreenStoreState) => state.errorMessage,
  setSearchText: (state: HomeScreenStoreState) => state.setSearchText,
  clearSearchText: (state: HomeScreenStoreState) => state.clearSearchText,
  hydrateHome: (state: HomeScreenStoreState) => state.hydrateHome
};
