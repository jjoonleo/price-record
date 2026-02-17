import { getAllSql, runSql } from '../client';
import { createId } from '../../utils/id';
import { HistoryEntry } from '../../types/domain';
import { Platform } from 'react-native';
import { readWebDb, updateWebDb } from '../webStore';
import { getDisplayStoreName } from '../../utils/formatters';

type LatestStorePriceRow = {
  store_id: string;
  store_name: string;
  city_area: string;
  address_line: string | null;
  latitude: number;
  longitude: number;
  price_yen: number;
  observed_at: string;
};

type HistoryRow = {
  id: string;
  product_id: string;
  product_name: string;
  store_id: string;
  store_name: string;
  city_area: string;
  price_yen: number;
  observed_at: string;
  created_at: string;
};

export type LatestStorePrice = {
  storeId: string;
  storeName: string;
  cityArea: string;
  addressLine: string;
  latitude: number;
  longitude: number;
  latestPriceYen: number;
  observedAt: string;
};

export type CreatePriceEntryInput = {
  productId: string;
  storeId: string;
  priceYen: number;
  observedAt: string;
};

export type HistoryFilters = {
  productId?: string;
  storeId?: string;
  limit?: number;
};

type LatestComparable = {
  storeId: string;
  observedAt: string;
  createdAt: string;
};

export const resolveStoreName = (
  store: {
    name: string;
    nickname?: string | null;
  } | null | undefined
): string => {
  if (!store) {
    return 'Unknown store';
  }
  return getDisplayStoreName(store);
};

export const selectLatestByStore = <T extends LatestComparable>(rows: T[]): T[] => {
  const latestMap = new Map<string, T>();

  rows.forEach((row) => {
    const current = latestMap.get(row.storeId);
    if (!current) {
      latestMap.set(row.storeId, row);
      return;
    }

    if (new Date(row.observedAt).getTime() > new Date(current.observedAt).getTime()) {
      latestMap.set(row.storeId, row);
      return;
    }

    if (
      row.observedAt === current.observedAt &&
      new Date(row.createdAt).getTime() > new Date(current.createdAt).getTime()
    ) {
      latestMap.set(row.storeId, row);
    }
  });

  return [...latestMap.values()];
};

export const createPriceEntry = async (input: CreatePriceEntryInput): Promise<void> => {
  if (Platform.OS === 'web') {
    updateWebDb((db) => {
      db.priceEntries.push({
        id: createId(),
        productId: input.productId,
        storeId: input.storeId,
        priceYen: input.priceYen,
        observedAt: input.observedAt,
        createdAt: new Date().toISOString()
      });
    });
    return;
  }

  const id = createId();
  const now = new Date().toISOString();

  await runSql(
    `INSERT INTO price_entries (id, product_id, store_id, price_yen, observed_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?);`,
    [id, input.productId, input.storeId, input.priceYen, input.observedAt, now]
  );
};

export const getLatestStorePricesByProduct = async (
  productId: string,
  cityArea?: string
): Promise<LatestStorePrice[]> => {
  if (Platform.OS === 'web') {
    const area = cityArea?.trim() || null;
    const db = readWebDb();
    const storeById = new Map(db.stores.map((store) => [store.id, store]));
    const latestByStore = new Map<string, { priceYen: number; observedAt: string; createdAt: string }>();

    db.priceEntries.forEach((entry) => {
      if (entry.productId !== productId) {
        return;
      }

      const store = storeById.get(entry.storeId);
      if (!store) {
        return;
      }

      if (area && store.cityArea !== area) {
        return;
      }

      const current = latestByStore.get(entry.storeId);
      if (!current) {
        latestByStore.set(entry.storeId, {
          priceYen: entry.priceYen,
          observedAt: entry.observedAt,
          createdAt: entry.createdAt
        });
        return;
      }

      const currentObserved = new Date(current.observedAt).getTime();
      const nextObserved = new Date(entry.observedAt).getTime();
      if (nextObserved > currentObserved) {
        latestByStore.set(entry.storeId, {
          priceYen: entry.priceYen,
          observedAt: entry.observedAt,
          createdAt: entry.createdAt
        });
        return;
      }

      if (nextObserved === currentObserved) {
        const currentCreated = new Date(current.createdAt).getTime();
        const nextCreated = new Date(entry.createdAt).getTime();
        if (nextCreated > currentCreated) {
          latestByStore.set(entry.storeId, {
            priceYen: entry.priceYen,
            observedAt: entry.observedAt,
            createdAt: entry.createdAt
          });
        }
      }
    });

    return [...latestByStore.entries()]
      .map(([storeId, latest]) => {
        const store = storeById.get(storeId);
        if (!store) {
          return null;
        }
        return {
          storeId,
          storeName: resolveStoreName(store),
          cityArea: store.cityArea,
          addressLine: store.addressLine,
          latitude: store.latitude,
          longitude: store.longitude,
          latestPriceYen: latest.priceYen,
          observedAt: latest.observedAt
        };
      })
      .filter((row): row is LatestStorePrice => Boolean(row))
      .sort((a, b) => {
        if (a.latestPriceYen !== b.latestPriceYen) {
          return a.latestPriceYen - b.latestPriceYen;
        }
        return a.storeName.localeCompare(b.storeName);
      });
  }

  const area = cityArea?.trim() || null;

  const rows = await getAllSql<LatestStorePriceRow>(
    `WITH ranked_entries AS (
      SELECT
        pe.store_id,
        pe.price_yen,
        pe.observed_at,
        pe.created_at,
        COALESCE(NULLIF(TRIM(s.nickname), ''), s.name) AS store_name,
        s.city_area,
        s.address_line,
        s.latitude,
        s.longitude,
        ROW_NUMBER() OVER (
          PARTITION BY pe.store_id
          ORDER BY datetime(pe.observed_at) DESC, datetime(pe.created_at) DESC
        ) AS row_rank
      FROM price_entries pe
      INNER JOIN stores s ON s.id = pe.store_id
      WHERE pe.product_id = ?
        AND (? IS NULL OR s.city_area = ?)
    )
    SELECT
      store_id,
      store_name,
      city_area,
      address_line,
      latitude,
      longitude,
      price_yen,
      observed_at
    FROM ranked_entries
    WHERE row_rank = 1
    ORDER BY price_yen ASC, store_name ASC;`,
    [productId, area, area]
  );

  return rows.map((row) => ({
    storeId: row.store_id,
    storeName: row.store_name,
    cityArea: row.city_area,
    addressLine: row.address_line ?? '',
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    latestPriceYen: Number(row.price_yen),
    observedAt: row.observed_at
  }));
};

export const listHistoryEntries = async ({
  productId,
  storeId,
  limit = 100
}: HistoryFilters = {}): Promise<HistoryEntry[]> => {
  if (Platform.OS === 'web') {
    const safeLimit = Math.max(1, Math.min(limit, 500));
    const db = readWebDb();
    const productById = new Map(db.products.map((product) => [product.id, product]));
    const storeById = new Map(db.stores.map((store) => [store.id, store]));

    return db.priceEntries
      .filter((entry) => {
        if (productId && entry.productId !== productId) {
          return false;
        }
        if (storeId && entry.storeId !== storeId) {
          return false;
        }
        return true;
      })
      .slice()
      .sort((a, b) => {
        const observedDiff = new Date(b.observedAt).getTime() - new Date(a.observedAt).getTime();
        if (observedDiff !== 0) {
          return observedDiff;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .slice(0, safeLimit)
      .map((entry) => {
        const product = productById.get(entry.productId);
        const store = storeById.get(entry.storeId);

        return {
          id: entry.id,
          productId: entry.productId,
          productName: product?.name ?? 'Unknown product',
          storeId: entry.storeId,
          storeName: resolveStoreName(store),
          cityArea: store?.cityArea ?? 'Unknown area',
          priceYen: entry.priceYen,
          observedAt: entry.observedAt,
          createdAt: entry.createdAt
        };
      });
  }

  const safeLimit = Math.max(1, Math.min(limit, 500));
  const resolvedProductId = productId ?? null;
  const resolvedStoreId = storeId ?? null;

  const rows = await getAllSql<HistoryRow>(
    `SELECT
      pe.id,
      pe.product_id,
      p.name AS product_name,
      pe.store_id,
      COALESCE(NULLIF(TRIM(s.nickname), ''), s.name) AS store_name,
      s.city_area,
      pe.price_yen,
      pe.observed_at,
      pe.created_at
    FROM price_entries pe
    INNER JOIN products p ON p.id = pe.product_id
    INNER JOIN stores s ON s.id = pe.store_id
    WHERE (? IS NULL OR pe.product_id = ?)
      AND (? IS NULL OR pe.store_id = ?)
    ORDER BY datetime(pe.observed_at) DESC, datetime(pe.created_at) DESC
    LIMIT ?;`,
    [resolvedProductId, resolvedProductId, resolvedStoreId, resolvedStoreId, safeLimit]
  );

  return rows.map((row) => ({
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    storeId: row.store_id,
    storeName: row.store_name,
    cityArea: row.city_area,
    priceYen: Number(row.price_yen),
    observedAt: row.observed_at,
    createdAt: row.created_at
  }));
};
