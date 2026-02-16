let webDb: {
  products: Array<{ id: string; name: string; normalizedName: string; createdAt: string }>;
  stores: Array<{
    id: string;
    name: string;
    nickname?: string;
    latitude: number;
    longitude: number;
    cityArea: string;
    addressLine: string;
    createdAt: string;
  }>;
  priceEntries: Array<{
    id: string;
    productId: string;
    storeId: string;
    priceYen: number;
    observedAt: string;
    createdAt: string;
  }>;
};

const mockReadWebDb = jest.fn(() => webDb);
const mockUpdateWebDb = jest.fn((mutator: (db: typeof webDb) => void) => mutator(webDb));

jest.mock('react-native', () => ({
  Platform: {
    OS: 'web'
  }
}));

jest.mock('../../webStore', () => ({
  readWebDb: () => mockReadWebDb(),
  updateWebDb: (mutator: (db: typeof webDb) => void) => mockUpdateWebDb(mutator)
}));

jest.mock('../../client', () => ({
  getAllSql: jest.fn(),
  getFirstSql: jest.fn(),
  runSql: jest.fn()
}));

import { findStoreByIdentity, getOrCreateStore, listRecentStores } from '../storesRepo';

const baseInput = {
  name: 'Lawson Marunouchi',
  cityArea: 'Chiyoda',
  coordinates: {
    latitude: 35.6812,
    longitude: 139.7671
  },
  addressLine: '1 Chome-9 Marunouchi, Chiyoda City, Tokyo'
};

describe('storesRepo (web)', () => {
  beforeEach(() => {
    webDb = {
      products: [],
      stores: [],
      priceEntries: []
    };
    mockReadWebDb.mockClear();
    mockUpdateWebDb.mockClear();
  });

  test('creates store with nickname', async () => {
    const store = await getOrCreateStore({
      ...baseInput,
      nickname: 'Office Lawson'
    });

    expect(store.nickname).toBe('Office Lawson');
    expect(webDb.stores).toHaveLength(1);
    expect(webDb.stores[0]?.nickname).toBe('Office Lawson');
  });

  test('updates nickname for existing matched store', async () => {
    webDb.stores.push({
      id: 'store-1',
      name: baseInput.name,
      cityArea: baseInput.cityArea,
      latitude: baseInput.coordinates.latitude,
      longitude: baseInput.coordinates.longitude,
      addressLine: baseInput.addressLine,
      createdAt: '2026-02-16T09:00:00.000Z'
    });

    const store = await getOrCreateStore({
      ...baseInput,
      nickname: 'Main Branch'
    });

    expect(store.id).toBe('store-1');
    expect(store.nickname).toBe('Main Branch');
    expect(webDb.stores[0]?.nickname).toBe('Main Branch');
  });

  test('clears nickname when empty value is saved', async () => {
    webDb.stores.push({
      id: 'store-1',
      name: baseInput.name,
      nickname: 'Main Branch',
      cityArea: baseInput.cityArea,
      latitude: baseInput.coordinates.latitude,
      longitude: baseInput.coordinates.longitude,
      addressLine: baseInput.addressLine,
      createdAt: '2026-02-16T09:00:00.000Z'
    });

    const store = await getOrCreateStore({
      ...baseInput,
      nickname: '  '
    });

    expect(store.nickname).toBeUndefined();
    expect(webDb.stores[0]?.nickname).toBeUndefined();
  });

  test('findStoreByIdentity returns matched store', async () => {
    webDb.stores.push({
      id: 'store-1',
      name: baseInput.name,
      nickname: 'Office Lawson',
      cityArea: baseInput.cityArea,
      latitude: baseInput.coordinates.latitude,
      longitude: baseInput.coordinates.longitude,
      addressLine: baseInput.addressLine,
      createdAt: '2026-02-16T09:00:00.000Z'
    });

    const found = await findStoreByIdentity({
      name: 'lawson marunouchi',
      cityArea: baseInput.cityArea,
      coordinates: baseInput.coordinates
    });

    expect(found?.id).toBe('store-1');
    expect(found?.nickname).toBe('Office Lawson');
  });

  test('listRecentStores orders by latest usage and supports search', async () => {
    webDb.stores.push(
      {
        id: 'store-1',
        name: 'Lawson Marunouchi',
        nickname: 'Office Lawson',
        cityArea: 'Chiyoda',
        latitude: 35.6812,
        longitude: 139.7671,
        addressLine: 'A',
        createdAt: '2026-02-16T09:00:00.000Z'
      },
      {
        id: 'store-2',
        name: 'FamilyMart Akihabara',
        cityArea: 'Chiyoda',
        latitude: 35.6983,
        longitude: 139.7730,
        addressLine: 'B',
        createdAt: '2026-02-16T09:01:00.000Z'
      },
      {
        id: 'store-3',
        name: 'Seijo Ishii',
        cityArea: 'Shinjuku',
        latitude: 35.6900,
        longitude: 139.7000,
        addressLine: 'C',
        createdAt: '2026-02-16T09:02:00.000Z'
      }
    );

    webDb.priceEntries.push(
      {
        id: 'pe-1',
        productId: 'p1',
        storeId: 'store-2',
        priceYen: 300,
        observedAt: '2026-02-15T00:00:00.000Z',
        createdAt: '2026-02-16T10:00:00.000Z'
      },
      {
        id: 'pe-2',
        productId: 'p1',
        storeId: 'store-1',
        priceYen: 280,
        observedAt: '2026-02-15T00:00:00.000Z',
        createdAt: '2026-02-16T11:00:00.000Z'
      }
    );

    const recent = await listRecentStores(8);
    expect(recent.map((store) => store.id)).toEqual(['store-1', 'store-2', 'store-3']);

    const searched = await listRecentStores(8, 'office');
    expect(searched).toHaveLength(1);
    expect(searched[0]?.id).toBe('store-1');
  });
});
