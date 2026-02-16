export type Product = {
  id: string;
  name: string;
  normalizedName: string;
  createdAt: string;
};

export type Store = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  cityArea: string;
  addressLine?: string;
  createdAt: string;
};

export type PriceEntry = {
  id: string;
  productId: string;
  storeId: string;
  priceYen: number;
  observedAt: string;
  createdAt: string;
};

export type StoreComparisonTag = 'BEST' | 'CHEAPEST' | 'CLOSEST';

export type StoreComparison = {
  storeId: string;
  storeName: string;
  cityArea: string;
  latitude: number;
  longitude: number;
  latestPriceYen: number;
  observedAt: string;
  distanceKm: number;
  score: number;
  tags: StoreComparisonTag[];
};

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type PlaceSelection = {
  latitude: number;
  longitude: number;
  cityArea: string;
  addressLine?: string;
  suggestedStoreName?: string;
};

export type ProductOption = {
  id: string;
  name: string;
  entryCount: number;
};

export type HistoryEntry = {
  id: string;
  productId: string;
  productName: string;
  storeId: string;
  storeName: string;
  cityArea: string;
  priceYen: number;
  observedAt: string;
  createdAt: string;
};
