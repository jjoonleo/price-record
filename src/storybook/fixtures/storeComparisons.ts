import { StoreComparison } from '../../types/domain';

export const storeComparisonsFixture: StoreComparison[] = [
  {
    storeId: 'store-shinjuku-central',
    priceEntryId: 'entry-shinjuku-central',
    storeName: 'Shinjuku Central',
    cityArea: 'Shinjuku',
    addressLine: '3 Chome-1-26 Shinjuku, Tokyo',
    latitude: 35.6908,
    longitude: 139.7004,
    latestPriceYen: 4980,
    observedAt: '2026-02-15T09:10:00.000Z',
    distanceKm: 0.42,
    score: 91.2,
    tags: ['BEST', 'CLOSEST'],
  },
  {
    storeId: 'store-tokyo-station-mart',
    priceEntryId: 'entry-tokyo-station-mart',
    storeName: 'Tokyo Station Mart',
    cityArea: 'Marunouchi',
    addressLine: '1 Chome-9 Marunouchi, Tokyo',
    latitude: 35.6812,
    longitude: 139.7671,
    latestPriceYen: 5290,
    observedAt: '2026-02-15T08:00:00.000Z',
    distanceKm: 2.8,
    score: 85.3,
    tags: ['CHEAPEST'],
  },
  {
    storeId: 'store-kyoto-corner',
    priceEntryId: 'entry-kyoto-corner',
    storeName: 'Kyoto Corner',
    cityArea: 'Kyoto Station',
    addressLine: 'Higashishiokoji Kamadonocho, Kyoto',
    latitude: 34.9858,
    longitude: 135.7588,
    latestPriceYen: 5480,
    observedAt: '2026-02-14T11:20:00.000Z',
    distanceKm: 5.2,
    score: 78.5,
    tags: [],
  },
];

export const featuredStoreFixture: StoreComparison = storeComparisonsFixture[0];
