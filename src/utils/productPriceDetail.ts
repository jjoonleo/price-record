import { StoreComparison } from '../types/domain';
import { formatObservedAt } from './formatters';

export type ProductPriceDetailRouteParams = {
  productId: string;
  productName: string;
  storeId: string;
  storeName: string;
  cityArea: string;
  latitude: string;
  longitude: string;
  latestPriceYen: string;
  observedAt: string;
};

export type ParsedProductPriceDetailParams = {
  productId: string;
  productName: string;
  storeId: string;
  storeName: string;
  cityArea: string;
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
  storeId: item.storeId,
  storeName: item.storeName,
  cityArea: item.cityArea,
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
  const storeId = toParamString(params.storeId);
  const storeName = toParamString(params.storeName);
  const cityArea = toParamString(params.cityArea);
  const latitudeRaw = toParamString(params.latitude);
  const longitudeRaw = toParamString(params.longitude);
  const latestPriceRaw = toParamString(params.latestPriceYen);
  const observedAt = toParamString(params.observedAt);

  if (
    !productId ||
    !productName ||
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
    storeId,
    storeName,
    cityArea,
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
