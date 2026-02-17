import { StoreComparison } from '../types/domain';
import { formatObservedAt } from './formatters';

export type ProductPriceDetailRouteParams = {
  productId: string;
  productName: string;
  priceEntryId: string;
  entryId?: string;
  storeId: string;
  storeName: string;
  cityArea: string;
  addressLine?: string;
  latitude: string;
  longitude: string;
  latestPriceYen: string;
  observedAt: string;
};

export type ParsedProductPriceDetailParams = {
  productId: string;
  productName: string;
  priceEntryId: string;
  storeId: string;
  storeName: string;
  cityArea: string;
  addressLine?: string;
  latitude: number;
  longitude: number;
  latestPriceYen: number;
  observedAt: string;
};

type ProductContext = {
  id: string;
  name: string;
};

const toParamString = (value: string | string[] | undefined): string | null => {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  if (typeof value === 'string') {
    return value;
  }

  return null;
};

export const buildProductPriceDetailRouteParams = (
  item: StoreComparison,
  product: ProductContext
): ProductPriceDetailRouteParams => ({
  productId: product.id,
  productName: product.name,
  priceEntryId: item.priceEntryId,
  entryId: item.priceEntryId,
  storeId: item.storeId,
  storeName: item.storeName,
  cityArea: item.cityArea,
  addressLine: item.addressLine || undefined,
  latitude: String(item.latitude),
  longitude: String(item.longitude),
  latestPriceYen: String(item.latestPriceYen),
  observedAt: item.observedAt
});

export const parseProductPriceDetailRouteParams = (
  params: Partial<Record<keyof ProductPriceDetailRouteParams, string | string[] | undefined>>
): ParsedProductPriceDetailParams | null => {
  const productId = toParamString(params.productId);
  const productName = toParamString(params.productName);
  const priceEntryId = toParamString(params.priceEntryId ?? params.entryId);
  const storeId = toParamString(params.storeId);
  const storeName = toParamString(params.storeName);
  const cityArea = toParamString(params.cityArea);
  const addressLine = toParamString(params.addressLine) ?? undefined;
  const latitudeRaw = toParamString(params.latitude);
  const longitudeRaw = toParamString(params.longitude);
  const latestPriceRaw = toParamString(params.latestPriceYen);
  const observedAt = toParamString(params.observedAt);

  if (
    !productId ||
    !productName ||
    !priceEntryId ||
    !storeId ||
    !storeName ||
    !cityArea ||
    !latitudeRaw ||
    !longitudeRaw ||
    !latestPriceRaw ||
    !observedAt
  ) {
    return null;
  }

  const latitude = Number(latitudeRaw);
  const longitude = Number(longitudeRaw);
  const latestPriceYen = Number(latestPriceRaw);

  if (
    Number.isNaN(latitude) ||
    Number.isNaN(longitude) ||
    Number.isNaN(latestPriceYen) ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    !Number.isFinite(latestPriceYen)
  ) {
    return null;
  }

  return {
    productId,
    productName,
    priceEntryId,
    storeId,
    storeName,
    cityArea,
    addressLine,
    latitude,
    longitude,
    latestPriceYen,
    observedAt
  };
};

export const formatDetailObservedAt = (isoDate: string, locale: string): string => {
  return formatObservedAt(isoDate, locale);
};

export type DetailDealTone = 'great' | 'standard';

export const resolveDetailDealTone = (latestPriceYen: number): DetailDealTone => {
  return latestPriceYen <= 500 ? 'great' : 'standard';
};
