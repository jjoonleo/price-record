import { getAllSql, getFirstSql, runSql } from '../client';
import { createId } from '../../utils/id';
import { Product, ProductOption } from '../../types/domain';
import { Platform } from 'react-native';
import { readWebDb, updateWebDb } from '../webStore';

type ProductRow = {
  id: string;
  name: string;
  normalized_name: string;
  created_at: string;
};

type ProductOptionRow = {
  id: string;
  name: string;
  entry_count: number;
};

export const normalizeProductName = (input: string): string => {
  return input.trim().toLowerCase().replace(/\s+/g, ' ');
};

const mapProduct = (row: ProductRow): Product => ({
  id: row.id,
  name: row.name,
  normalizedName: row.normalized_name,
  createdAt: row.created_at
});

export const getOrCreateProduct = async (name: string): Promise<Product> => {
  const cleanedName = name.trim();
  if (!cleanedName) {
    throw new Error('Product name is required.');
  }

  const normalized = normalizeProductName(cleanedName);

  if (Platform.OS === 'web') {
    const existing = readWebDb().products.find((row) => row.normalizedName === normalized);

    if (existing) {
      return existing;
    }

    const now = new Date().toISOString();
    const next: Product = {
      id: createId(),
      name: cleanedName,
      normalizedName: normalized,
      createdAt: now
    };

    updateWebDb((db) => {
      db.products.push(next);
    });

    return next;
  }

  const existing = await getFirstSql<ProductRow>(
    `SELECT id, name, normalized_name, created_at
     FROM products
     WHERE normalized_name = ?
     LIMIT 1;`,
    [normalized]
  );

  if (existing) {
    return mapProduct(existing);
  }

  const now = new Date().toISOString();
  const id = createId();

  await runSql(
    `INSERT INTO products (id, name, normalized_name, created_at)
     VALUES (?, ?, ?, ?);`,
    [id, cleanedName, normalized, now]
  );

  return {
    id,
    name: cleanedName,
    normalizedName: normalized,
    createdAt: now
  };
};

export const listProductOptions = async (query?: string): Promise<ProductOption[]> => {
  if (Platform.OS === 'web') {
    const search = query?.trim().toLowerCase() || null;
    const db = readWebDb();
    const countByProductId = new Map<string, number>();

    db.priceEntries.forEach((entry) => {
      countByProductId.set(entry.productId, (countByProductId.get(entry.productId) ?? 0) + 1);
    });

    return db.products
      .filter((product) => {
        if (!search) {
          return true;
        }
        return product.name.toLowerCase().includes(search) || product.normalizedName.includes(search);
      })
      .map((product) => ({
        id: product.id,
        name: product.name,
        entryCount: countByProductId.get(product.id) ?? 0
      }))
      .sort((a, b) => {
        if (b.entryCount !== a.entryCount) {
          return b.entryCount - a.entryCount;
        }
        return a.name.localeCompare(b.name);
      });
  }

  const search = query?.trim() ? `%${query.trim()}%` : null;

  const rows = await getAllSql<ProductOptionRow>(
    `SELECT p.id, p.name, COUNT(pe.id) AS entry_count
     FROM products p
     LEFT JOIN price_entries pe ON pe.product_id = p.id
     WHERE (? IS NULL OR p.name LIKE ? OR p.normalized_name LIKE ?)
     GROUP BY p.id
     ORDER BY entry_count DESC, p.name ASC;`,
    [search, search, search]
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    entryCount: Number(row.entry_count)
  }));
};

export const getProductById = async (id: string): Promise<Product | null> => {
  if (Platform.OS === 'web') {
    return readWebDb().products.find((product) => product.id === id) ?? null;
  }

  const row = await getFirstSql<ProductRow>(
    `SELECT id, name, normalized_name, created_at
     FROM products
     WHERE id = ?
     LIMIT 1;`,
    [id]
  );

  return row ? mapProduct(row) : null;
};
