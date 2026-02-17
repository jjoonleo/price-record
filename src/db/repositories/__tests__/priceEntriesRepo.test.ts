import {
  getPriceEntryById,
  resolveStoreName,
  selectLatestByStore,
  deletePriceEntry,
  updatePriceEntry
} from '../priceEntriesRepo';

type WebDb = {
  products: Array<{ id: string; name: string; normalizedName: string; note: string; createdAt: string }>;
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

let webDb: WebDb = {
  products: [],
  stores: [],
  priceEntries: []
};

const mockReadWebDb = jest.fn(() => webDb);
const mockUpdateWebDb = jest.fn((mutator: (db: WebDb) => void) => {
  mutator(webDb);
});

jest.mock('react-native', () => ({
  Platform: {
    OS: 'web'
  }
}));

jest.mock('../../webStore', () => ({
  readWebDb: () => mockReadWebDb(),
  updateWebDb: (mutator: (db: WebDb) => void) => mockUpdateWebDb(mutator)
}));

jest.mock('../../client', () => ({
  getAllSql: jest.fn(),
  getFirstSql: jest.fn(),
  runSql: jest.fn()
}));

const basePriceEntry = {
  id: 'pe-1',
  productId: 'product-1',
  storeId: 'store-1',
  priceYen: 1200,
  observedAt: '2026-02-12T10:00:00.000Z',
  createdAt: '2026-02-12T09:58:00.000Z'
};

beforeEach(() => {
  webDb = {
    products: [],
    stores: [],
    priceEntries: []
  };
  mockReadWebDb.mockClear();
  mockUpdateWebDb.mockClear();
});

describe('getPriceEntryById', () => {
  it('returns null when id does not exist', async () => {
    webDb.priceEntries = [];

    const entry = await getPriceEntryById('missing');
    expect(entry).toBeNull();
  });

  it('returns a single row mapped to domain shape', async () => {
    webDb.priceEntries = [basePriceEntry];

    const entry = await getPriceEntryById('pe-1');

    expect(entry).toEqual(basePriceEntry);
  });
});

describe('updatePriceEntry', () => {
  it('updates product, store, price and observed date', async () => {
    webDb.priceEntries = [basePriceEntry];

    await updatePriceEntry({
      id: 'pe-1',
      productId: 'product-2',
      storeId: 'store-2',
      priceYen: 980,
      observedAt: '2026-02-13T08:00:00.000Z'
    });

    expect(webDb.priceEntries[0]).toEqual({
      id: 'pe-1',
      productId: 'product-2',
      storeId: 'store-2',
      priceYen: 980,
      observedAt: '2026-02-13T08:00:00.000Z',
      createdAt: basePriceEntry.createdAt
    });
  });

  it('throws when entry does not exist', async () => {
    webDb.priceEntries = [basePriceEntry];

    await expect(
      updatePriceEntry({
        id: 'missing',
        productId: 'product-2',
        storeId: 'store-2',
        priceYen: 980,
        observedAt: '2026-02-13T08:00:00.000Z'
      })
    ).rejects.toThrow('Price entry not found.');
  });
});

describe('deletePriceEntry', () => {
  it('removes the target entry', async () => {
    webDb.priceEntries = [
      basePriceEntry,
      {
        id: 'pe-2',
        productId: 'product-1',
        storeId: 'store-2',
        priceYen: 900,
        observedAt: '2026-02-13T09:00:00.000Z',
        createdAt: '2026-02-13T08:30:00.000Z'
      }
    ];

    await deletePriceEntry(basePriceEntry.id);

    expect(webDb.priceEntries).toHaveLength(1);
    expect(webDb.priceEntries.find((entry) => entry.id === basePriceEntry.id)).toBeUndefined();
  });

  it('throws when target entry does not exist', async () => {
    webDb.priceEntries = [basePriceEntry];

    await expect(deletePriceEntry('missing')).rejects.toThrow('Price entry not found.');
  });
});

describe('selectLatestByStore', () => {
  it('keeps one row per store and picks newest observedAt first', () => {
const rows = [
      {
        storeId: 's1',
        priceEntryId: 'pe-1-a',
        observedAt: '2026-02-12T10:00:00.000Z',
        createdAt: '2026-02-12T10:01:00.000Z'
      },
      {
        storeId: 's1',
        priceEntryId: 'pe-1-b',
        observedAt: '2026-02-12T11:00:00.000Z',
        createdAt: '2026-02-12T11:00:30.000Z'
      },
      {
        storeId: 's2',
        priceEntryId: 'pe-2',
        observedAt: '2026-02-12T09:00:00.000Z',
        createdAt: '2026-02-12T09:00:10.000Z'
      }
    ];

    const latest = selectLatestByStore(rows);

    expect(latest).toHaveLength(2);
    expect(latest.find((row) => row.storeId === 's1')?.observedAt).toBe('2026-02-12T11:00:00.000Z');
    expect(latest.find((row) => row.storeId === 's2')?.observedAt).toBe('2026-02-12T09:00:00.000Z');
  });

  it('uses newest createdAt when observedAt is equal', () => {
    const latest = selectLatestByStore([
      {
        storeId: 's3',
        priceEntryId: 'pe-3-a',
        observedAt: '2026-02-12T11:00:00.000Z',
        createdAt: '2026-02-12T11:01:00.000Z'
      },
      {
        storeId: 's3',
        priceEntryId: 'pe-3-b',
        observedAt: '2026-02-12T11:00:00.000Z',
        createdAt: '2026-02-12T11:02:00.000Z'
      }
    ]);

    expect(latest[0].createdAt).toBe('2026-02-12T11:02:00.000Z');
  });
});

describe('resolveStoreName', () => {
  it('prefers nickname over system name', () => {
    expect(resolveStoreName({ name: 'Lawson Marunouchi', nickname: 'Office Lawson' })).toBe('Office Lawson');
  });

  it('falls back to system name when nickname is empty', () => {
    expect(resolveStoreName({ name: 'Lawson Marunouchi', nickname: '  ' })).toBe('Lawson Marunouchi');
  });
});
