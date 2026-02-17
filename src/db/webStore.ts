import { createId } from '../utils/id';

export type WebProduct = {
  id: string;
  name: string;
  normalizedName: string;
  note: string;
  imageUri: string;
  createdAt: string;
};

export type WebStore = {
  id: string;
  name: string;
  nickname?: string;
  latitude: number;
  longitude: number;
  cityArea: string;
  addressLine: string;
  createdAt: string;
};

export type WebPriceEntry = {
  id: string;
  productId: string;
  storeId: string;
  priceYen: number;
  observedAt: string;
  createdAt: string;
};

type WebDb = {
  products: WebProduct[];
  stores: WebStore[];
  priceEntries: WebPriceEntry[];
};

const STORAGE_KEY = 'japan-price-tracker-web-db-v1';

let memoryDb: WebDb | null = null;

const defaultDb = (): WebDb => ({
  products: [],
  stores: [],
  priceEntries: []
});

const canUseLocalStorage = (): boolean => {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
};

export const readWebDb = (): WebDb => {
  if (!canUseLocalStorage()) {
    if (!memoryDb) {
      memoryDb = defaultDb();
    }
    return memoryDb;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const next = defaultDb();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<WebDb>;
    const stores = Array.isArray(parsed.stores)
      ? parsed.stores.map((store) => ({
          ...store,
          nickname: typeof store?.nickname === 'string' ? store.nickname : undefined,
          addressLine: typeof store?.addressLine === 'string' ? store.addressLine : ''
        }))
      : [];

    const products = Array.isArray(parsed.products)
      ? parsed.products.map((product) => ({
          ...product,
          note: typeof product?.note === 'string' ? product.note : '',
          imageUri: typeof product?.imageUri === 'string' ? product.imageUri : ''
        }))
      : [];

    return {
      products,
      stores,
      priceEntries: Array.isArray(parsed.priceEntries) ? parsed.priceEntries : []
    };
  } catch {
    const next = defaultDb();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  }
};

export const writeWebDb = (db: WebDb): void => {
  if (!canUseLocalStorage()) {
    memoryDb = db;
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
};

export const updateWebDb = <T>(mutator: (db: WebDb) => T): T => {
  const current = readWebDb();
  const next: WebDb = {
    products: [...current.products],
    stores: [...current.stores],
    priceEntries: [...current.priceEntries]
  };

  const result = mutator(next);
  writeWebDb(next);
  return result;
};

export const createWebEntryId = (): string => createId();
