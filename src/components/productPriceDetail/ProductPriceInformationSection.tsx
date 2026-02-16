import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { AppCard } from '../ui/AppCard';
import { colors, spacing, typography } from '../../theme/tokens';

type ProductPriceInformationSectionProps = {
  width: number;
  heading: string;
  storeLabel: string;
  areaLabel: string;
  observedLabel: string;
  storeValue: string;
  areaValue: string;
  observedValue: string;
};

export const ProductPriceInformationSection = ({
  width,
  heading,
  storeLabel,
  areaLabel,
  observedLabel,
  storeValue,
  areaValue,
  observedValue
}: ProductPriceInformationSectionProps) => {
  return (
    <View style={[styles.sectionBlock, { width }]}>
      <Text style={styles.sectionHeading}>{heading}</Text>
      <AppCard padded={false} style={styles.infoCard}>
        <View style={styles.infoRow}>
          <View style={styles.infoLeft}>
            <View style={[styles.infoIconWrap, { backgroundColor: 'rgba(19,127,236,0.1)' }]}>
              <MaterialCommunityIcons color="#137FEC" name="storefront-outline" size={14} />
            </View>
            <Text style={styles.infoLabel}>{storeLabel}</Text>
          </View>
          <Text numberOfLines={1} style={styles.infoValue}>
            {storeValue}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoLeft}>
            <View style={[styles.infoIconWrap, { backgroundColor: 'rgba(249,115,22,0.1)' }]}>
              <MaterialCommunityIcons color="#F97316" name="map-marker-outline" size={14} />
            </View>
            <Text style={styles.infoLabel}>{areaLabel}</Text>
          </View>
          <Text numberOfLines={1} style={styles.infoValue}>
            {areaValue}
          </Text>
        </View>

        <View style={[styles.infoRow, styles.infoRowLast]}>
          <View style={styles.infoLeft}>
            <View style={[styles.infoIconWrap, { backgroundColor: 'rgba(168,85,247,0.1)' }]}>
              <MaterialCommunityIcons color="#A855F7" name="calendar-month-outline" size={14} />
            </View>
            <Text style={styles.infoLabel}>{observedLabel}</Text>
          </View>
          <Text numberOfLines={1} style={styles.infoValue}>
            {observedValue}
          </Text>
        </View>
      </AppCard>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionBlock: {
    marginTop: spacing.md
  },
  sectionHeading: {
    color: '#64748B',
    fontFamily: typography.body,
    fontSize: typography.sizes.micro,
    fontWeight: '600',
    letterSpacing: 0.6,
    lineHeight: 16,
    marginBottom: spacing.xs,
    textTransform: 'uppercase'
  },
  infoCard: {
    borderRadius: 16,
    overflow: 'hidden'
  },
  infoRow: {
    alignItems: 'center',
    borderBottomColor: colors.dividerSoft,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingHorizontal: spacing.md
  },
  infoRowLast: {
    borderBottomWidth: 0
  },
  infoLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    marginRight: spacing.md
  },
  infoIconWrap: {
    alignItems: 'center',
    borderRadius: 8,
    height: 28,
    justifyContent: 'center',
    marginRight: spacing.sm,
    width: 28
  },
  infoLabel: {
    color: '#0F172A',
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    lineHeight: 26
  },
  infoValue: {
    color: '#64748B',
    flexShrink: 1,
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    lineHeight: 26,
    textAlign: 'right'
  }
});
