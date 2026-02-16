import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FilterChip } from '../src/components/FilterChip';
import { PriceBarChart } from '../src/components/PriceBarChart';
import { StoreMap } from '../src/components/StoreMap';
import { StoreScoreCard } from '../src/components/StoreScoreCard';
import { getLatestStorePricesByProduct } from '../src/db/repositories/priceEntriesRepo';
import { listProductOptions } from '../src/db/repositories/productsRepo';
import { listCityAreas } from '../src/db/repositories/storesRepo';
import { useI18n } from '../src/i18n/useI18n';
import { captureCurrentLocation } from '../src/services/locationService';
import { buildStoreComparisons } from '../src/services/rankingService';
import { useFiltersStore } from '../src/state/useFiltersStore';
import { colors, gradients, radius, spacing, typography } from '../src/theme/tokens';
import { Coordinates, ProductOption, StoreComparison } from '../src/types/domain';
import { formatYen } from '../src/utils/formatters';

export default function CompareScreen() {
  const { language, t } = useI18n();
  const {
    selectedProductId,
    selectedCityArea,
    setSelectedProductId,
    setSelectedCityArea,
    clearHistoryStoreFilter
  } = useFiltersStore();

  const [products, setProducts] = useState<ProductOption[]>([]);
  const [cityAreas, setCityAreas] = useState<string[]>([]);
  const [comparisons, setComparisons] = useState<StoreComparison[]>([]);
  const [userLocation, setUserLocation] = useState<Coordinates | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string>(t('location_default'));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedProductName = useMemo(
    () => products.find((item) => item.id === selectedProductId)?.name,
    [products, selectedProductId]
  );

  const refreshFilterData = useCallback(async () => {
    const [productOptions, areaOptions] = await Promise.all([listProductOptions(), listCityAreas()]);

    setProducts(productOptions);
    setCityAreas(areaOptions);

    if (!selectedProductId && productOptions.length > 0) {
      setSelectedProductId(productOptions[0].id);
      clearHistoryStoreFilter();
    }

    if (selectedCityArea && !areaOptions.includes(selectedCityArea)) {
      setSelectedCityArea(null);
    }
  }, [clearHistoryStoreFilter, selectedCityArea, selectedProductId, setSelectedCityArea, setSelectedProductId]);

  const refreshComparisons = useCallback(async () => {
    if (!selectedProductId) {
      setComparisons([]);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const latestRows = await getLatestStorePricesByProduct(selectedProductId, selectedCityArea ?? undefined);
      const ranked = buildStoreComparisons(latestRows, userLocation);
      setComparisons(ranked);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t('compare_load_error'));
    } finally {
      setIsLoading(false);
    }
  }, [selectedCityArea, selectedProductId, userLocation]);

  useFocusEffect(
    useCallback(() => {
      void refreshFilterData();
      void refreshComparisons();
    }, [refreshComparisons, refreshFilterData])
  );

  const handleLocationRefresh = async () => {
    setIsLocating(true);
    const result = await captureCurrentLocation();
    setIsLocating(false);

    if (result.status === 'granted') {
      setUserLocation(result.coordinates);
      setLocationStatus(
        t('location_using', { area: result.cityArea })
      );
      return;
    }

    setLocationStatus(result.message);
  };

  const topChoice = comparisons[0];

  return (
    <LinearGradient colors={gradients.screen} style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.hero}>
            <Text style={styles.title}>{t('compare_title')}</Text>
            <Text style={styles.subtitle}>{t('compare_subtitle')}</Text>
          </View>

          <View style={styles.locationCard}>
            <View style={styles.rowBetween}>
              <Text style={styles.sectionLabel}>{t('distance_context')}</Text>
              <Pressable onPress={handleLocationRefresh} style={styles.locationButton}>
                <Text style={styles.locationButtonText}>{isLocating ? t('locating') : t('update_location')}</Text>
              </Pressable>
            </View>
            <Text style={styles.locationText}>{locationStatus}</Text>
          </View>

          <Text style={styles.sectionTitle}>{t('merchandise_section')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            {products.map((product) => (
              <FilterChip
                key={product.id}
                active={selectedProductId === product.id}
                label={product.name}
                onPress={() => {
                  setSelectedProductId(product.id);
                  clearHistoryStoreFilter();
                }}
              />
            ))}
          </ScrollView>

          <Text style={styles.sectionTitle}>{t('city_area_section')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            <FilterChip
              label={t('all_areas')}
              active={!selectedCityArea}
              onPress={() => setSelectedCityArea(null)}
            />
            {cityAreas.map((area) => (
              <FilterChip
                key={area}
                active={selectedCityArea === area}
                label={area}
                onPress={() => setSelectedCityArea(area)}
              />
            ))}
          </ScrollView>

          {!selectedProductId ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>{t('no_item_selected')}</Text>
              <Text style={styles.emptyBody}>{t('no_item_selected_body')}</Text>
            </View>
          ) : null}

          {isLoading ? (
            <View style={styles.loaderWrap}>
              <ActivityIndicator color={colors.sea500} size="large" />
            </View>
          ) : null}

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          {!isLoading && topChoice ? (
            <LinearGradient colors={gradients.highlight} style={styles.topCard}>
              <Text style={styles.topLabel}>{t('best_store_now')}</Text>
              <Text style={styles.topName}>{topChoice.storeName}</Text>
              <Text style={styles.topMeta}>
                {t('best_store_meta', {
                  product: selectedProductName ?? '',
                  price: formatYen(topChoice.latestPriceYen, language === 'ko' ? 'ko-KR' : 'en-US'),
                  area: topChoice.cityArea
                })}
              </Text>
            </LinearGradient>
          ) : null}

          {!isLoading && comparisons.length === 0 && selectedProductId ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>{t('no_comparisons')}</Text>
              <Text style={styles.emptyBody}>{t('no_comparisons_body')}</Text>
            </View>
          ) : null}

          {!isLoading && comparisons.length > 0 ? (
            <>
              <PriceBarChart comparisons={comparisons} />
              <StoreMap comparisons={comparisons} />
              {comparisons.map((item, index) => (
                <StoreScoreCard key={item.storeId} item={item} rank={index + 1} />
              ))}
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: 120
  },
  hero: {
    marginBottom: spacing.lg
  },
  title: {
    color: colors.ink900,
    fontFamily: typography.display,
    fontSize: 32,
    marginBottom: spacing.xs
  },
  subtitle: {
    color: colors.ink700,
    fontFamily: typography.body,
    fontSize: 14,
    lineHeight: 20
  },
  locationCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.sky200,
    padding: spacing.md,
    marginBottom: spacing.md
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs
  },
  sectionLabel: {
    color: colors.ink900,
    fontFamily: typography.body,
    fontWeight: '700',
    fontSize: 13
  },
  locationButton: {
    backgroundColor: colors.ink900,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6
  },
  locationButtonText: {
    color: colors.white,
    fontFamily: typography.body,
    fontWeight: '700',
    fontSize: 12
  },
  locationText: {
    color: colors.ink700,
    fontFamily: typography.body,
    fontSize: 12,
    lineHeight: 18
  },
  sectionTitle: {
    color: colors.ink900,
    fontFamily: typography.display,
    fontSize: 20,
    marginTop: spacing.md,
    marginBottom: spacing.sm
  },
  chipsRow: {
    paddingBottom: spacing.xs
  },
  loaderWrap: {
    paddingVertical: spacing.xl
  },
  topCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.sky200,
    marginBottom: spacing.lg
  },
  topLabel: {
    color: colors.sea500,
    fontFamily: typography.body,
    fontWeight: '700',
    fontSize: 12,
    marginBottom: spacing.xs
  },
  topName: {
    color: colors.ink900,
    fontFamily: typography.display,
    fontSize: 24,
    marginBottom: spacing.xs
  },
  topMeta: {
    color: colors.ink700,
    fontFamily: typography.body,
    fontSize: 13
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderColor: colors.sky200,
    borderWidth: 1,
    padding: spacing.lg,
    marginTop: spacing.md
  },
  emptyTitle: {
    color: colors.ink900,
    fontFamily: typography.display,
    fontSize: 18,
    marginBottom: spacing.xs
  },
  emptyBody: {
    color: colors.ink700,
    fontFamily: typography.body,
    fontSize: 13,
    lineHeight: 19
  },
  errorText: {
    color: colors.coral500,
    fontFamily: typography.body,
    fontSize: 13,
    marginTop: spacing.sm
  }
});
