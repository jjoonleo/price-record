import { getAllSql, getFirstSql, runSql } from '../client';
import { createId } from '../../utils/id';
import { Coordinates, Store } from '../../types/domain';
import { Platform } from 'react-native';
import { readWebDb, updateWebDb } from '../webStore';

type StoreRow = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  city_area: string;
  address_line: string | null;
  created_at: string;
};

type CityAreaRow = {
  city_area: string;
};

export type UpsertStoreInput = {
  name: string;
  cityArea: string;
  coordinates: Coordinates;
  addressLine: string;
};

const mapStore = (row: StoreRow): Store => ({
  id: row.id,
  name: row.name,
  latitude: Number(row.latitude),
  longitude: Number(row.longitude),
  cityArea: row.city_area,
  addressLine: row.address_line ?? '',
  createdAt: row.created_at
});

export const getOrCreateStore = async (input: UpsertStoreInput): Promise<Store> => {
  const name = input.name.trim();
  const cityArea = input.cityArea.trim();

  if (!name) {
    throw new Error('Store name is required.');
  }

  if (!cityArea) {
    throw new Error('City area is required.');
  }

  const { latitude, longitude } = input.coordinates;
  const address = input.addressLine.trim();

  if (!address) {
    throw new Error('Address is required.');
  }

  if (Platform.OS === 'web') {
    const existing = readWebDb().stores.find(
      (row) =>
        row.name.toLowerCase() === name.toLowerCase() &&
        row.cityArea === cityArea &&
        Math.abs(row.latitude - latitude) < 0.0001 &&
        Math.abs(row.longitude - longitude) < 0.0001
    );

    if (existing) {
      if (!existing.addressLine.trim()) {
        updateWebDb((db) => {
          const match = db.stores.find((row) => row.id === existing.id);
          if (match) {
            match.addressLine = address;
          }
        });
      }
      return {
        ...existing,
        addressLine: existing.addressLine.trim() || address
      };
    }

    const now = new Date().toISOString();
    const next: Store = {
      id: createId(),
      name,
      latitude,
      longitude,
      cityArea,
      addressLine: address,
      createdAt: now
    };

    updateWebDb((db) => {
      db.stores.push(next);
    });

    return next;
  }

  const existing = await getFirstSql<StoreRow>(
    `SELECT id, name, latitude, longitude, city_area, address_line, created_at
     FROM stores
     WHERE lower(name) = lower(?)
       AND city_area = ?
       AND abs(latitude - ?) < 0.0001
       AND abs(longitude - ?) < 0.0001
     LIMIT 1;`,
    [name, cityArea, latitude, longitude]
  );

  if (existing) {
    if (!existing.address_line) {
      await runSql(`UPDATE stores SET address_line = ? WHERE id = ?;`, [address, existing.id]);
    }
    return {
      ...mapStore(existing),
      addressLine: existing.address_line ?? address
    };
  }

  const id = createId();
  const now = new Date().toISOString();

  await runSql(
    `INSERT INTO stores (id, name, latitude, longitude, city_area, address_line, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [id, name, latitude, longitude, cityArea, address, now]
  );

  return {
    id,
    name,
    latitude,
    longitude,
    cityArea,
    addressLine: address,
    createdAt: now
  };
};

export const listCityAreas = async (): Promise<string[]> => {
  if (Platform.OS === 'web') {
    const areaCounts = new Map<string, number>();
    readWebDb().stores.forEach((store) => {
      areaCounts.set(store.cityArea, (areaCounts.get(store.cityArea) ?? 0) + 1);
    });

    return [...areaCounts.entries()]
      .sort((a, b) => {
        if (b[1] !== a[1]) {
          return b[1] - a[1];
        }
        return a[0].localeCompare(b[0]);
      })
      .map(([area]) => area);
  }

  const rows = await getAllSql<CityAreaRow>(
    `SELECT city_area
     FROM stores
     GROUP BY city_area
     ORDER BY COUNT(*) DESC, city_area ASC;`
  );

  return rows.map((row) => row.city_area);
};

export const listStores = async (cityArea?: string): Promise<Store[]> => {
  if (Platform.OS === 'web') {
    const area = cityArea?.trim();
    return readWebDb()
      .stores
      .filter((store) => !area || store.cityArea === area)
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  const area = cityArea?.trim() || null;
  const rows = await getAllSql<StoreRow>(
    `SELECT id, name, latitude, longitude, city_area, address_line, created_at
     FROM stores
     WHERE (? IS NULL OR city_area = ?)
     ORDER BY name ASC;`,
    [area, area]
  );

  return rows.map(mapStore);
};
