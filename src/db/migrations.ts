import { execSqlBatch, getFirstSql } from './client';
import { Platform } from 'react-native';

type UserVersionRow = {
  user_version: number;
};

const LATEST_DB_VERSION = 3;

const migrationV1 = `
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS stores (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  city_area TEXT NOT NULL,
  address_line TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS price_entries (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  store_id TEXT NOT NULL,
  price_yen INTEGER NOT NULL,
  observed_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_normalized_name ON products(normalized_name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_stores_identity ON stores(name, city_area, latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_price_entries_product_time ON price_entries(product_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_entries_store_product ON price_entries(store_id, product_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_stores_city_area ON stores(city_area);
`;

const migrationV2 = `
ALTER TABLE stores ADD COLUMN nickname TEXT;
`;

const migrationV3 = `
ALTER TABLE products ADD COLUMN note TEXT NOT NULL DEFAULT '';
`;

export const runMigrations = async (): Promise<void> => {
  if (Platform.OS === 'web') {
    return;
  }

  const versionRow = await getFirstSql<UserVersionRow>('PRAGMA user_version;');
  const currentVersion = versionRow?.user_version ?? 0;

  if (currentVersion >= LATEST_DB_VERSION) {
    return;
  }

  if (currentVersion < 1) {
    await execSqlBatch(migrationV1);
  }

  if (currentVersion < 2) {
    await execSqlBatch(migrationV2);
  }

  if (currentVersion < 3) {
    await execSqlBatch(migrationV3);
  }

  await execSqlBatch(`PRAGMA user_version = ${LATEST_DB_VERSION};`);
};
