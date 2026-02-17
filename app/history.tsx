import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppCard } from '../src/components/ui/AppCard';
import { PillChip } from '../src/components/ui/PillChip';
import { listHistoryEntries } from '../src/db/repositories/priceEntriesRepo';
import { listProductOptions } from '../src/db/repositories/productsRepo';
import { listStores } from '../src/db/repositories/storesRepo';
import { useI18n } from '../src/i18n/useI18n';
import { colors, spacing, typography } from '../src/theme/tokens';
import { HistoryEntry, ProductOption, Store } from '../src/types/domain';
import { formatYen, getDisplayStoreName } from '../src/utils/formatters';

const BADGE_COLORS = ['#FACC15', '#3B82F6', '#F97316', '#22C55E', '#A855F7'];

const getStoreBadge = (storeName: string): { label: string; color: string; textColor: string } => {
  const compact = storeName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'S';

  const colorIndex = Math.abs(
    [...storeName].reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0)
  ) % BADGE_COLORS.length;

  const backgroundColor = BADGE_COLORS[colorIndex];
  const textColor = backgroundColor === '#FACC15' ? '#1E3A8A' : '#FFFFFF';

  return {
    label: compact,
    color: backgroundColor,
    textColor
  };
};

const toTimelineLabel = (isoDate: string, locale: string): string => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  const now = new Date();
  const isToday =
    now.getFullYear() === date.getFullYear() &&
    now.getMonth() === date.getMonth() &&
    now.getDate() === date.getDate();

  if (isToday) {
    const time = new Intl.DateTimeFormat(locale, {
      hour: 'numeric',
      minute: '2-digit'
    }).format(date);
    return `Today, ${time}`;
  }

  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric'
  }).format(date);
};

export default function HistoryScreen() {
  const router = useRouter();
  const { language, t } = useI18n();
  const locale = language === 'ko' ? 'ko-KR' : 'en-US';
  const { width } = useWindowDimensions();
  const frameWidth = Math.min(width - spacing.md * 2, 448);

  const [products, setProducts] = useState<ProductOption[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [selectedProductFilterId, setSelectedProductFilterId] = useState<string | null>(null);
  const [selectedStoreFilterId, setSelectedStoreFilterId] = useState<string | null>(null);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

  const refreshOptions = useCallback(async () => {
    const [productRows, storeRows] = await Promise.all([listProductOptions(), listStores()]);
    setProducts(productRows);
    setStores(storeRows);

    if (selectedProductFilterId && !productRows.find((item) => item.id === selectedProductFilterId)) {
      setSelectedProductFilterId(null);
    }

    if (selectedStoreFilterId && !storeRows.find((item) => item.id === selectedStoreFilterId)) {
      setSelectedStoreFilterId(null);
    }
  }, [selectedProductFilterId, selectedStoreFilterId]);

  const refreshEntries = useCallback(async () => {
    const rows = await listHistoryEntries({
      productId: selectedProductFilterId ?? undefined,
      storeId: selectedStoreFilterId ?? undefined,
      limit: 180
    });

    setEntries(rows);
  }, [selectedProductFilterId, selectedStoreFilterId]);

  useFocusEffect(
    useCallback(() => {
      void refreshOptions();
      void refreshEntries();
    }, [refreshEntries, refreshOptions])
  );

  const groupedEntries = useMemo(() => {
    return entries.map((entry, index) => {
      const next = entries[index + 1];
      const priceDelta = next ? entry.priceYen - next.priceYen : null;

      return {
        entry,
        timelineLabel: toTimelineLabel(entry.observedAt, locale),
        priceDelta,
        badge: getStoreBadge(entry.storeName)
      };
    });
  }, [entries, locale]);

  const activeFilterCount = Number(Boolean(selectedProductFilterId)) + Number(Boolean(selectedStoreFilterId));

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <View style={styles.header}>
        <View style={[styles.headerRow, { width: frameWidth }]}> 
          <Pressable onPress={() => router.navigate('/compare')} style={styles.backButton}>
            <MaterialCommunityIcons color={colors.primary} name="chevron-left" size={19} />
            <Text style={styles.backText}>{t('back')}</Text>
          </Pressable>
          <Text style={styles.headerTitle}>{t('history_title')}</Text>
          <Pressable onPress={() => setIsFilterModalVisible(true)} style={styles.filterButton}>
            <Text style={styles.filterText}>
              {t('history_filter')}
              {activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.mainColumn, { width: frameWidth }]}> 
          <View style={styles.timelineHeadRow}>
            <Text style={styles.timelineHeadText}>{t('history_timeline_count', { count: entries.length })}</Text>
            <Text style={styles.timelineRangeText}>{t('history_last_30_days')}</Text>
          </View>

          {entries.length === 0 ? (
            <AppCard style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>{t('no_history')}</Text>
              <Text style={styles.emptyBody}>{t('no_history_body')}</Text>
            </AppCard>
          ) : null}

          {groupedEntries.map(({ entry, timelineLabel, priceDelta, badge }, index) => {
            const isLatest = index === 0;
            const isMuted = index >= 4;

            return (
              <View key={entry.id} style={[styles.timelineBlock, isMuted && styles.timelineMuted]}>
                <View style={styles.timelineDotColumn}>
                  <View style={[styles.timelineDot, isLatest ? styles.timelineDotActive : styles.timelineDotIdle]} />
                  {index < groupedEntries.length - 1 ? <View style={styles.timelineLine} /> : null}
                </View>

                <View style={styles.timelineContent}>
                  <Text style={styles.timelineDate}>{timelineLabel}</Text>
                  <AppCard style={styles.entryCard}>
                    <View style={styles.entryTopRow}>
                      <View style={styles.entryLeft}>
                        <Text style={styles.entryTitle}>{entry.productName}</Text>
                        <View style={styles.entryMetaRow}>
                          <View style={[styles.storeBadge, { backgroundColor: badge.color }]}>
                            <Text style={[styles.storeBadgeText, { color: badge.textColor }]}>{badge.label}</Text>
                          </View>
                          <Text style={styles.entryMetaText} numberOfLines={1}>
                            {entry.storeName}, {entry.cityArea}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.entryPriceWrap}>
                        <Text style={[styles.entryPrice, isLatest && styles.entryPriceLatest]}>
                          {formatYen(entry.priceYen, locale).replace('JP¥', '¥')}
                        </Text>
                        {priceDelta !== null && priceDelta !== 0 ? (
                          <View style={[styles.deltaChip, priceDelta < 0 ? styles.deltaDrop : styles.deltaRise]}>
                            <Text style={[styles.deltaText, priceDelta < 0 ? styles.deltaDropText : styles.deltaRiseText]}>
                              {priceDelta > 0 ? '+' : ''}{formatYen(priceDelta, locale).replace('JP¥', '¥')}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  </AppCard>
                </View>
              </View>
            );
          })}

          {entries.length > 0 ? <Text style={styles.endHint}>{t('history_no_more')}</Text> : null}
        </View>
      </ScrollView>

      <Modal
        animationType="fade"
        onRequestClose={() => setIsFilterModalVisible(false)}
        transparent
        visible={isFilterModalVisible}
      >
        <Pressable onPress={() => setIsFilterModalVisible(false)} style={styles.filterModalBackdrop}>
          <Pressable style={[styles.filterModalCard, { width: frameWidth }]} onPress={() => undefined}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>{t('history_filter')}</Text>
            </View>

            <Text style={styles.filterSectionTitle}>{t('product_filter')}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterChipRow}
            >
              <PillChip
                active={!selectedProductFilterId}
                label={t('all_products')}
                onPress={() => setSelectedProductFilterId(null)}
              />
              {products.map((product) => (
                <PillChip
                  key={product.id}
                  active={selectedProductFilterId === product.id}
                  label={product.name}
                  onPress={() => setSelectedProductFilterId(product.id)}
                />
              ))}
            </ScrollView>

            <Text style={styles.filterSectionTitle}>{t('store_filter')}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterChipRow}
            >
              <PillChip
                active={!selectedStoreFilterId}
                label={t('all_stores')}
                onPress={() => setSelectedStoreFilterId(null)}
              />
              {stores.map((store) => (
                <PillChip
                  key={store.id}
                  active={selectedStoreFilterId === store.id}
                  label={getDisplayStoreName(store)}
                  onPress={() => setSelectedStoreFilterId(store.id)}
                />
              ))}
            </ScrollView>

            <View style={styles.filterModalActions}>
              <Pressable
                onPress={() => {
                  setSelectedProductFilterId(null);
                  setSelectedStoreFilterId(null);
                }}
                style={({ pressed }) => [styles.filterActionButton, pressed && styles.pressed]}
              >
                <Text style={styles.filterActionText}>{t('reset')}</Text>
              </Pressable>
              <Pressable
                onPress={() => setIsFilterModalVisible(false)}
                style={({ pressed }) => [styles.filterActionButtonPrimary, pressed && styles.pressed]}
              >
                <Text style={styles.filterActionTextPrimary}>{t('done')}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1
  },
  header: {
    backgroundColor: 'rgba(242,242,247,0.9)',
    borderBottomColor: 'rgba(198,198,200,0.5)',
    borderBottomWidth: 1,
    paddingBottom: spacing.xs,
    paddingTop: spacing.xs
  },
  headerRow: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 36,
    paddingHorizontal: spacing.md,
    position: 'relative'
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
    fontWeight: '700'
  },
  filterButton: {
    alignItems: 'flex-end',
    minWidth: 72
  },
  filterText: {
    color: colors.primary,
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    lineHeight: 26
  },
  content: {
    alignItems: 'center',
    paddingBottom: 118,
    paddingTop: spacing.md
  },
  mainColumn: {
    minHeight: '100%'
  },
  timelineHeadRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs
  },
  timelineHeadText: {
    color: colors.textSecondary,
    fontFamily: typography.body,
    fontSize: typography.sizes.caption,
    letterSpacing: 0.3,
    textTransform: 'uppercase'
  },
  timelineRangeText: {
    color: colors.primary,
    fontFamily: typography.body,
    fontSize: typography.sizes.caption,
    lineHeight: 20
  },
  emptyCard: {
    borderRadius: 12,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    fontWeight: '700',
    marginBottom: spacing.xxs
  },
  emptyBody: {
    color: colors.textSecondary,
    fontFamily: typography.body,
    fontSize: typography.sizes.caption,
    lineHeight: 20
  },
  timelineBlock: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md
  },
  timelineMuted: {
    opacity: 0.6
  },
  timelineDotColumn: {
    alignItems: 'center',
    width: 24
  },
  timelineDot: {
    borderRadius: 999,
    height: 7,
    marginTop: spacing.md,
    width: 7
  },
  timelineDotActive: {
    backgroundColor: colors.primary
  },
  timelineDotIdle: {
    backgroundColor: colors.textTertiary
  },
  timelineLine: {
    backgroundColor: '#D1D5DB',
    flex: 1,
    marginBottom: spacing.xs,
    marginTop: spacing.xs,
    width: 1
  },
  timelineContent: {
    flex: 1,
    paddingLeft: spacing.xs
  },
  timelineDate: {
    color: colors.textTertiary,
    fontFamily: typography.body,
    fontSize: typography.sizes.micro,
    letterSpacing: 0.25,
    marginBottom: spacing.xxs,
    marginTop: spacing.sm,
    textTransform: 'uppercase'
  },
  entryCard: {
    borderRadius: 12,
    marginBottom: spacing.sm,
    padding: spacing.md
  },
  entryTopRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  entryLeft: {
    flex: 1,
    paddingRight: spacing.sm
  },
  entryTitle: {
    color: '#0F172A',
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: spacing.xs
  },
  entryMetaRow: {
    alignItems: 'center',
    flexDirection: 'row'
  },
  storeBadge: {
    alignItems: 'center',
    borderRadius: 4,
    height: 20,
    justifyContent: 'center',
    marginRight: spacing.xs,
    minWidth: 20,
    paddingHorizontal: 4
  },
  storeBadgeText: {
    fontFamily: typography.body,
    fontSize: 8,
    fontWeight: '700',
    lineHeight: 12
  },
  entryMetaText: {
    color: colors.textSecondary,
    flex: 1,
    fontFamily: typography.body,
    fontSize: typography.sizes.caption,
    lineHeight: 20
  },
  entryPriceWrap: {
    alignItems: 'flex-end'
  },
  entryPrice: {
    color: '#0F172A',
    fontFamily: typography.body,
    fontSize: 28,
    lineHeight: 29
  },
  entryPriceLatest: {
    color: colors.primary,
    fontWeight: '700'
  },
  deltaChip: {
    borderRadius: 4,
    marginTop: spacing.xxs,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2
  },
  deltaDrop: {
    backgroundColor: '#DCFCE7'
  },
  deltaRise: {
    backgroundColor: '#FEE2E2'
  },
  deltaText: {
    fontFamily: typography.body,
    fontSize: typography.sizes.micro,
    fontWeight: '700',
    lineHeight: 17
  },
  deltaDropText: {
    color: '#16A34A'
  },
  deltaRiseText: {
    color: '#B91C1C'
  },
  endHint: {
    color: colors.textTertiary,
    fontFamily: typography.body,
    fontSize: typography.sizes.caption,
    marginBottom: spacing.xxl,
    marginTop: spacing.md,
    textAlign: 'center'
  },
  filterModalBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.md
  },
  filterModalCard: {
    backgroundColor: colors.surface,
    borderColor: colors.divider,
    borderRadius: 16,
    borderWidth: 1,
    maxHeight: '75%',
    paddingBottom: spacing.md,
    paddingTop: spacing.sm
  },
  filterModalHeader: {
    alignItems: 'center',
    marginBottom: spacing.sm
  },
  filterModalTitle: {
    color: colors.textPrimary,
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    fontWeight: '700',
    lineHeight: 26
  },
  filterSectionTitle: {
    color: colors.textSecondary,
    fontFamily: typography.body,
    fontSize: typography.sizes.caption,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: spacing.xxs,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md
  },
  filterChipRow: {
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xxs
  },
  filterModalActions: {
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'flex-end',
    marginTop: spacing.md,
    paddingHorizontal: spacing.md
  },
  filterActionButton: {
    alignItems: 'center',
    borderColor: colors.divider,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 36,
    minWidth: 72,
    paddingHorizontal: spacing.md
  },
  filterActionText: {
    color: colors.textSecondary,
    fontFamily: typography.body,
    fontSize: typography.sizes.caption,
    fontWeight: '600'
  },
  filterActionButtonPrimary: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 10,
    justifyContent: 'center',
    minHeight: 36,
    minWidth: 72,
    paddingHorizontal: spacing.md
  },
  filterActionTextPrimary: {
    color: colors.white,
    fontFamily: typography.body,
    fontSize: typography.sizes.caption,
    fontWeight: '700'
  },
  pressed: {
    opacity: 0.88
  }
});
