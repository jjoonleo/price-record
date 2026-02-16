import { useMemo, useState } from 'react';
import { Language } from '../../../i18n/translations';
import { ProductPriceDetailRouteParams } from '../../../utils/productPriceDetail';
import {
  ParsedProductPriceDetailParams,
  formatDetailObservedAt,
  parseProductPriceDetailRouteParams,
  resolveDetailDealTone
} from '../../../utils/productPriceDetail';

type TranslationFn = (key: any, params?: Record<string, string | number>) => string;

export type ProductPriceDetailControllerInput = {
  rawParams: Partial<Record<keyof ProductPriceDetailRouteParams, string | string[] | undefined>>;
  language: Language;
  t: TranslationFn;
};

export type ProductPriceDetailView = {
  dealTone: 'great' | 'standard';
  dealLabel: string;
  observedLabel: string;
  priceText: string;
};

export const buildProductPriceDetailView = (
  parsedParams: ParsedProductPriceDetailParams,
  locale: string,
  t: TranslationFn
): ProductPriceDetailView => {
  const dealTone = resolveDetailDealTone(parsedParams.latestPriceYen);
  const dealLabel = dealTone === 'great' ? t('detail_badge_great') : t('detail_badge_standard');
  const observedLabel = formatDetailObservedAt(parsedParams.observedAt, locale);
  const priceText = Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0
  })
    .format(parsedParams.latestPriceYen)
    .replace('JP¥', '¥')
    .replace(/\u00A0/g, '')
    .replace('¥', '');

  return {
    dealTone,
    dealLabel,
    observedLabel,
    priceText
  };
};

export const useProductPriceDetailController = ({
  rawParams,
  language,
  t
}: ProductPriceDetailControllerInput) => {
  const locale = language === 'ko' ? 'ko-KR' : 'en-US';
  const parsedParams = useMemo(() => parseProductPriceDetailRouteParams(rawParams), [rawParams]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const detailView = useMemo(() => {
    if (!parsedParams) {
      return null;
    }

    return buildProductPriceDetailView(parsedParams, locale, t);
  }, [locale, parsedParams, t]);

  return {
    parsedParams,
    detailView,
    statusMessage,
    setStatusMessage
  };
};
