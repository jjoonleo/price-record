import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FilterChip } from '../src/components/FilterChip';
import { listHistoryEntries } from '../src/db/repositories/priceEntriesRepo';
import { listProductOptions } from '../src/db/repositories/productsRepo';
import { listStores } from '../src/db/repositories/storesRepo';
import { useI18n } from '../src/i18n/useI18n';
import { useFiltersStore } from '../src/state/useFiltersStore';
import { colors, gradients, radius, spacing, typography } from '../src/theme/tokens';
import { HistoryEntry, ProductOption, Store } from '../src/types/domain';
import { formatObservedAt, formatYen } from '../src/utils/formatters';

export default function HistoryScreen() {
  const { language, t } = useI18n();
  const {
    selectedProductId,
    selectedStoreId,
    setSelectedProductId,
    setSelectedStoreId
  } = useFiltersStore();

  const [products, setProducts] = useState<ProductOption[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  const selectedProductName = useMemo(
    () => products.find((product) => product.id === selectedProductId)?.name,
    [products, selectedProductId]
  );

  const refreshOptions = useCallback(async () => {
    const [productRows, storeRows] = await Promise.all([listProductOptions(), listStores()]);
    setProducts(productRows);
    setStores(storeRows);

    if (selectedProductId && !productRows.find((item) => item.id === selectedProductId)) {
      setSelectedProductId(null);
    }

    if (selectedStoreId && !storeRows.find((item) => item.id === selectedStoreId)) {
      setSelectedStoreId(null);
    }
  }, [selectedProductId, selectedStoreId, setSelectedProductId, setSelectedStoreId]);

  const refreshEntries = useCallback(async () => {
    const rows = await listHistoryEntries({
      productId: selectedProductId ?? undefined,
      storeId: selectedStoreId ?? undefined,
      limit: 180
    });

    setEntries(rows);
  }, [selectedProductId, selectedStoreId]);

  useFocusEffect(
    useCallback(() => {
      void refreshOptions();
      void refreshEntries();
    }, [refreshEntries, refreshOptions])
  );

  return (
    <LinearGradient colors={gradients.screen} style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.hero}>
            <Text style={styles.title}>{t('history_title')}</Text>
            <Text style={styles.subtitle}>{t('history_subtitle')}</Text>
          </View>

          <Text style={styles.sectionTitle}>{t('product_filter')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            <FilterChip label={t('all_products')} active={!selectedProductId} onPress={() => setSelectedProductId(null)} />
            {products.map((product) => (
              <FilterChip
                key={product.id}
                active={selectedProductId === product.id}
                label={product.name}
                onPress={() => setSelectedProductId(product.id)}
              />
            ))}
          </ScrollView>

          <Text style={styles.sectionTitle}>{t('store_filter')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            <FilterChip label={t('all_stores')} active={!selectedStoreId} onPress={() => setSelectedStoreId(null)} />
            {stores.map((store) => (
              <FilterChip
                key={store.id}
                active={selectedStoreId === store.id}
                label={store.name}
                onPress={() => setSelectedStoreId(store.id)}
              />
            ))}
          </ScrollView>

          <Text style={styles.countText}>
            {t('entries_count', { count: entries.length })}
            {selectedProductName ? t('entries_for', { name: selectedProductName }) : ''}
          </Text>

          {entries.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>{t('no_history')}</Text>
              <Text style={styles.emptyText}>{t('no_history_body')}</Text>
            </View>
          ) : null}

          {entries.map((entry, index) => (
            <View key={entry.id} style={styles.timelineRow}>
              <View style={styles.timelineDotWrap}>
                <View style={styles.timelineDot} />
                {index < entries.length - 1 ? <View style={styles.timelineLine} /> : null}
              </View>
              <View style={styles.entryCard}>
                <Text style={styles.entryPrice}>{formatYen(entry.priceYen, language === 'ko' ? 'ko-KR' : 'en-US')}</Text>
                <Text style={styles.entryTitle}>{entry.productName}</Text>
                <Text style={styles.entryMeta}>{entry.storeName} • {entry.cityArea}</Text>
                <Text style={styles.entryTime}>
                  {t('observed_prefix', {
                    date: formatObservedAt(entry.observedAt, language === 'ko' ? 'ko-KR' : 'en-US')
                  })}
                </Text>
              </View>
            </View>
          ))}
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
    paddingBottom: 110
  },
  hero: {
    marginBottom: spacing.lg
  },
  title: {
    color: colors.ink900,
    fontFamily: typography.display,
    fontSize: 30,
    marginBottom: spacing.xs
  },
  subtitle: {
    color: colors.ink700,
    fontFamily: typography.body,
    fontSize: 14,
    lineHeight: 20
  },
  sectionTitle: {
    color: colors.ink900,
    fontFamily: typography.display,
    fontSize: 20,
    marginTop: spacing.sm,
    marginBottom: spacing.sm
  },
  chipsRow: {
    paddingBottom: spacing.xs
  },
  countText: {
    color: colors.ink700,
    fontFamily: typography.body,
    fontSize: 12,
    marginTop: spacing.md,
    marginBottom: spacing.sm
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.sky200,
    padding: spacing.lg,
    marginBottom: spacing.lg
  },
  emptyTitle: {
    color: colors.ink900,
    fontFamily: typography.display,
    fontSize: 17,
    marginBottom: spacing.xs
  },
  emptyText: {
    color: colors.ink700,
    fontFamily: typography.body,
    fontSize: 13
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'stretch'
  },
  timelineDotWrap: {
    width: 22,
    alignItems: 'center'
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 16,
    backgroundColor: colors.sea500
  },
  timelineLine: {
    flex: 1,
    width: 2,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    backgroundColor: colors.sky300
  },
  entryCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.sky200,
    padding: spacing.md,
    marginBottom: spacing.sm
  },
  entryPrice: {
    color: colors.coral500,
    fontFamily: typography.display,
    fontSize: 24
  },
  entryTitle: {
    color: colors.ink900,
    fontFamily: typography.body,
    fontWeight: '700',
    fontSize: 14,
    marginTop: spacing.xs
  },
  entryMeta: {
    color: colors.ink700,
    fontFamily: typography.body,
    fontSize: 12,
    marginTop: 2
  },
  entryTime: {
    color: colors.slate500,
    fontFamily: typography.body,
    fontSize: 12,
    marginTop: spacing.xs
  }
});
