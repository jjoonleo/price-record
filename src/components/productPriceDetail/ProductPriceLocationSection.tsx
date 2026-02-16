import { StyleSheet, Text, View } from 'react-native';
import { EntryLocationMap } from '../EntryLocationMap';
import { PrimaryButton } from '../ui/PrimaryButton';
import { spacing, typography } from '../../theme/tokens';

type ProductPriceLocationSectionProps = {
  width: number;
  heading: string;
  cityArea: string;
  latitude: number;
  longitude: number;
  storeName: string;
  navigateLabel: string;
  onNavigate: () => void;
};

export const ProductPriceLocationSection = ({
  width,
  heading,
  cityArea,
  latitude,
  longitude,
  storeName,
  navigateLabel,
  onNavigate
}: ProductPriceLocationSectionProps) => {
  return (
    <View style={[styles.sectionBlock, { width }]}>
      <Text style={styles.sectionHeading}>{heading}</Text>
      <EntryLocationMap cityArea={cityArea} latitude={latitude} longitude={longitude} storeName={storeName} />
      <PrimaryButton
        label={navigateLabel}
        onPress={onNavigate}
        style={styles.navigateButton}
        textStyle={styles.navigateButtonText}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  sectionBlock: {
    marginTop: spacing.xl
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
  navigateButton: {
    borderRadius: 16,
    marginTop: spacing.sm,
    minHeight: 54
  },
  navigateButtonText: {
    fontSize: typography.sizes.title,
    fontWeight: '600'
  }
});
