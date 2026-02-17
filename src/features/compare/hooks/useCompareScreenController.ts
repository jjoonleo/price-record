import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { getLatestStorePricesByProduct } from '../../../db/repositories/priceEntriesRepo';
import { listProductOptions } from '../../../db/repositories/productsRepo';
import { captureCurrentLocation } from '../../../services/locationService';
import { buildStoreComparisons } from '../../../services/rankingService';
import { useFiltersStore } from '../../../state/useFiltersStore';
import { Coordinates, ProductOption, StoreComparison } from '../../../types/domain';
import {
  PriceComparisonRow,
  RecommendationRow,
  buildPriceComparisonRows,
  buildRecommendationRows,
  computeVsAvgPercent,
  formatRelativeAge
} from '../../../utils/compareScreen';
import { openExternalRoute } from '../../../utils/externalMapNavigation';

type Translate = (key: string, params?: Record<string, string | number>) => string;

export type CompareScreenController = {
  selectedProduct: ProductOption | null;
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

  const [products, setProducts] = useState<ProductOption[]>([]);
  const [comparisons, setComparisons] = useState<StoreComparison[]>([]);
  const [userLocation, setUserLocation] = useState<Coordinates | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const refreshForProduct = useCallback(async (productId: string | null, location?: Coordinates) => {
    if (!productId) {
      setComparisons([]);
      return;
    }

    const latestRows = await getLatestStorePricesByProduct(productId);
    setComparisons(buildStoreComparisons(latestRows, location));
  }, []);

  const hydrateScreen = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [productOptions, locationResult] = await Promise.all([listProductOptions(), captureCurrentLocation()]);
      setProducts(productOptions);

      const resolvedProductId = selectedProductId ?? productOptions[0]?.id ?? null;
      if (resolvedProductId !== selectedProductId) {
        setSelectedProductId(resolvedProductId);
        clearHistoryStoreFilter();
      }

      const resolvedLocation = locationResult.status === 'granted' ? locationResult.coordinates : undefined;
      setUserLocation(resolvedLocation);

      await refreshForProduct(resolvedProductId, resolvedLocation);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t('compare_load_error'));
    } finally {
      setIsLoading(false);
    }
  }, [clearHistoryStoreFilter, refreshForProduct, selectedProductId, setSelectedProductId, t]);

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
    [t]
  );

  const applyFullHistoryFilter = useCallback(() => {
    clearHistoryStoreFilter();
  }, [clearHistoryStoreFilter]);

  return {
    selectedProduct,
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
