import { createProduct, getProductById, updateProduct } from '../productsRepo';

type WebDb = {
  products: Array<{
    id: string;
    name: string;
    normalizedName: string;
    note: string;
    imageUri: string;
    createdAt: string;
  }>;
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

describe('productsRepo (web)', () => {
  beforeEach(() => {
    webDb = {
      products: [],
      stores: [],
      priceEntries: []
    };
    mockReadWebDb.mockClear();
    mockUpdateWebDb.mockClear();
  });

  test('creates product with note and trims note text', async () => {
    const product = await createProduct({
      name: '  Matcha KitKat  ',
      note: '  Evening promo only  ',
      imageUri: '  data:image/jpeg;base64,AAA  '
    });

    expect(product.name).toBe('Matcha KitKat');
    expect(product.normalizedName).toBe('matcha kitkat');
    expect(product.note).toBe('Evening promo only');
    expect(product.imageUri).toBe('data:image/jpeg;base64,AAA');
    expect(webDb.products).toHaveLength(1);
    expect(webDb.products[0]?.note).toBe('Evening promo only');
    expect(webDb.products[0]?.imageUri).toBe('data:image/jpeg;base64,AAA');
  });

  test('returns existing product when normalized name already exists', async () => {
    webDb.products.push({
      id: 'product-1',
      name: 'Green Tea',
      normalizedName: 'green tea',
      note: 'first note',
      imageUri: 'data:image/jpeg;base64,EXISTING',
      createdAt: '2026-02-12T09:00:00.000Z'
    });

    const product = await createProduct({
      name: '  GREEN   tea  ',
      note: 'ignored note',
      imageUri: 'data:image/jpeg;base64,NEW'
    });

    expect(product.id).toBe('product-1');
    expect(product.note).toBe('first note');
    expect(product.imageUri).toBe('data:image/jpeg;base64,EXISTING');
    expect(webDb.products).toHaveLength(1);
  });

  test('updates product name, note, and image', async () => {
    webDb.products.push({
      id: 'product-1',
      name: 'Green Tea',
      normalizedName: 'green tea',
      note: 'first note',
      imageUri: '',
      createdAt: '2026-02-12T09:00:00.000Z'
    });

    const product = await updateProduct({
      id: 'product-1',
      name: 'Green Tea Cold Brew',
      note: 'cold brew note',
      imageUri: 'data:image/jpeg;base64,UPDATED'
    });

    expect(product.name).toBe('Green Tea Cold Brew');
    expect(product.normalizedName).toBe('green tea cold brew');
    expect(product.note).toBe('cold brew note');
    expect(product.imageUri).toBe('data:image/jpeg;base64,UPDATED');
    expect(webDb.products[0]?.name).toBe('Green Tea Cold Brew');
    expect(webDb.products[0]?.note).toBe('cold brew note');
    expect(webDb.products[0]?.imageUri).toBe('data:image/jpeg;base64,UPDATED');
  });

  test('can clear product image on update', async () => {
    webDb.products.push({
      id: 'product-1',
      name: 'Green Tea',
      normalizedName: 'green tea',
      note: 'first note',
      imageUri: 'data:image/jpeg;base64,OLD',
      createdAt: '2026-02-12T09:00:00.000Z'
    });

    const product = await updateProduct({
      id: 'product-1',
      name: 'Green Tea',
      note: 'first note',
      imageUri: '   '
    });

    expect(product.imageUri).toBe('');
    expect(webDb.products[0]?.imageUri).toBe('');
  });

  test('throws when updating to a duplicate normalized name', async () => {
    webDb.products.push(
      {
        id: 'product-1',
        name: 'Green Tea',
        normalizedName: 'green tea',
        note: 'first note',
        imageUri: '',
        createdAt: '2026-02-12T09:00:00.000Z'
      },
      {
        id: 'product-2',
        name: 'Mochi',
        normalizedName: 'mochi',
        note: '',
        imageUri: '',
        createdAt: '2026-02-12T09:30:00.000Z'
      }
    );

    await expect(
      updateProduct({
        id: 'product-2',
        name: '  GREEN Tea',
        note: 'duplicate note',
        imageUri: 'data:image/jpeg;base64,IGNORE'
      })
    ).rejects.toThrow('Another product with the same name already exists.');
  });

  test('getProductById defaults missing imageUri to empty string for legacy web rows', async () => {
    webDb.products.push({
      id: 'legacy-1',
      name: 'Legacy Product',
      normalizedName: 'legacy product',
      note: 'legacy note',
      createdAt: '2026-02-12T09:00:00.000Z'
    } as unknown as WebDb['products'][number]);

    const product = await getProductById('legacy-1');
    expect(product?.imageUri).toBe('');
  });

  test('getProductById returns null for missing product', async () => {
    const product = await getProductById('missing-id');
    expect(product).toBeNull();
  });
});
