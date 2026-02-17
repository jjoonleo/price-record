import { HomeListItem } from '../homeListModel';

export type HomeScreenFeatureState = {
  searchText: string;
  items: HomeListItem[];
  productImageById: Record<string, string>;
  isLoading: boolean;
  errorMessage: string | null;
};

export type HomeScreenFeatureActions = {
  setSearchText: (value: string) => void;
  clearSearchText: () => void;
  hydrateHome: (loadErrorMessage: string) => Promise<void>;
};

export type HomeScreenStoreState = HomeScreenFeatureState & HomeScreenFeatureActions;

export const createInitialHomeScreenState = (): HomeScreenFeatureState => ({
  searchText: '',
  items: [],
  productImageById: {},
  isLoading: false,
  errorMessage: null
});
