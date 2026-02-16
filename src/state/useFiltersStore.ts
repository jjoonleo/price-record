import { create } from 'zustand';

type FilterState = {
  selectedProductId: string | null;
  selectedCityArea: string | null;
  selectedStoreId: string | null;
  setSelectedProductId: (value: string | null) => void;
  setSelectedCityArea: (value: string | null) => void;
  setSelectedStoreId: (value: string | null) => void;
  clearHistoryStoreFilter: () => void;
};

export const useFiltersStore = create<FilterState>((set) => ({
  selectedProductId: null,
  selectedCityArea: null,
  selectedStoreId: null,
  setSelectedProductId: (value) => set({ selectedProductId: value }),
  setSelectedCityArea: (value) => set({ selectedCityArea: value }),
  setSelectedStoreId: (value) => set({ selectedStoreId: value }),
  clearHistoryStoreFilter: () => set({ selectedStoreId: null })
}));
