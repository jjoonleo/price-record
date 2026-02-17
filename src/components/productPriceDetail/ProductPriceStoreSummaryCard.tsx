import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { typography } from '../../theme/tokens';
import { AppCard } from '../ui/AppCard';
import { PrimaryButton } from '../ui/PrimaryButton';

type ProductPriceStoreSummaryCardProps = {
  width: number;
  storeName: string;
  cityArea: string;
  addressLine?: string;
  openStatusLabel?: string;
  closeTimeLabel?: string;
  directionsLabel: string;
  onDirections: () => void;
};

export const ProductPriceStoreSummaryCard = ({
  width,
  storeName,
  cityArea,
  addressLine,
  openStatusLabel,
  closeTimeLabel,
  directionsLabel,
  onDirections
}: ProductPriceStoreSummaryCardProps) => {
  return (
    <AppCard padded={false} style={[styles.card, { width }]}>
      <View style={styles.headerRow}>
        <View style={styles.titleBlock}>
          <Text numberOfLines={1} style={styles.title}>
            {storeName}
          </Text>
          <Text numberOfLines={1} style={styles.subtitle}>
            {cityArea}
          </Text>
        </View>

        {(openStatusLabel || closeTimeLabel) ? (
          <View style={styles.statusBlock}>
            {openStatusLabel ? (
              <View style={styles.openNowPill}>
                <Text style={styles.openNowText}>{openStatusLabel}</Text>
              </View>
            ) : null}
            {closeTimeLabel ? <Text style={styles.closeText}>{closeTimeLabel}</Text> : null}
          </View>
        ) : null}
      </View>

      {addressLine ? (
        <View style={styles.addressRow}>
          <MaterialCommunityIcons color="#94A3B8" name="map-marker" size={14} />
          <Text numberOfLines={1} style={styles.addressText}>
            {addressLine}
          </Text>
        </View>
      ) : null}

      <PrimaryButton
        label={directionsLabel}
        onPress={onDirections}
        style={styles.directionsButton}
        textStyle={styles.directionsLabel}
      />
    </AppCard>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 32,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  titleBlock: {
    flex: 1,
    marginRight: 12
  },
  title: {
    color: '#0F172A',
    fontFamily: typography.body,
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32
  },
  subtitle: {
    color: '#64748B',
    fontFamily: typography.body,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 4
  },
  statusBlock: {
    alignItems: 'flex-end'
  },
  openNowPill: {
    backgroundColor: '#DCFCE7',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  openNowText: {
    color: '#15803D',
    fontFamily: typography.body,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16
  },
  closeText: {
    color: '#94A3B8',
    fontFamily: typography.body,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4
  },
  addressRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 8,
    paddingBottom: 12
  },
  addressText: {
    color: '#64748B',
    flex: 1,
    fontFamily: typography.body,
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 6
  },
  directionsButton: {
    borderRadius: 24,
    marginTop: 8
  },
  directionsLabel: {
    fontWeight: '600',
    lineHeight: 25.5
  }
});
