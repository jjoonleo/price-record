import { StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../i18n/useI18n';
import { StoreComparison } from '../types/domain';
import { colors, radius, spacing, typography } from '../theme/tokens';
import { formatYen } from '../utils/formatters';

type PriceBarChartProps = {
  comparisons: StoreComparison[];
};

export const PriceBarChart = ({ comparisons }: PriceBarChartProps) => {
  const { language, t } = useI18n();
  if (comparisons.length === 0) {
    return null;
  }

  const maxPrice = Math.max(...comparisons.map((item) => item.latestPriceYen), 1);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('chart_latest_price')}</Text>
      <View style={styles.barsWrap}>
        {comparisons.map((item, index) => {
          const widthPct = (item.latestPriceYen / maxPrice) * 100;
          const fillColor =
            index === 0 ? colors.coral500 : index === 1 ? colors.amber500 : colors.sea500;

          return (
            <View key={item.storeId} style={styles.row}>
              <View style={styles.rowHeader}>
                <Text numberOfLines={1} style={styles.storeLabel}>
                  {item.storeName}
                </Text>
                <Text style={styles.priceLabel}>{formatYen(item.latestPriceYen, language === 'ko' ? 'ko-KR' : 'en-US')}</Text>
              </View>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${widthPct}%`, backgroundColor: fillColor }]} />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.sky200,
    padding: spacing.md,
    marginBottom: spacing.lg
  },
  title: {
    color: colors.ink900,
    fontFamily: typography.display,
    fontSize: 18,
    marginBottom: spacing.sm
  },
  barsWrap: {
    rowGap: spacing.sm
  },
  row: {
    rowGap: spacing.xs
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: spacing.sm
  },
  storeLabel: {
    flex: 1,
    color: colors.ink700,
    fontFamily: typography.body,
    fontSize: 12
  },
  priceLabel: {
    color: colors.ink900,
    fontFamily: typography.body,
    fontWeight: '700',
    fontSize: 12
  },
  track: {
    height: 12,
    backgroundColor: colors.sky100,
    borderRadius: radius.sm,
    overflow: 'hidden'
  },
  fill: {
    height: '100%',
    borderRadius: radius.sm
  }
});
