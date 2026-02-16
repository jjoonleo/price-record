import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useI18n } from '../i18n/useI18n';
import { StoreComparison } from '../types/domain';
import { colors, gradients, radius, spacing, typography, shadows } from '../theme/tokens';
import { formatObservedAt, formatYen } from '../utils/formatters';

type StoreScoreCardProps = {
  item: StoreComparison;
  rank: number;
};

const tagColors: Record<string, string> = {
  BEST: colors.sea500,
  CHEAPEST: colors.coral500,
  CLOSEST: colors.amber500
};

export const StoreScoreCard = ({ item, rank }: StoreScoreCardProps) => {
  const { language, t } = useI18n();
  const locale = language === 'ko' ? 'ko-KR' : 'en-US';
  const translatedTag = (tag: string): string => {
    if (tag === 'BEST') return t('tag_best');
    if (tag === 'CHEAPEST') return t('tag_cheapest');
    if (tag === 'CLOSEST') return t('tag_closest');
    return tag;
  };

  return (
    <LinearGradient colors={gradients.card} style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <Text style={styles.rank}>#{rank}</Text>
          <Text style={styles.storeName}>{item.storeName}</Text>
        </View>
        <Text style={styles.price}>{formatYen(item.latestPriceYen, locale)}</Text>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>{item.cityArea}</Text>
        <Text style={styles.metaText}>{item.distanceKm.toFixed(2)} km</Text>
        <Text style={styles.metaText}>{t('score_label', { score: item.score.toFixed(2) })}</Text>
      </View>

      <Text style={styles.timestamp}>
        {t('observed_prefix', { date: formatObservedAt(item.observedAt, locale) })}
      </Text>

      <View style={styles.tagsRow}>
        {item.tags.map((tag) => (
          <View key={`${item.storeId}-${tag}`} style={[styles.tag, { backgroundColor: tagColors[tag] ?? colors.ink700 }]}>
            <Text style={styles.tagText}>{translatedTag(tag)}</Text>
          </View>
        ))}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.sky200,
    ...shadows.soft
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm
  },
  rank: {
    color: colors.sea500,
    fontFamily: typography.mono,
    fontWeight: '700',
    marginRight: spacing.sm
  },
  storeName: {
    color: colors.ink900,
    fontFamily: typography.display,
    fontSize: 18,
    flexShrink: 1
  },
  price: {
    color: colors.ink900,
    fontFamily: typography.display,
    fontSize: 20
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: spacing.md,
    marginBottom: spacing.xs
  },
  metaText: {
    color: colors.ink700,
    fontFamily: typography.body,
    fontSize: 12
  },
  timestamp: {
    color: colors.slate500,
    fontFamily: typography.body,
    fontSize: 12,
    marginBottom: spacing.sm
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs
  },
  tag: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4
  },
  tagText: {
    color: colors.white,
    fontFamily: typography.body,
    fontSize: 11,
    fontWeight: '700'
  }
});
