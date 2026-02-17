import { Platform } from 'react-native';
import { getAllSql, getFirstSql, runSql } from '../client';
import { readWebDb, updateWebDb } from '../webStore';
import { createId } from '../../utils/id';
import { Coordinates, Store } from '../../types/domain';
import { getDisplayStoreName } from '../../utils/formatters';

type StoreRow = {
  id: string;
  name: string;
  nickname: string | null;
  latitude: number;
  longitude: number;
  city_area: string;
  address_line: string | null;
  created_at: string;
};

type RecentStoreRow = StoreRow & {
  last_used_at: string | null;
};

type CityAreaRow = {
  city_area: string;
};

export type StoreIdentityInput = {
  name: string;
  cityArea: string;
  coordinates: Coordinates;
};

export type UpsertStoreInput = StoreIdentityInput & {
  addressLine: string;
  nickname?: string;
};

const COORDINATE_TOLERANCE = 0.0001;

const normalizeNickname = (input?: string | null): string | undefined => {
  const trimmed = input?.trim();
  return trimmed ? trimmed : undefined;
};

const isStoreIdentityMatch = (
  store: { name: string; cityArea: string; latitude: number; longitude: number },
  identity: StoreIdentityInput
): boolean => {
  return (
    store.name.toLowerCase() === identity.name.toLowerCase() &&
    store.cityArea === identity.cityArea &&
    Math.abs(store.latitude - identity.coordinates.latitude) < COORDINATE_TOLERANCE &&
    Math.abs(store.longitude - identity.coordinates.longitude) < COORDINATE_TOLERANCE
  );
};

const mapStore = (row: StoreRow): Store => ({
  id: row.id,
  name: row.name,
  nickname: normalizeNickname(row.nickname),
  latitude: Number(row.latitude),
  longitude: Number(row.longitude),
  cityArea: row.city_area,
  addressLine: row.address_line ?? '',
  createdAt: row.created_at
});

export const getStoreById = async (id: string): Promise<Store | null> => {
  if (Platform.OS === 'web') {
    const store = readWebDb().stores.find((row) => row.id === id);
    return store ? { ...store, nickname: normalizeNickname(store.nickname) } : null;
  }

  const row = await getFirstSql<StoreRow>(
    `SELECT id, name, nickname, latitude, longitude, city_area, address_line, created_at
     FROM stores
     WHERE id = ?
     LIMIT 1;`,
    [id]
  );

  return row ? mapStore(row) : null;
};

export const findStoreByIdentity = async (input: StoreIdentityInput): Promise<Store | null> => {
  const name = input.name.trim();
  const cityArea = input.cityArea.trim();

  if (!name || !cityArea) {
    return null;
  }

  const identity: StoreIdentityInput = {
    name,
    cityArea,
    coordinates: input.coordinates
  };

  if (Platform.OS === 'web') {
    const existing = readWebDb().stores.find((store) => isStoreIdentityMatch(store, identity));
    if (!existing) {
      return null;
    }
    return {
      ...existing,
      nickname: normalizeNickname(existing.nickname)
    };
  }

  const existing = await getFirstSql<StoreRow>(
    `SELECT id, name, nickname, latitude, longitude, city_area, address_line, created_at
     FROM stores
     WHERE lower(name) = lower(?)
       AND city_area = ?
       AND abs(latitude - ?) < ?
       AND abs(longitude - ?) < ?
     LIMIT 1;`,
    [name, cityArea, identity.coordinates.latitude, COORDINATE_TOLERANCE, identity.coordinates.longitude, COORDINATE_TOLERANCE]
  );

  return existing ? mapStore(existing) : null;
};

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
  const nickname = normalizeNickname(input.nickname);

  if (!address) {
    throw new Error('Address is required.');
  }

  const identity: StoreIdentityInput = {
    name,
    cityArea,
    coordinates: { latitude, longitude }
  };

  if (Platform.OS === 'web') {
    const existing = readWebDb().stores.find((row) => isStoreIdentityMatch(row, identity));

    if (existing) {
      const nextAddressLine = existing.addressLine.trim() || address;
      const currentNickname = normalizeNickname(existing.nickname);
      const shouldUpdateAddress = nextAddressLine !== existing.addressLine;
      const shouldUpdateNickname = currentNickname !== nickname;

      if (shouldUpdateAddress || shouldUpdateNickname) {
        updateWebDb((db) => {
          const match = db.stores.find((row) => row.id === existing.id);
          if (!match) {
            return;
          }

          match.addressLine = nextAddressLine;
          if (nickname) {
            match.nickname = nickname;
          } else {
            delete match.nickname;
          }
        });
      }

      return {
        ...existing,
        addressLine: nextAddressLine,
        nickname
      };
    }

    const now = new Date().toISOString();
    const next: Store = {
      id: createId(),
      name,
      nickname,
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
    `SELECT id, name, nickname, latitude, longitude, city_area, address_line, created_at
     FROM stores
     WHERE lower(name) = lower(?)
       AND city_area = ?
       AND abs(latitude - ?) < ?
       AND abs(longitude - ?) < ?
     LIMIT 1;`,
    [name, cityArea, latitude, COORDINATE_TOLERANCE, longitude, COORDINATE_TOLERANCE]
  );

  if (existing) {
    const currentAddress = existing.address_line ?? '';
    const currentNickname = normalizeNickname(existing.nickname);
    const nextAddress = currentAddress.trim() || address;
    const shouldUpdateAddress = nextAddress !== currentAddress;
    const shouldUpdateNickname = currentNickname !== nickname;

    if (shouldUpdateAddress || shouldUpdateNickname) {
      await runSql(`UPDATE stores SET address_line = ?, nickname = ? WHERE id = ?;`, [nextAddress, nickname ?? null, existing.id]);
    }

    return {
      ...mapStore(existing),
      addressLine: nextAddress,
      nickname
    };
  }

  const id = createId();
  const now = new Date().toISOString();

  await runSql(
    `INSERT INTO stores (id, name, nickname, latitude, longitude, city_area, address_line, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    [id, name, nickname ?? null, latitude, longitude, cityArea, address, now]
  );

  return {
    id,
    name,
    nickname,
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
      .sort((a, b) => getDisplayStoreName(a).localeCompare(getDisplayStoreName(b)));
  }

  const area = cityArea?.trim() || null;
  const rows = await getAllSql<StoreRow>(
    `SELECT id, name, nickname, latitude, longitude, city_area, address_line, created_at
     FROM stores
     WHERE (? IS NULL OR city_area = ?)
     ORDER BY lower(COALESCE(NULLIF(TRIM(nickname), ''), name)) ASC;`,
    [area, area]
  );

  return rows.map(mapStore);
};

export const listRecentStores = async (limit = 8, search?: string): Promise<Store[]> => {
  const safeLimit = Math.max(1, Math.min(limit, 50));
  const searchQuery = search?.trim().toLowerCase() || null;

  if (Platform.OS === 'web') {
    const db = readWebDb();
    const latestByStoreId = new Map<string, string>();

    db.priceEntries.forEach((entry) => {
      const current = latestByStoreId.get(entry.storeId);
      if (!current || new Date(entry.createdAt).getTime() > new Date(current).getTime()) {
        latestByStoreId.set(entry.storeId, entry.createdAt);
      }
    });

    const rows = db.stores
      .filter((store) => {
        if (!searchQuery) {
          return true;
        }
        const displayName = getDisplayStoreName(store).toLowerCase();
        return displayName.includes(searchQuery) || store.name.toLowerCase().includes(searchQuery);
      })
      .map((store) => ({
        store,
        lastUsedAt: latestByStoreId.get(store.id) ?? null
      }))
      .sort((a, b) => {
        if (a.lastUsedAt && b.lastUsedAt) {
          const diff = new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime();
          if (diff !== 0) {
            return diff;
          }
        } else if (a.lastUsedAt) {
          return -1;
        } else if (b.lastUsedAt) {
          return 1;
        }

        return getDisplayStoreName(a.store).localeCompare(getDisplayStoreName(b.store));
      });

    return rows.slice(0, safeLimit).map((row) => ({
      ...row.store,
      nickname: normalizeNickname(row.store.nickname)
    }));
  }

  const searchParam = searchQuery ? `%${searchQuery}%` : null;
  const rows = await getAllSql<RecentStoreRow>(
    `SELECT
      s.id,
      s.name,
      s.nickname,
      s.latitude,
      s.longitude,
      s.city_area,
      s.address_line,
      s.created_at,
      MAX(datetime(pe.created_at)) AS last_used_at
    FROM stores s
    LEFT JOIN price_entries pe ON pe.store_id = s.id
    WHERE (
      ? IS NULL
      OR lower(COALESCE(NULLIF(TRIM(s.nickname), ''), s.name)) LIKE ?
      OR lower(s.name) LIKE ?
    )
    GROUP BY s.id, s.name, s.nickname, s.latitude, s.longitude, s.city_area, s.address_line, s.created_at
    ORDER BY
      CASE WHEN last_used_at IS NULL THEN 1 ELSE 0 END ASC,
      datetime(last_used_at) DESC,
      lower(COALESCE(NULLIF(TRIM(s.nickname), ''), s.name)) ASC
    LIMIT ?;`,
    [searchParam, searchParam, searchParam, safeLimit]
  );

  return rows.map((row) => mapStore(row));
};
