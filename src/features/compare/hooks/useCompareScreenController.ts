import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo } from 'react';
import { shallow } from 'zustand/shallow';
import { useFiltersStore } from '../../../state/useFiltersStore';
import { ProductOption, StoreComparison } from '../../../types/domain';
import {
  PriceComparisonRow,
  RecommendationRow,
  buildPriceComparisonRows,
  buildRecommendationRows,
  computeVsAvgPercent,
  formatRelativeAge
} from '../../../utils/compareScreen';
import { openExternalRoute } from '../../../utils/externalMapNavigation';
import { TranslationKey } from '../../../i18n/translations';
import { compareScreenSelectors } from '../store/compareScreenSelectors';
import { useCompareScreenStoreWithEquality } from '../store/compareScreenStoreContext';

type Translate = (key: TranslationKey, params?: Record<string, string | number>) => string;

export type CompareScreenController = {
  selectedProduct: ProductOption | null;
  selectedProductImageUri: string;
  comparisons: StoreComparison[];
  topChoice: StoreComparison | null;
  hasLocation: boolean;
  isLoading: boolean;
  errorMessage: string | null;
  statusMessage: string | null;
  setStatusMessage: (message: string | null) => void;
  priceComparisonRows: PriceComparisonRow[];
  recommendationRows: RecommendationRow[];
  vsAvgPercent: number;
  lastVerifiedLabel: string | null;
  openDirections: (item: StoreComparison) => Promise<void>;
  applyFullHistoryFilter: () => void;
};

export const useCompareScreenController = (t: Translate): CompareScreenController => {
  const { selectedProductId, setSelectedProductId, clearHistoryStoreFilter } = useFiltersStore();

  const {
    products,
    comparisons,
    selectedProductImageUri,
    userLocation,
    isLoading,
    errorMessage,
    statusMessage,
    hydrateStore,
    setStatusMessage
  } = useCompareScreenStoreWithEquality(
    (state) => ({
      products: compareScreenSelectors.products(state),
      comparisons: compareScreenSelectors.comparisons(state),
      selectedProductImageUri: compareScreenSelectors.selectedProductImageUri(state),
      userLocation: compareScreenSelectors.userLocation(state),
      isLoading: compareScreenSelectors.isLoading(state),
      errorMessage: compareScreenSelectors.errorMessage(state),
      statusMessage: compareScreenSelectors.statusMessage(state),
      hydrateStore: compareScreenSelectors.hydrateScreen(state),
      setStatusMessage: compareScreenSelectors.setStatusMessage(state)
    }),
    shallow
  );

  const hydrateScreen = useCallback(async () => {
    await hydrateStore({
      selectedProductId,
      setSelectedProductId,
      clearHistoryStoreFilter,
      compareLoadErrorMessage: t('compare_load_error')
    });
  }, [clearHistoryStoreFilter, hydrateStore, selectedProductId, setSelectedProductId, t]);

  useFocusEffect(
    useCallback(() => {
      void hydrateScreen();
    }, [hydrateScreen])
  );

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId) ?? null,
    [products, selectedProductId]
  );

  const topChoice = comparisons[0] ?? null;
  const hasLocation = Boolean(userLocation);

  const priceComparisonRows = useMemo(() => buildPriceComparisonRows(comparisons, 4), [comparisons]);
  const recommendationRows = useMemo(() => buildRecommendationRows(comparisons, 3), [comparisons]);
  const vsAvgPercent = useMemo(() => computeVsAvgPercent(comparisons), [comparisons]);

  const lastVerifiedLabel = useMemo(() => {
    if (!topChoice) {
      return null;
    }

    return t('compare_last_verified', { time: formatRelativeAge(topChoice.observedAt) });
  }, [topChoice, t]);

  const openDirections = useCallback(
    async (item: StoreComparison) => {
      const didOpen = await openExternalRoute({
        latitude: item.latitude,
        longitude: item.longitude,
        label: item.storeName,
        mode: 'transit'
      });

      if (!didOpen) {
        setStatusMessage(t('navigation_open_failed'));
      }
    },
    [setStatusMessage, t]
  );

  const applyFullHistoryFilter = useCallback(() => {
    clearHistoryStoreFilter();
  }, [clearHistoryStoreFilter]);

  return {
    selectedProduct,
    selectedProductImageUri,
    comparisons,
    topChoice,
    hasLocation,
    isLoading,
    errorMessage,
    statusMessage,
    setStatusMessage,
    priceComparisonRows,
    recommendationRows,
    vsAvgPercent,
    lastVerifiedLabel,
    openDirections,
    applyFullHistoryFilter
  };
};
