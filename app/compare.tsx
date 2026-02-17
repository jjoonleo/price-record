import { useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CompareBestValueCard,
  CompareEmptyStateCard,
  CompareHeader,
  CompareHero,
  ComparePriceComparisonCard,
  ComparePriceComparisonRowViewModel,
  CompareRecommendationRowViewModel,
  CompareRecommendationsCard
} from '../src/components/compare';
import { useCompareScreenController } from '../src/features/compare/hooks/useCompareScreenController';
import { useI18n } from '../src/i18n/useI18n';
import { spacing, typography, colors } from '../src/theme/tokens';
import { ProductOption, StoreComparison } from '../src/types/domain';
import { buildProductPriceDetailRouteParams } from '../src/utils/productPriceDetail';
import { resolveProductImageSource } from '../src/utils/productImage';
import { formatYen } from '../src/utils/formatters';

const DEVICE_FRAME_WIDTH = 390;

const toPriceLabel = (value: number, locale: string): string => {
  return formatYen(value, locale).replace('JP¥', '¥').replace(/\u00A0/g, '');
};

const toSignedPercent = (value: number): string => {
  if (value > 0) {
    return `+${value}%`;
  }

  return `${value}%`;
};

export default function CompareScreen() {
  const router = useRouter();
  const { language, t } = useI18n();
  const locale = language === 'ko' ? 'ko-KR' : 'en-US';
  const { width } = useWindowDimensions();
  const frameWidth = Math.min(Math.max(width - spacing.md * 2, 0), DEVICE_FRAME_WIDTH);

  const {
    selectedProduct,
    selectedProductImageUri,
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
  } = useCompareScreenController(t);

  const selectedProductSubtitle = useMemo(() => {
    const productWithMetadata = selectedProduct as (ProductOption & {
      subtitle?: string;
      packageInfo?: string;
    }) | null;
    const subtitle = productWithMetadata?.subtitle ?? productWithMetadata?.packageInfo ?? null;

    return subtitle && subtitle.trim().length > 0 ? subtitle : null;
  }, [selectedProduct]);

  const goToDetail = useCallback(
    (item: StoreComparison) => {
      if (!selectedProduct) {
        setStatusMessage(t('no_item_selected'));
        return;
      }

      router.navigate({
        pathname: '/product-price-detail',
        params: buildProductPriceDetailRouteParams(item, {
          id: selectedProduct.id,
          name: selectedProduct.name
        })
      });
    },
    [router, selectedProduct, setStatusMessage, t]
  );

  const openSelectedProductEdit = useCallback(() => {
    if (!selectedProduct) {
      setStatusMessage(t('no_item_selected'));
      return;
    }

    router.navigate({
      pathname: '/product-form',
      params: {
        mode: 'edit',
        productId: selectedProduct.id,
        returnRoute: '/compare'
      }
    });
  }, [router, selectedProduct, setStatusMessage, t]);

  const handleViewFullHistory = useCallback(() => {
    applyFullHistoryFilter();
    router.navigate('/history');
  }, [applyFullHistoryFilter, router]);

  const handleSelectRecommendation = useCallback(
    (storeId: string) => {
      const target = recommendationRows.find((row) => row.item.storeId === storeId);
      if (!target) {
        return;
      }

      goToDetail(target.item);
    },
    [goToDetail, recommendationRows]
  );

  const priceComparisonViewRows = useMemo<ComparePriceComparisonRowViewModel[]>(() => {
    return priceComparisonRows.map((row) => ({
      storeId: row.item.storeId,
      storeName: row.item.storeName,
      priceText: toPriceLabel(row.item.latestPriceYen, locale),
      widthPercent: row.widthPercent,
      color: row.color,
      isBest: row.isBest
    }));
  }, [locale, priceComparisonRows]);

  const recommendationViewRows = useMemo<CompareRecommendationRowViewModel[]>(() => {
    return recommendationRows.map((row) => ({
      storeId: row.item.storeId,
      rank: row.rank,
      storeName: row.item.storeName,
      metaText: hasLocation
        ? `${row.item.distanceKm.toFixed(1)}km • ${row.item.cityArea}`
        : `${t('compare_distance_unavailable')} • ${row.item.cityArea}`,
      priceText: toPriceLabel(row.item.latestPriceYen, locale),
      statusText:
        row.savingsYen > 0
          ? `${t('compare_save_prefix')} ${toPriceLabel(row.savingsYen, locale)}`
          : t('compare_regular'),
      statusTone: row.savingsYen > 0 ? 'positive' : 'muted'
    }));
  }, [hasLocation, locale, recommendationRows, t]);

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <View style={styles.centerWrap}>
        <View style={[styles.frame, { width: frameWidth }]}>
          <CompareHeader
            title={t('compare_header_title')}
            backLabel={t('back')}
            onBack={() => router.navigate('/capture')}
            onAction={openSelectedProductEdit}
            actionLabel={t('compare_edit_product')}
            actionAccessibilityLabel={t('compare_edit_product_a11y')}
          />

          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <View style={styles.contentColumn}>
              <CompareHero
                imageSource={resolveProductImageSource(selectedProductImageUri)}
                productName={selectedProduct?.name ?? t('no_item_selected')}
                productSubtitle={selectedProductSubtitle}
              />

              {!selectedProduct ? (
                <CompareEmptyStateCard title={t('no_item_selected')} body={t('no_item_selected_body')} />
              ) : null}

              {isLoading ? (
                <View style={styles.loadingWrap}>
                  <ActivityIndicator color={colors.primary} size="small" />
                  <Text style={styles.loadingText}>{t('compare_loading')}</Text>
                </View>
              ) : null}

              {errorMessage ? (
                <View style={styles.errorWrap}>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}

              {!isLoading && !errorMessage && selectedProduct && topChoice ? (
                <>
                  <CompareBestValueCard
                    bestLabel={t('compare_best_value')}
                    priceText={toPriceLabel(topChoice.latestPriceYen, locale)}
                    storeText={`${topChoice.storeName} (${topChoice.cityArea})`}
                    vsAvgPercentText={toSignedPercent(vsAvgPercent)}
                    vsAvgLabel={t('compare_vs_avg')}
                    lastVerifiedText={lastVerifiedLabel ?? t('compare_last_verified', { time: 'now' })}
                    navigateLabel={t('compare_navigate')}
                    onNavigate={() => {
                      void openDirections(topChoice);
                    }}
                  />

                  <ComparePriceComparisonCard
                    title={t('compare_price_comparison')}
                    rows={priceComparisonViewRows}
                    viewHistoryLabel={t('compare_view_full_history')}
                    onViewFullHistory={handleViewFullHistory}
                  />

                  <CompareRecommendationsCard
                    title={t('compare_top_recommendations')}
                    rows={recommendationViewRows}
                    onSelect={handleSelectRecommendation}
                  />
                </>
              ) : null}

              {!isLoading && !errorMessage && selectedProduct && !topChoice ? (
                <CompareEmptyStateCard title={t('compare_empty_title')} body={t('compare_empty_body')} />
              ) : null}

              {statusMessage ? <Text style={styles.statusMessage}>{statusMessage}</Text> : null}
            </View>
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#F6F7F8',
    flex: 1
  },
  centerWrap: {
    alignItems: 'center',
    flex: 1
  },
  frame: {
    backgroundColor: '#F6F7F8',
    flex: 1
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 96
  },
  contentColumn: {
    width: '100%'
  },
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
    paddingBottom: spacing.md
  },
  loadingText: {
    color: '#64748B',
    fontFamily: typography.body,
    fontSize: typography.sizes.caption,
    marginTop: spacing.xs
  },
  errorWrap: {
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md
  },
  errorText: {
    color: colors.danger,
    fontFamily: typography.body,
    fontSize: typography.sizes.caption,
    lineHeight: 18
  },
  statusMessage: {
    color: '#64748B',
    fontFamily: typography.body,
    fontSize: typography.sizes.caption,
    lineHeight: 18,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md
  }
});
