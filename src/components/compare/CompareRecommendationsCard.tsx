import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppCard } from '../ui/AppCard';
import { spacing, typography } from '../../theme/tokens';

export type CompareRecommendationRowViewModel = {
  storeId: string;
  rank: number;
  storeName: string;
  metaText: string;
  priceText: string;
  statusText: string;
  statusTone: 'positive' | 'muted';
};

type CompareRecommendationsCardProps = {
  title: string;
  rows: CompareRecommendationRowViewModel[];
  onSelect: (storeId: string) => void;
};

export const CompareRecommendationsCard = ({ title, rows, onSelect }: CompareRecommendationsCardProps) => {
  if (rows.length === 0) {
    return null;
  }

  return (
    <View style={styles.sectionBlock}>
      <Text style={styles.sectionLabel}>{title}</Text>
      <AppCard padded={false} style={styles.surfaceCard}>
        <View style={styles.rowsWrap}>
          {rows.map((row, index) => (
            <Pressable
              key={row.storeId}
              accessibilityRole="button"
              onPress={() => onSelect(row.storeId)}
              style={({ pressed }) => [styles.recommendationRow, index > 0 && styles.recommendationRowBorder, pressed && styles.pressed]}
            >
              <View style={[styles.rankBubble, row.rank === 2 ? styles.rankBubbleActive : styles.rankBubbleIdle]}>
                <Text style={[styles.rankBubbleText, row.rank === 2 ? styles.rankBubbleTextActive : styles.rankBubbleTextIdle]}>
                  {row.rank}
                </Text>
              </View>

              <View style={styles.recommendationBody}>
                <Text numberOfLines={1} style={styles.recommendationStoreName}>
                  {row.storeName}
                </Text>
                <View style={styles.recommendationMetaRow}>
                  <MaterialCommunityIcons color="#94A3B8" name="map-marker-outline" size={12} />
                  <Text numberOfLines={1} style={styles.recommendationMeta}>
                    {row.metaText}
                  </Text>
                </View>
              </View>

              <View style={styles.recommendationPriceWrap}>
                <Text style={styles.recommendationPrice}>{row.priceText}</Text>
                <Text style={row.statusTone === 'positive' ? styles.recommendationSave : styles.recommendationRegular}>
                  {row.statusText}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </AppCard>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionBlock: {
    marginBottom: 24
  },
  sectionLabel: {
    color: '#64748B',
    fontFamily: typography.body,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.35,
    lineHeight: 20,
    marginBottom: 12,
    textTransform: 'uppercase'
  },
  surfaceCard: {
    borderRadius: 24,
    overflow: 'hidden'
  },
  rowsWrap: {
    paddingHorizontal: 20,
    paddingVertical: 2
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
  pressed: {
    opacity: 0.85
  }
});
