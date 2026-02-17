import { getAllSql, getFirstSql, runSql } from '../client';
import { createId } from '../../utils/id';
import { Product, ProductOption } from '../../types/domain';
import { Platform } from 'react-native';
import { readWebDb, updateWebDb } from '../webStore';

type ProductRow = {
  id: string;
  name: string;
  normalized_name: string;
  note: string | null;
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
  note: row.note ?? '',
  createdAt: row.created_at
});

type CreateProductInput = {
  name: string;
  note: string;
};

type UpdateProductInput = {
  id: string;
  name: string;
  note: string;
};

const normalizeProductNote = (input: string): string => input.trim();

export const createProduct = async (input: CreateProductInput): Promise<Product> => {
  const cleanedName = input.name.trim();
  if (!cleanedName) {
    throw new Error('Product name is required.');
  }

  const note = normalizeProductNote(input.note);

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
      note,
      createdAt: now
    };

    updateWebDb((db) => {
      db.products.push(next);
    });

    return next;
  }

  const existing = await getFirstSql<ProductRow>(
    `SELECT id, name, normalized_name, note, created_at
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
    `INSERT INTO products (id, name, normalized_name, note, created_at)
     VALUES (?, ?, ?, ?, ?);`,
    [id, cleanedName, normalized, note, now]
  );

  return {
    id,
    name: cleanedName,
    normalizedName: normalized,
    note,
    createdAt: now
  };
};

export const updateProduct = async (input: UpdateProductInput): Promise<Product> => {
  const cleanedName = input.name.trim();
  if (!cleanedName) {
    throw new Error('Product name is required.');
  }

  const note = normalizeProductNote(input.note);
  const normalized = normalizeProductName(cleanedName);

  if (Platform.OS === 'web') {
    const db = readWebDb();
    const existing = db.products.find((row) => row.id === input.id);

    if (!existing) {
      throw new Error('Product not found.');
    }

    const conflictingProduct = db.products.find(
      (row) => row.id !== input.id && row.normalizedName === normalized
    );

    if (conflictingProduct) {
      throw new Error('Another product with the same name already exists.');
    }

    updateWebDb((nextDb) => {
      const target = nextDb.products.find((row) => row.id === input.id);
      if (!target) {
        return;
      }

      target.name = cleanedName;
      target.normalizedName = normalized;
      target.note = note;
    });

    return {
      id: existing.id,
      name: cleanedName,
      normalizedName: normalized,
      note,
      createdAt: existing.createdAt
    };
  }

  const existing = await getFirstSql<ProductRow>(
    `SELECT id, name, normalized_name, note, created_at
     FROM products
     WHERE id = ?
     LIMIT 1;`,
    [input.id]
  );

  if (!existing) {
    throw new Error('Product not found.');
  }

  const conflict = await getFirstSql<ProductRow>(
    `SELECT id, name, normalized_name, note, created_at
     FROM products
     WHERE normalized_name = ? AND id != ?
     LIMIT 1;`,
    [normalized, input.id]
  );

  if (conflict) {
    throw new Error('Another product with the same name already exists.');
  }

  await runSql(`UPDATE products SET name = ?, normalized_name = ?, note = ? WHERE id = ?;`, [
    cleanedName,
    normalized,
    note,
    input.id
  ]);

  return {
    id: existing.id,
    name: cleanedName,
    normalizedName: normalized,
    note,
    createdAt: existing.created_at
  };
};

export const getOrCreateProduct = async (name: string): Promise<Product> => {
  return createProduct({ name, note: '' });
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
    const row = readWebDb().products.find((row) => row.id === id);
    return row ? mapProduct(row) : null;
  }

  const row = await getFirstSql<ProductRow>(
    `SELECT id, name, normalized_name, note, created_at
     FROM products
     WHERE id = ?
     LIMIT 1;`,
    [id]
  );

  return row ? mapProduct(row) : null;
};
