import { StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../i18n/useI18n';
import { StoreComparison } from '../types/domain';
import { colors, radius, spacing, typography } from '../theme/tokens';
import { formatYen } from '../utils/formatters';

type StoreMapProps = {
  comparisons: StoreComparison[];
};

export const StoreMap = ({ comparisons }: StoreMapProps) => {
  const { language, t } = useI18n();

  if (comparisons.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('map_title')}</Text>
      <Text style={styles.note}>Web mode shows store list instead of interactive map.</Text>
      {comparisons.map((item) => (
        <View key={item.storeId} style={styles.row}>
          <Text style={styles.name}>{item.storeName}</Text>
          <Text style={styles.meta}>{formatYen(item.latestPriceYen, language === 'ko' ? 'ko-KR' : 'en-US')}</Text>
          <Text style={styles.meta}>{t('map_distance_km', { distance: item.distanceKm.toFixed(2) })}</Text>
        </View>
      ))}
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
    marginBottom: spacing.xl
  },
  title: {
    color: colors.ink900,
    fontFamily: typography.display,
    fontSize: 18,
    marginBottom: spacing.xs
  },
  note: {
    color: colors.slate500,
    fontFamily: typography.body,
    fontSize: 12,
    marginBottom: spacing.sm
  },
  row: {
    borderTopWidth: 1,
    borderTopColor: colors.sky100,
    paddingTop: spacing.sm,
    marginTop: spacing.sm
  },
  name: {
    color: colors.ink900,
    fontFamily: typography.body,
    fontWeight: '700',
    fontSize: 14
  },
  meta: {
    color: colors.ink700,
    fontFamily: typography.body,
    fontSize: 12,
    marginTop: 2
  }
});
