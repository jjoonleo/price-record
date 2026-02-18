export type HistoryRouteIntentParams = {
  source?: string | string[];
  productId?: string | string[];
  intentId?: string | string[];
};

export type CompareHistoryIntent = {
  source: 'compare';
  productId?: string;
  intentId: string;
};

const toParamValue = (value: string | string[] | undefined): string | null => {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  if (typeof value === 'string') {
    return value;
  }

  return null;
};

export const buildCompareHistoryIntentParams = (
  productId: string | null,
  now = Date.now()
): CompareHistoryIntent => {
  const params: CompareHistoryIntent = {
    source: 'compare',
    intentId: String(now)
  };

  const trimmedProductId = productId?.trim();
  if (trimmedProductId) {
    params.productId = trimmedProductId;
  }

  return params;
};

export const parseCompareHistoryIntent = (
  params: HistoryRouteIntentParams,
  lastAppliedIntentId: string | null
): { intentId: string; productFilterId: string | null } | null => {
  const source = toParamValue(params.source);
  if (source !== 'compare') {
    return null;
  }

  const intentId = toParamValue(params.intentId)?.trim();
  if (!intentId || intentId === lastAppliedIntentId) {
    return null;
  }

  const productId = toParamValue(params.productId)?.trim() ?? null;

  return {
    intentId,
    productFilterId: productId && productId.length > 0 ? productId : null
  };
};

export const resolveValidHistoryProductFilter = (
  selectedProductFilterId: string | null,
  validProductIds: string[]
): string | null => {
  if (!selectedProductFilterId) {
    return null;
  }

  return validProductIds.includes(selectedProductFilterId)
    ? selectedProductFilterId
    : null;
};
