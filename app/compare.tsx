import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getLatestStorePricesByProduct } from '../src/db/repositories/priceEntriesRepo';
import { getProductById } from '../src/db/repositories/productsRepo';
import { useI18n } from '../src/i18n/useI18n';
import { captureCurrentLocation } from '../src/services/locationService';
import { buildStoreComparisons } from '../src/services/rankingService';
import { useFiltersStore } from '../src/state/useFiltersStore';
import { colors, spacing, typography } from '../src/theme/tokens';
import { Coordinates, Product, StoreComparison } from '../src/types/domain';
import { buildPriceComparisonRows, buildRecommendationRows, computeVsAvgPercent, formatRelativeAge } from '../src/utils/compareScreen';
import { openExternalRoute } from '../src/utils/externalMapNavigation';
import { formatYen } from '../src/utils/formatters';
import { buildProductPriceDetailRouteParams } from '../src/utils/productPriceDetail';

const productPlaceholderImage = require('../src/assets/compare-placeholder.png');

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
  const contentWidth = Math.max(0, frameWidth);

  const { selectedProductId, clearHistoryStoreFilter } = useFiltersStore();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [comparisons, setComparisons] = useState<StoreComparison[]>([]);
  const [userLocation, setUserLocation] = useState<Coordinates | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const hydrateScreen = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const locationResult = await captureCurrentLocation();
      const nextLocation = locationResult.status === 'granted' ? locationResult.coordinates : undefined;
      setUserLocation(nextLocation);

      if (!selectedProductId) {
        setSelectedProduct(null);
        setComparisons([]);
        return;
      }

      const [product, latestRows] = await Promise.all([
        getProductById(selectedProductId),
        getLatestStorePricesByProduct(selectedProductId)
      ]);

      setSelectedProduct(product);
      setComparisons(buildStoreComparisons(latestRows, nextLocation));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t('compare_load_error'));
    } finally {
      setIsLoading(false);
    }
  }, [selectedProductId, t]);

  useFocusEffect(
    useCallback(() => {
      void hydrateScreen();
    }, [hydrateScreen])
  );

  const hasLocation = Boolean(userLocation);
  const topChoice = comparisons[0] ?? null;
  const vsAvgPercent = useMemo(() => computeVsAvgPercent(comparisons), [comparisons]);
  const priceComparisonRows = useMemo(() => buildPriceComparisonRows(comparisons), [comparisons]);
  const recommendationRows = useMemo(() => buildRecommendationRows(comparisons), [comparisons]);

  const lastVerified = useMemo(() => {
    if (!topChoice) {
      return null;
    }

    return t('compare_last_verified', { time: formatRelativeAge(topChoice.observedAt) });
  }, [topChoice, t]);

  const goToDetail = useCallback(
    (item: StoreComparison) => {
      if (!selectedProduct) {
        setStatusMessage(t('detail_missing_params_title'));
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
    [router, selectedProduct, t]
  );

  const handleNavigateFromCompare = useCallback(
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

  const handleViewFullHistory = useCallback(() => {
    clearHistoryStoreFilter();
    router.navigate('/history');
  }, [clearHistoryStoreFilter, router]);

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <View style={styles.header}>
        <View style={[styles.headerRow, { width: frameWidth }]}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.navigate('/')}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          >
            <MaterialCommunityIcons color={colors.primary} name="chevron-left" size={19} />
            <Text style={styles.backText}>{t('back')}</Text>
          </Pressable>

          <Text style={styles.headerTitle}>{t('compare_header_title')}</Text>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.navigate('/capture')}
            style={({ pressed }) => [styles.headerAction, pressed && styles.pressed]}
          >
            <MaterialCommunityIcons color={colors.primary} name="qrcode-scan" size={18} />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={[styles.heroSection, { width: contentWidth }]}>
          <View style={styles.productImageCard}>
            <Image source={productPlaceholderImage} style={styles.productImage} />
          </View>
          <Text numberOfLines={2} style={styles.productName}>
            {selectedProduct?.name ?? t('no_item_selected')}
          </Text>
        </View>

        {!selectedProductId ? (
          <View style={[styles.emptyCard, { width: contentWidth }]}>
            <Text style={styles.emptyTitle}>{t('no_item_selected')}</Text>
            <Text style={styles.emptyBody}>{t('no_item_selected_body')}</Text>
          </View>
        ) : null}

        {isLoading ? (
          <View style={[styles.loadingWrap, { width: contentWidth }]}>
            <ActivityIndicator color={colors.primary} size="small" />
            <Text style={styles.loadingText}>{t('compare_loading')}</Text>
          </View>
        ) : null}

        {errorMessage ? (
          <View style={[styles.errorWrap, { width: contentWidth }]}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {!isLoading && !errorMessage && selectedProductId && topChoice ? (
          <>
            <LinearGradient
              colors={['#137FEC', '#2563EB']}
              end={{ x: 1, y: 1 }}
              start={{ x: 0, y: 0 }}
              style={[styles.bestCard, { width: contentWidth }]}
            >
              <View pointerEvents="none" style={styles.bestCardOrbTop} />
              <View pointerEvents="none" style={styles.bestCardOrbBottom} />

              <View style={styles.bestCardTopRow}>
                <View>
                  <View style={styles.bestLabelRow}>
                    <MaterialCommunityIcons color="#DBEAFE" name="star-circle-outline" size={12} />
                    <Text style={styles.bestLabelText}>{t('compare_best_value')}</Text>
                  </View>
                  <Text style={styles.bestPrice}>{toPriceLabel(topChoice.latestPriceYen, locale)}</Text>
                  <Text numberOfLines={1} style={styles.bestStoreText}>
                    {topChoice.storeName} ({topChoice.cityArea})
                  </Text>
                </View>

                <View style={styles.vsAvgChip}>
                  <Text style={styles.vsAvgPercent}>{toSignedPercent(vsAvgPercent)}</Text>
                  <Text style={styles.vsAvgText}>{t('compare_vs_avg')}</Text>
                </View>
              </View>

              <View style={styles.bestCardFooterRow}>
                <View style={styles.verifiedRow}>
                  <MaterialCommunityIcons color="#DBEAFE" name="clock-outline" size={13} />
                  <Text style={styles.verifiedText}>{lastVerified}</Text>
                </View>

                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    void handleNavigateFromCompare(topChoice);
                  }}
                  style={({ pressed }) => [styles.navigateButton, pressed && styles.pressed]}
                >
                  <MaterialCommunityIcons color="#137FEC" name="navigation-variant-outline" size={13} />
                  <Text style={styles.navigateButtonText}>{t('compare_navigate')}</Text>
                </Pressable>
              </View>
            </LinearGradient>

            <View style={[styles.sectionBlock, { width: contentWidth }]}>
              <Text style={styles.sectionLabel}>{t('compare_price_comparison')}</Text>
              <View style={styles.surfaceCard}>
                {priceComparisonRows.map((row) => (
                  <View key={row.item.storeId} style={styles.priceRow}>
                    <View style={styles.priceRowTop}>
                      <Text numberOfLines={1} style={[styles.priceStoreName, row.isBest && styles.priceStoreNameActive]}>
                        {row.item.storeName}
                      </Text>
                      <Text style={[styles.priceStoreValue, row.isBest && styles.priceStoreValueActive]}>
                        {toPriceLabel(row.item.latestPriceYen, locale)}
                      </Text>
                    </View>
                    <View style={styles.priceTrack}>
                      <View
                        style={[
                          styles.priceFill,
                          {
                            width: `${row.widthPercent}%`,
                            backgroundColor: row.color
                          }
                        ]}
                      />
                    </View>
                  </View>
                ))}

                <Pressable
                  accessibilityRole="button"
                  onPress={handleViewFullHistory}
                  style={({ pressed }) => [styles.viewHistoryButton, pressed && styles.pressed]}
                >
                  <Text style={styles.viewHistoryText}>{t('compare_view_full_history')}</Text>
                </Pressable>
              </View>
            </View>

            {recommendationRows.length > 0 ? (
              <View style={[styles.sectionBlock, { width: contentWidth }]}>
                <Text style={styles.sectionLabel}>{t('compare_top_recommendations')}</Text>
                <View style={styles.surfaceCard}>
                  {recommendationRows.map((row, index) => (
                    <Pressable
                      key={row.item.storeId}
                      accessibilityRole="button"
                      onPress={() => goToDetail(row.item)}
                      style={({ pressed }) => [
                        styles.recommendationRow,
                        index > 0 && styles.recommendationRowBorder,
                        pressed && styles.pressed
                      ]}
                    >
                      <View style={[styles.rankBubble, row.rank === 2 ? styles.rankBubbleActive : styles.rankBubbleIdle]}>
                        <Text
                          style={[
                            styles.rankBubbleText,
                            row.rank === 2 ? styles.rankBubbleTextActive : styles.rankBubbleTextIdle
                          ]}
                        >
                          {row.rank}
                        </Text>
                      </View>

                      <View style={styles.recommendationBody}>
                        <Text numberOfLines={1} style={styles.recommendationStoreName}>
                          {row.item.storeName}
                        </Text>
                        <View style={styles.recommendationMetaRow}>
                          <MaterialCommunityIcons color="#94A3B8" name="map-marker-outline" size={12} />
                          <Text numberOfLines={1} style={styles.recommendationMeta}>
                            {hasLocation
                              ? `${row.item.distanceKm.toFixed(1)}km • ${row.item.cityArea}`
                              : `${t('compare_distance_unavailable')} • ${row.item.cityArea}`}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.recommendationPriceWrap}>
                        <Text style={styles.recommendationPrice}>{toPriceLabel(row.item.latestPriceYen, locale)}</Text>
                        <Text style={row.savingsYen > 0 ? styles.recommendationSave : styles.recommendationRegular}>
                          {row.savingsYen > 0
                            ? `${t('compare_save_prefix')} ${toPriceLabel(row.savingsYen, locale)}`
                            : t('compare_regular')}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}
          </>
        ) : null}

        {!isLoading && !errorMessage && selectedProductId && !topChoice ? (
          <View style={[styles.emptyCard, { width: contentWidth }]}>
            <Text style={styles.emptyTitle}>{t('compare_empty_title')}</Text>
            <Text style={styles.emptyBody}>{t('compare_empty_body')}</Text>
          </View>
        ) : null}

        {statusMessage ? <Text style={[styles.statusMessage, { width: contentWidth }]}>{statusMessage}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#F6F7F8',
    flex: 1
  },
  header: {
    alignItems: 'center',
    backgroundColor: 'rgba(246,247,248,0.9)',
    borderBottomColor: 'rgba(0,0,0,0.05)',
    borderBottomWidth: 1,
    paddingBottom: spacing.xs,
    paddingTop: spacing.xs
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 32
  },
  backButton: {
    alignItems: 'center',
    flexDirection: 'row',
    minWidth: 72
  },
  backText: {
    color: colors.primary,
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    lineHeight: 26
  },
  headerTitle: {
    color: '#0F172A',
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    fontWeight: '700',
    lineHeight: 26,
    textAlign: 'center'
  },
  headerAction: {
    alignItems: 'center',
    backgroundColor: 'rgba(226,232,240,0.5)',
    borderRadius: 999,
    height: 32,
    justifyContent: 'center',
    width: 35
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 96,
    paddingTop: spacing.md
  },
  heroSection: {
    alignItems: 'center',
    paddingBottom: 20,
    paddingTop: 10
  },
  productImageCard: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.borderSubtle,
    borderRadius: 16,
    borderWidth: 1,
    height: 104,
    justifyContent: 'center',
    marginBottom: spacing.md,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    width: 104
  },
  productImage: {
    borderRadius: 8,
    height: 76,
    width: 76
  },
  productName: {
    color: '#0F172A',
    fontFamily: typography.body,
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
    marginBottom: 4,
    textAlign: 'center'
  },
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
    paddingBottom: spacing.md,
    width: '100%'
  },
  loadingText: {
    color: '#64748B',
    fontFamily: typography.body,
    fontSize: typography.sizes.caption,
    marginTop: spacing.xs
  },
  errorWrap: {
    paddingBottom: spacing.md,
    width: '100%'
  },
  errorText: {
    color: colors.danger,
    fontFamily: typography.body,
    fontSize: typography.sizes.caption,
    lineHeight: 18
  },
  bestCard: {
    borderRadius: 16,
    marginBottom: spacing.xl,
    overflow: 'hidden',
    padding: spacing.lg,
    position: 'relative'
  },
  bestCardOrbTop: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 999,
    height: 128,
    position: 'absolute',
    right: -40,
    top: -40,
    width: 128
  },
  bestCardOrbBottom: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 999,
    bottom: -32,
    height: 96,
    left: -32,
    position: 'absolute',
    width: 96
  },
  bestCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  bestLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6
  },
  bestLabelText: {
    color: '#DBEAFE',
    fontFamily: typography.body,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
    lineHeight: 16,
    textTransform: 'uppercase'
  },
  bestPrice: {
    color: colors.white,
    fontFamily: typography.body,
    fontSize: 42,
    fontWeight: '700',
    letterSpacing: -0.7,
    lineHeight: 42,
    marginBottom: 2
  },
  bestStoreText: {
    color: '#DBEAFE',
    fontFamily: typography.body,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    maxWidth: 190
  },
  vsAvgChip: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    justifyContent: 'center',
    minWidth: 60,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  vsAvgPercent: {
    color: colors.white,
    fontFamily: typography.body,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16
  },
  vsAvgText: {
    color: 'rgba(255,255,255,0.85)',
    fontFamily: typography.body,
    fontSize: 10,
    lineHeight: 15
  },
  bestCardFooterRow: {
    alignItems: 'center',
    borderTopColor: 'rgba(255,255,255,0.2)',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16
  },
  verifiedRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    maxWidth: '58%'
  },
  verifiedText: {
    color: '#DBEAFE',
    fontFamily: typography.body,
    fontSize: 12,
    lineHeight: 16
  },
  navigateButton: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 999,
    flexDirection: 'row',
    gap: 4,
    minHeight: 32,
    paddingHorizontal: 16,
    paddingVertical: 6
  },
  navigateButtonText: {
    color: '#137FEC',
    fontFamily: typography.body,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20
  },
  sectionBlock: {
    marginBottom: spacing.xl
  },
  sectionLabel: {
    color: '#64748B',
    fontFamily: typography.body,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.35,
    lineHeight: 20,
    marginBottom: spacing.sm,
    textTransform: 'uppercase'
  },
  surfaceCard: {
    backgroundColor: colors.white,
    borderColor: colors.borderSubtle,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2
  },
  priceRow: {
    marginBottom: spacing.md
  },
  priceRowTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  priceStoreName: {
    color: '#0F172A',
    flexShrink: 1,
    fontFamily: typography.body,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    paddingRight: spacing.sm
  },
  priceStoreNameActive: {
    fontWeight: '600'
  },
  priceStoreValue: {
    color: '#64748B',
    fontFamily: typography.body,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20
  },
  priceStoreValueActive: {
    color: '#137FEC',
    fontWeight: '700'
  },
  priceTrack: {
    backgroundColor: '#F1F5F9',
    borderRadius: 999,
    height: 10,
    overflow: 'hidden'
  },
  priceFill: {
    borderRadius: 999,
    height: 10
  },
  viewHistoryButton: {
    alignItems: 'center',
    borderTopColor: '#F1F5F9',
    borderTopWidth: 1,
    marginTop: 4,
    paddingBottom: 14,
    paddingTop: 13
  },
  viewHistoryText: {
    color: '#137FEC',
    fontFamily: typography.body,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20
  },
  recommendationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 72,
    paddingVertical: 16
  },
  recommendationRowBorder: {
    borderTopColor: '#F1F5F9',
    borderTopWidth: 1
  },
  rankBubble: {
    alignItems: 'center',
    borderRadius: 999,
    height: 32,
    justifyContent: 'center',
    marginRight: spacing.md,
    width: 32
  },
  rankBubbleActive: {
    backgroundColor: '#DCFCE7'
  },
  rankBubbleIdle: {
    backgroundColor: '#F1F5F9'
  },
  rankBubbleText: {
    fontFamily: typography.body,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20
  },
  rankBubbleTextActive: {
    color: '#16A34A'
  },
  rankBubbleTextIdle: {
    color: '#475569'
  },
  recommendationBody: {
    flex: 1,
    marginRight: spacing.sm
  },
  recommendationStoreName: {
    color: '#0F172A',
    fontFamily: typography.body,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22.5,
    marginBottom: 2
  },
  recommendationMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3
  },
  recommendationMeta: {
    color: '#64748B',
    fontFamily: typography.body,
    fontSize: 12,
    lineHeight: 16
  },
  recommendationPriceWrap: {
    alignItems: 'flex-end'
  },
  recommendationPrice: {
    color: '#0F172A',
    fontFamily: typography.body,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24
  },
  recommendationSave: {
    color: '#16A34A',
    fontFamily: typography.body,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16
  },
  recommendationRegular: {
    color: '#94A3B8',
    fontFamily: typography.body,
    fontSize: 12,
    lineHeight: 16
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderColor: colors.borderSubtle,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: spacing.xl,
    padding: spacing.lg,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2
  },
  emptyTitle: {
    color: '#0F172A',
    fontFamily: typography.body,
    fontSize: typography.sizes.headingSm,
    fontWeight: '700',
    lineHeight: 30,
    marginBottom: 4
  },
  emptyBody: {
    color: '#64748B',
    fontFamily: typography.body,
    fontSize: typography.sizes.body,
    lineHeight: 23
  },
  statusMessage: {
    color: '#64748B',
    fontFamily: typography.body,
    fontSize: typography.sizes.caption,
    lineHeight: 18,
    marginBottom: spacing.sm
  },
  pressed: {
    opacity: 0.85
  }
});
