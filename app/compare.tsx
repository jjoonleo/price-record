import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppCard } from '../src/components/ui/AppCard';
import { PrimaryButton } from '../src/components/ui/PrimaryButton';
import {
  getLatestStorePricesByProduct,
  listHistoryEntries
} from '../src/db/repositories/priceEntriesRepo';
import { listProductOptions } from '../src/db/repositories/productsRepo';
import { useI18n } from '../src/i18n/useI18n';
import { captureCurrentLocation } from '../src/services/locationService';
import { buildStoreComparisons } from '../src/services/rankingService';
import { useFiltersStore } from '../src/state/useFiltersStore';
import { colors, spacing, typography } from '../src/theme/tokens';
import { Coordinates, HistoryEntry, ProductOption, StoreComparison } from '../src/types/domain';
import { compactStoreLabel, formatYen } from '../src/utils/formatters';
import { buildProductPriceDetailRouteParams } from '../src/utils/productPriceDetail';

const historyBarColors = [colors.primary, 'rgba(88,86,214,0.6)', 'rgba(156,163,175,0.6)'] as const;

type BadgeTone = 'best' | 'closest' | 'none';

const resolveBadgeTone = (item: StoreComparison, rank: number): BadgeTone => {
  if (item.tags.includes('BEST') || rank === 1) {
    return 'best';
  }

  if (item.tags.includes('CLOSEST')) {
    return 'closest';
  }

  return 'none';
};

const toPriceLabel = (value: number, locale: string): string =>
  formatYen(value, locale).replace('JP¥', '¥').replace(/\u00A0/g, '');

const buildPreviousPriceMap = (entries: HistoryEntry[]): Record<string, number> => {
  const grouped = new Map<string, number[]>();

  entries.forEach((entry) => {
    const prices = grouped.get(entry.storeId) ?? [];
    prices.push(entry.priceYen);
    grouped.set(entry.storeId, prices);
  });

  const previousByStoreId: Record<string, number> = {};
  grouped.forEach((prices, storeId) => {
    if (prices.length < 2) {
      return;
    }

    const latest = prices[0];
    const previousDistinct = prices.find((price, index) => index > 0 && price !== latest) ?? prices[1];
    previousByStoreId[storeId] = previousDistinct;
  });

  return previousByStoreId;
};

const toDistanceLabel = (distanceKm: number, hasLocation: boolean, unavailableText: string): string => {
  if (!hasLocation) {
    return unavailableText;
  }

  return `${distanceKm.toFixed(1)} km`;
};

export default function CompareScreen() {
  const router = useRouter();
  const { language, t } = useI18n();
  const locale = language === 'ko' ? 'ko-KR' : 'en-US';
  const { width } = useWindowDimensions();
  const frameWidth = Math.min(width - spacing.md * 2, 448);
  const { selectedProductId, setSelectedProductId, clearHistoryStoreFilter } = useFiltersStore();

  const [products, setProducts] = useState<ProductOption[]>([]);
  const [comparisons, setComparisons] = useState<StoreComparison[]>([]);
  const [previousPriceByStoreId, setPreviousPriceByStoreId] = useState<Record<string, number>>({});
  const [userLocation, setUserLocation] = useState<Coordinates | undefined>();
  const [savedStoreIds, setSavedStoreIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const refreshForProduct = useCallback(async (productId: string | null, location?: Coordinates) => {
    if (!productId) {
      setComparisons([]);
      setPreviousPriceByStoreId({});
      return;
    }

    const [latestRows, historyRows] = await Promise.all([
      getLatestStorePricesByProduct(productId),
      listHistoryEntries({ productId, limit: 300 })
    ]);

    setComparisons(buildStoreComparisons(latestRows, location));
    setPreviousPriceByStoreId(buildPreviousPriceMap(historyRows));
  }, []);

  const hydrateScreen = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [productOptions, locationResult] = await Promise.all([
        listProductOptions(),
        captureCurrentLocation()
      ]);

      setProducts(productOptions);

      const selectedProductExists = Boolean(
        selectedProductId && productOptions.some((product) => product.id === selectedProductId)
      );
      const resolvedProductId = selectedProductExists ? selectedProductId : productOptions[0]?.id ?? null;

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

  const topChoice = comparisons[0];
  const hasLocation = Boolean(userLocation);
  const recommendationItems = useMemo(() => comparisons.slice(0, 3), [comparisons]);
  const historyItems = useMemo(() => comparisons.slice(0, 3), [comparisons]);

  const maxHistoryPrice = useMemo(() => {
    const peak = historyItems.length > 0 ? Math.max(...historyItems.map((item) => item.latestPriceYen)) : 0;
    const maxValue = Math.max(200, peak);
    return Math.ceil(maxValue / 100) * 100;
  }, [historyItems]);

  const maxRecommendationPrice = useMemo(
    () => (recommendationItems.length > 0 ? Math.max(...recommendationItems.map((item) => item.latestPriceYen)) : 0),
    [recommendationItems]
  );

  const minHistoryPrice = useMemo(
    () => (historyItems.length > 0 ? Math.min(...historyItems.map((item) => item.latestPriceYen)) : 0),
    [historyItems]
  );

  const historyPeakPrice = useMemo(
    () => (historyItems.length > 0 ? Math.max(...historyItems.map((item) => item.latestPriceYen)) : 0),
    [historyItems]
  );

  const historyPriceRange = useMemo(
    () => Math.max(1, historyPeakPrice - minHistoryPrice),
    [historyPeakPrice, minHistoryPrice]
  );

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId) ?? null,
    [products, selectedProductId]
  );

  const handleToggleSaved = (storeId: string) => {
    setSavedStoreIds((previous) => {
      if (previous.includes(storeId)) {
        setStatusMessage(t('compare_unsaved'));
        return previous.filter((id) => id !== storeId);
      }

      setStatusMessage(t('compare_saved'));
      return [...previous, storeId];
    });
  };

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
    [router, selectedProduct, t]
  );

  const handleBack = useCallback(() => {
    router.navigate('/');
  }, [router]);

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <View style={styles.header}>
        <View style={[styles.headerRow, { width: frameWidth }]}> 
          <Pressable
            accessibilityRole="button"
            onPress={handleBack}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          >
            <MaterialCommunityIcons color={colors.primary} name="chevron-left" size={19} />
            <Text style={styles.backText}>{t('back')}</Text>
          </Pressable>

          <View pointerEvents="none" style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>{t('compare_header_title')}</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.navigate('/capture')}
            style={({ pressed }) => [styles.headerAction, pressed && styles.pressed]}
          >
            <MaterialCommunityIcons color={colors.primary} name="qrcode-scan" size={18} />
          </Pressable>
        </View>

        <View style={[styles.compareItemRow, { width: frameWidth }]}>
          <Text style={styles.compareItemLabel}>{t('compare_current_item')}:</Text>
          <Text numberOfLines={1} style={styles.compareItemValue}>
            {selectedProduct?.name ?? t('no_item_selected')}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.mainColumn, { width: frameWidth }]}> 
          {isLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={colors.primary} size="small" />
              <Text style={styles.loadingText}>{t('compare_loading')}</Text>
            </View>
          ) : null}

          {!isLoading && !topChoice ? (
            <AppCard style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>{t('compare_empty_title')}</Text>
              <Text style={styles.emptyBody}>{t('compare_empty_body')}</Text>
            </AppCard>
          ) : null}

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          {!isLoading && topChoice ? (
            <>
              <AppCard style={styles.bestCard}>
                <View style={styles.bestCardHeaderRow}>
                  <View style={styles.bestBadge}>
                    <MaterialCommunityIcons color={colors.primary} name="trophy-outline" size={11} />
                    <Text style={styles.bestBadgeText}>{t('compare_best_value')}</Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => handleToggleSaved(topChoice.storeId)}
                    style={({ pressed }) => [styles.bookmarkButton, pressed && styles.pressed]}
                  >
                    <MaterialCommunityIcons
                      color={colors.primary}
                      name={savedStoreIds.includes(topChoice.storeId) ? 'bookmark' : 'bookmark-outline'}
                      size={18}
                    />
                  </Pressable>
                </View>

                <Pressable
                  accessibilityRole="button"
                  onPress={() => goToDetail(topChoice)}
                  style={({ pressed }) => [styles.bestCardInfoPressable, pressed && styles.pressed]}
                >
                  <View style={styles.bestCardInfoRow}>
                    <View style={styles.bestStoreMeta}>
                      <Text numberOfLines={1} style={styles.bestStoreName}>
                        {topChoice.storeName}
                      </Text>
                      <View style={styles.bestStoreSubRow}>
                        <MaterialCommunityIcons color={colors.textTertiary} name="map-marker" size={13} />
                        <Text numberOfLines={1} style={styles.bestStoreSubText}>
                          {topChoice.cityArea} {'  '}• {'  '}
                          {toDistanceLabel(topChoice.distanceKm, hasLocation, t('compare_distance_unavailable'))}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.bestStorePrice}>{toPriceLabel(topChoice.latestPriceYen, locale)}</Text>
                  </View>
                </Pressable>

                <View style={styles.bestActionsRow}>
                  <PrimaryButton
                    label={t('compare_navigate')}
                    onPress={() => goToDetail(topChoice)}
                    style={styles.navigateButton}
                    textStyle={styles.navigateButtonText}
                  />
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => goToDetail(topChoice)}
                    style={({ pressed }) => [styles.infoButton, pressed && styles.pressed]}
                  >
                    <MaterialCommunityIcons color={colors.primary} name="information" size={16} />
                  </Pressable>
                </View>
              </AppCard>

              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeadingRow}>
                  <Text style={styles.sectionTitleInline}>{t('compare_price_history')}</Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => router.navigate('/history')}
                    style={({ pressed }) => [styles.sectionLinkWrap, pressed && styles.pressed]}
                  >
                    <Text style={styles.sectionLink}>{t('compare_see_all')}</Text>
                  </Pressable>
                </View>
                <AppCard style={styles.historyCard}>
                  {historyItems.map((item, index) => {
                    const normalized = historyPriceRange <= 1 ? 0.7 : (item.latestPriceYen - minHistoryPrice) / historyPriceRange;
                    const widthPercent = historyPriceRange <= 1 ? 65 : 35 + normalized * 43;

                    return (
                      <View key={item.storeId} style={styles.historyRow}>
                        <View style={styles.historyRowTop}>
                          <View style={styles.historyStoreNameWrap}>
                            <Text numberOfLines={1} style={index === 0 ? styles.historyTopStoreName : styles.historyStoreName}>
                              {item.storeName}
                            </Text>
                            {index === 0 ? (
                              <MaterialCommunityIcons color="#F6BE00" name="star" size={11} style={styles.historyStar} />
                            ) : null}
                          </View>
                          <Text style={index === 0 ? styles.historyTopPrice : styles.historyPrice}>
                            {toPriceLabel(item.latestPriceYen, locale)}
                          </Text>
                        </View>
                        <View style={styles.historyTrack}>
                          <View
                            style={[
                              styles.historyFill,
                              {
                                width: `${Math.max(8, Math.min(100, widthPercent))}%`,
                                backgroundColor: historyBarColors[index] ?? 'rgba(156,163,175,0.6)'
                              }
                            ]}
                          />
                        </View>
                      </View>
                    );
                  })}
                  <View style={styles.historyAxis}>
                    <Text style={styles.historyAxisText}>¥0</Text>
                    <Text style={styles.historyAxisText}>¥{Math.round(maxHistoryPrice / 2)}</Text>
                    <Text style={styles.historyAxisText}>¥{maxHistoryPrice}</Text>
                  </View>
                </AppCard>
              </View>

              <View style={styles.sectionBlock}>
                <Text style={styles.sectionTitle}>{t('compare_top_recommendations')}</Text>
                <AppCard padded={false} style={styles.recommendationsCard}>
                  {recommendationItems.map((item, index) => {
                    const rank = index + 1;
                    const badgeTone = resolveBadgeTone(item, rank);
                    const hasPreviousPrice = previousPriceByStoreId[item.storeId] > item.latestPriceYen;
                    const savings = Math.max(0, maxRecommendationPrice - item.latestPriceYen);
                    const badgeStyle =
                      badgeTone === 'best'
                        ? styles.badgeBest
                        : badgeTone === 'closest'
                          ? styles.badgeClosest
                          : null;
                    const badgeTextStyle =
                      badgeTone === 'best'
                        ? styles.badgeBestText
                        : badgeTone === 'closest'
                          ? styles.badgeClosestText
                          : null;
                    const badgeText =
                      badgeTone === 'best'
                        ? t('tag_best')
                        : badgeTone === 'closest'
                          ? t('tag_closest')
                          : null;

                    return (
                      <Pressable
                        key={item.storeId}
                        accessibilityRole="button"
                        onPress={() => goToDetail(item)}
                        style={({ pressed }) => [
                          styles.recommendationRow,
                          rank > 1 && styles.recommendationRowBorder,
                          pressed && styles.pressed
                        ]}
                      >
                        <Text style={rank === 1 ? styles.rankTextActive : styles.rankText}>{rank}</Text>
                        <View style={styles.recommendationBody}>
                          <View style={styles.recommendationNameRow}>
                            <Text numberOfLines={1} style={rank === 1 ? styles.recommendationNameTop : styles.recommendationName}>
                              {rank === 2 ? compactStoreLabel(item.storeName) : item.storeName}
                            </Text>
                            {badgeText && badgeStyle && badgeTextStyle ? (
                              <View style={[styles.badge, badgeStyle]}>
                                <Text style={[styles.badgeText, badgeTextStyle]}>{badgeText}</Text>
                              </View>
                            ) : null}
                          </View>
                          <View style={styles.recommendationMetaRow}>
                            <Text style={styles.recommendationMeta}>{item.cityArea}</Text>
                            <Text style={styles.recommendationBullet}>•</Text>
                            <Text style={styles.recommendationMeta}>
                              {rank === 1 ? t('compare_open_24h') : toDistanceLabel(item.distanceKm, hasLocation, t('compare_distance_unavailable'))}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.recommendationPriceWrap}>
                          <Text style={rank === 1 ? styles.recommendationPriceTop : styles.recommendationPrice}>
                            {toPriceLabel(item.latestPriceYen, locale)}
                          </Text>
                          {rank === 1 && savings > 0 ? (
                            <Text style={styles.recommendationSaveText}>
                              {t('compare_save_prefix')} {toPriceLabel(savings, locale)}
                            </Text>
                          ) : null}
                          {rank === 2 && hasPreviousPrice ? (
                            <Text style={styles.recommendationOldPrice}>
                              {toPriceLabel(previousPriceByStoreId[item.storeId], locale)}
                            </Text>
                          ) : null}
                        </View>
                        <MaterialCommunityIcons color={colors.textDisabled} name="chevron-right" size={16} />
                      </Pressable>
                    );
                  })}
                </AppCard>
              </View>
            </>
          ) : null}

          {statusMessage ? <Text style={styles.statusMessage}>{statusMessage}</Text> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1
  },
  header: {
    backgroundColor: 'rgba(242,242,247,0.92)',
    borderBottomColor: colors.borderSubtle,
    borderBottomWidth: 1,
    paddingBottom: spacing.sm,
    paddingTop: spacing.xs
  },
  headerRow: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    height: 36,
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.md,
    position: 'relative'
  },
  backButton: {
    alignItems: 'center',
    flexDirection: 'row',
    minWidth: 70
  },
  backText: {
    color: colors.primary,
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    lineHeight: 26
  },
  headerTitle: {
    color: colors.black,
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    fontWeight: '700',
    lineHeight: 26,
    textAlign: 'center'
  },
  headerTitleWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0
  },
  headerAction: {
    alignItems: 'center',
    height: 35,
    justifyContent: 'center',
    width: 35
  },
  compareItemRow: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: spacing.md
  },
  compareItemLabel: {
    color: colors.textSecondary,
    fontFamily: typography.body,
    fontSize: typography.sizes.micro,
    fontWeight: '600',
    lineHeight: 16
  },
  compareItemValue: {
    color: colors.textPrimary,
    flex: 1,
    fontFamily: typography.body,
    fontSize: typography.sizes.caption,
    fontWeight: '600',
    lineHeight: 18
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 120,
    paddingTop: spacing.md
  },
  mainColumn: {
    minHeight: '100%'
  },
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100
  },
  loadingText: {
    color: colors.textSecondary,
    fontFamily: typography.body,
    fontSize: typography.sizes.caption,
    marginTop: spacing.xs
  },
  emptyCard: {
    borderRadius: 20,
    marginBottom: spacing.md
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontFamily: typography.body,
    fontSize: typography.sizes.headingSm,
    fontWeight: '700',
    lineHeight: 30,
    marginBottom: 4
  },
  emptyBody: {
    color: colors.textSecondary,
    fontFamily: typography.body,
    fontSize: typography.sizes.body,
    lineHeight: 23
  },
  errorText: {
    color: colors.danger,
    fontFamily: typography.body,
    fontSize: typography.sizes.caption,
    marginBottom: spacing.sm,
    marginTop: spacing.xs
  },
  bestCard: {
    borderRadius: 20,
    marginBottom: spacing.xl,
    padding: spacing.lg
  },
  bestCardHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md
  },
  bestBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,122,255,0.1)',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: spacing.xs,
    paddingVertical: 4
  },
  bestBadgeText: {
    color: colors.primary,
    fontFamily: typography.body,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase'
  },
  bookmarkButton: {
    alignItems: 'center',
    height: 24,
    justifyContent: 'center',
    width: 24
  },
  bestCardInfoRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md
  },
  bestCardInfoPressable: {
    borderRadius: 12
  },
  bestStoreMeta: {
    flexShrink: 1,
    paddingRight: spacing.xs
  },
  bestStoreName: {
    color: colors.black,
    fontFamily: typography.body,
    fontSize: typography.sizes.headingLg,
    fontWeight: '700',
    letterSpacing: -0.7,
    lineHeight: 42,
    marginBottom: 4
  },
  bestStoreSubRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4
  },
  bestStoreSubText: {
    color: colors.textSecondary,
    fontFamily: typography.body,
    fontSize: typography.sizes.body,
    lineHeight: 23
  },
  bestStorePrice: {
    color: colors.black,
    fontFamily: typography.body,
    fontSize: typography.sizes.headingXl,
    fontWeight: '700',
    letterSpacing: -0.85,
    lineHeight: 51
  },
  bestActionsRow: {
    borderTopColor: colors.dividerSoft,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.lg
  },
  navigateButton: {
    borderRadius: 10,
    flex: 1,
    minHeight: 52
  },
  navigateButtonText: {
    fontSize: typography.sizes.body,
    fontWeight: '600'
  },
  infoButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
    height: 40,
    justifyContent: 'center',
    marginTop: 6,
    width: 28
  },
  sectionBlock: {
    marginBottom: spacing.xl
  },
  sectionHeadingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    paddingHorizontal: 4
  },
  sectionTitle: {
    color: colors.black,
    fontFamily: typography.body,
    fontSize: typography.sizes.headingSm,
    fontWeight: '700',
    lineHeight: 30,
    marginBottom: spacing.sm
  },
  sectionTitleInline: {
    color: colors.black,
    fontFamily: typography.body,
    fontSize: typography.sizes.headingSm,
    fontWeight: '700',
    lineHeight: 30
  },
  sectionLinkWrap: {
    padding: 2
  },
  sectionLink: {
    color: colors.primary,
    fontFamily: typography.body,
    fontSize: typography.sizes.body,
    lineHeight: 23
  },
  historyCard: {
    borderRadius: 20,
    paddingBottom: 21,
    paddingHorizontal: 21,
    paddingTop: 20
  },
  historyRow: {
    marginBottom: 19
  },
  historyRowTop: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs
  },
  historyStoreNameWrap: {
    alignItems: 'center',
    flexDirection: 'row'
  },
  historyStoreName: {
    color: colors.textSecondary,
    fontFamily: typography.body,
    fontSize: typography.sizes.caption,
    fontWeight: '500',
    lineHeight: 20,
    maxWidth: '85%'
  },
  historyTopStoreName: {
    color: colors.black,
    fontFamily: typography.body,
    fontSize: typography.sizes.caption,
    fontWeight: '600',
    lineHeight: 20,
    maxWidth: '85%'
  },
  historyStar: {
    marginLeft: 4
  },
  historyPrice: {
    color: colors.textSecondary,
    fontFamily: typography.body,
    fontSize: typography.sizes.caption,
    fontWeight: '500',
    lineHeight: 20
  },
  historyTopPrice: {
    color: colors.black,
    fontFamily: typography.body,
    fontSize: typography.sizes.caption,
    fontWeight: '700',
    lineHeight: 20
  },
  historyTrack: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 999,
    height: 10,
    overflow: 'hidden'
  },
  historyFill: {
    borderRadius: 999,
    height: 10
  },
  historyAxis: {
    borderTopColor: colors.dividerSoft,
    borderStyle: 'dashed',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
    paddingTop: 5
  },
  historyAxisText: {
    color: colors.textTertiary,
    fontFamily: typography.body,
    fontSize: typography.sizes.micro,
    fontWeight: '500',
    lineHeight: 17
  },
  recommendationsCard: {
    borderRadius: 20,
    overflow: 'hidden'
  },
  recommendationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 79,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md
  },
  recommendationRowBorder: {
    borderTopColor: colors.dividerSoft,
    borderTopWidth: 1
  },
  rankText: {
    color: colors.textTertiary,
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    fontWeight: '500',
    lineHeight: 26,
    marginRight: spacing.md,
    minWidth: 20,
    textAlign: 'center'
  },
  rankTextActive: {
    color: colors.black,
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    fontWeight: '700',
    lineHeight: 26,
    marginRight: spacing.md,
    minWidth: 20,
    textAlign: 'center'
  },
  recommendationBody: {
    flex: 1,
    marginRight: spacing.sm
  },
  recommendationNameRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: 1
  },
  recommendationName: {
    color: colors.black,
    flexShrink: 1,
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    fontWeight: '500',
    lineHeight: 26
  },
  recommendationNameTop: {
    color: colors.black,
    flexShrink: 1,
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    fontWeight: '600',
    lineHeight: 26
  },
  badge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2
  },
  badgeBest: {
    backgroundColor: 'rgba(52,199,89,0.1)'
  },
  badgeClosest: {
    backgroundColor: 'rgba(255,149,0,0.1)'
  },
  badgeText: {
    fontFamily: typography.body,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.25,
    textTransform: 'uppercase'
  },
  badgeBestText: {
    color: colors.success
  },
  badgeClosestText: {
    color: colors.warning
  },
  recommendationMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs
  },
  recommendationMeta: {
    color: colors.textSecondary,
    fontFamily: typography.body,
    fontSize: typography.sizes.caption,
    lineHeight: 20
  },
  recommendationBullet: {
    color: '#D1D5DB',
    fontFamily: typography.body,
    fontSize: typography.sizes.caption,
    lineHeight: 20
  },
  recommendationPriceWrap: {
    alignItems: 'flex-end',
    marginRight: spacing.xs
  },
  recommendationPrice: {
    color: colors.textPrimary,
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    fontWeight: '500',
    lineHeight: 26
  },
  recommendationPriceTop: {
    color: colors.primary,
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    fontWeight: '600',
    lineHeight: 26
  },
  recommendationSaveText: {
    color: colors.success,
    fontFamily: typography.body,
    fontSize: typography.sizes.micro,
    fontWeight: '500',
    lineHeight: 17
  },
  recommendationOldPrice: {
    color: colors.textTertiary,
    fontFamily: typography.body,
    fontSize: typography.sizes.micro,
    lineHeight: 17,
    textDecorationLine: 'line-through'
  },
  statusMessage: {
    color: colors.textSecondary,
    fontFamily: typography.body,
    fontSize: typography.sizes.caption,
    lineHeight: 18,
    marginBottom: spacing.sm
  },
  pressed: {
    opacity: 0.82
  }
});
