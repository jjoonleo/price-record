import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppCard } from '../ui/AppCard';
import { typography } from '../../theme/tokens';

export type ComparePriceComparisonRowViewModel = {
  storeId: string;
  storeName: string;
  priceText: string;
  widthPercent: number;
  color: string;
  isBest: boolean;
};

type ComparePriceComparisonCardProps = {
  title: string;
  rows: ComparePriceComparisonRowViewModel[];
  viewHistoryLabel: string;
  onViewFullHistory: () => void;
};

export const ComparePriceComparisonCard = ({
  title,
  rows,
  viewHistoryLabel,
  onViewFullHistory
}: ComparePriceComparisonCardProps) => {
  return (
    <View style={styles.sectionBlock}>
      <Text style={styles.sectionLabel}>{title}</Text>
      <AppCard padded={false} style={styles.surfaceCard}>
        <View style={styles.rowsWrap}>
          {rows.map((row) => (
            <View key={row.storeId} style={styles.priceRow}>
              <View style={styles.priceRowTop}>
                <Text numberOfLines={1} style={[styles.priceStoreName, row.isBest && styles.priceStoreNameActive]}>
                  {row.storeName}
                </Text>
                <Text style={[styles.priceStoreValue, row.isBest && styles.priceStoreValueActive]}>{row.priceText}</Text>
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
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={onViewFullHistory}
          style={({ pressed }) => [styles.viewHistoryButton, pressed && styles.pressed]}
        >
          <Text style={styles.viewHistoryText}>{viewHistoryLabel}</Text>
        </Pressable>
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
    paddingTop: 20
  },
  priceRow: {
    marginBottom: 16
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
    paddingRight: 12
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
  pressed: {
    opacity: 0.85
  }
});
