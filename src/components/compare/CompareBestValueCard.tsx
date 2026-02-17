import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../ui/PrimaryButton';
import { colors, typography } from '../../theme/tokens';

type CompareBestValueCardProps = {
  bestLabel: string;
  priceText: string;
  storeText: string;
  vsAvgPercentText: string;
  vsAvgLabel: string;
  lastVerifiedText: string;
  navigateLabel: string;
  onNavigate: () => void;
};

export const CompareBestValueCard = ({
  bestLabel,
  priceText,
  storeText,
  vsAvgPercentText,
  vsAvgLabel,
  lastVerifiedText,
  navigateLabel,
  onNavigate
}: CompareBestValueCardProps) => {
  return (
    <LinearGradient colors={['#137FEC', '#2563EB']} end={{ x: 1, y: 1 }} start={{ x: 0, y: 0 }} style={styles.bestCard}>
      <View pointerEvents="none" style={styles.bestCardOrbTop} />
      <View pointerEvents="none" style={styles.bestCardOrbBottom} />

      <View style={styles.bestCardTopRow}>
        <View>
          <View style={styles.bestLabelRow}>
            <MaterialCommunityIcons color="#DBEAFE" name="star-circle-outline" size={12} />
            <Text style={styles.bestLabelText}>{bestLabel}</Text>
          </View>
          <Text style={styles.bestPrice}>{priceText}</Text>
          <Text numberOfLines={1} style={styles.bestStoreText}>
            {storeText}
          </Text>
        </View>

        <View style={styles.vsAvgChip}>
          <Text style={styles.vsAvgPercent}>{vsAvgPercentText}</Text>
          <Text style={styles.vsAvgText}>{vsAvgLabel}</Text>
        </View>
      </View>

      <View style={styles.bestCardFooterRow}>
        <View style={styles.verifiedRow}>
          <MaterialCommunityIcons color="#DBEAFE" name="clock-outline" size={13} />
          <Text numberOfLines={1} style={styles.verifiedText}>
            {lastVerifiedText}
          </Text>
        </View>

        <PrimaryButton
          label={navigateLabel}
          onPress={onNavigate}
          style={styles.navigateButton}
          textStyle={styles.navigateButtonText}
        />
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  bestCard: {
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
    padding: 20,
    position: 'relative'
  },
  bestCardOrbTop: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 999,
    height: 128,
    position: 'absolute',
    right: -40,
    top: -40,
    width: 128
  },
  bestCardOrbBottom: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 999,
    bottom: -32,
    height: 96,
    left: -32,
    position: 'absolute',
    width: 96
  },
  bestCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  bestLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6
  },
  bestLabelText: {
    color: '#DBEAFE',
    fontFamily: typography.body,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
    lineHeight: 16,
    textTransform: 'uppercase'
  },
  bestPrice: {
    color: colors.white,
    fontFamily: typography.body,
    fontSize: 42,
    fontWeight: '700',
    letterSpacing: -0.7,
    lineHeight: 42,
    marginBottom: 2
  },
  bestStoreText: {
    color: '#DBEAFE',
    fontFamily: typography.body,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    maxWidth: 190
  },
  vsAvgChip: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    justifyContent: 'center',
    minWidth: 60,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  vsAvgPercent: {
    color: colors.white,
    fontFamily: typography.body,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16
  },
  vsAvgText: {
    color: 'rgba(255,255,255,0.85)',
    fontFamily: typography.body,
    fontSize: 10,
    lineHeight: 15
  },
  bestCardFooterRow: {
    alignItems: 'center',
    borderTopColor: 'rgba(255,255,255,0.2)',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16
  },
  verifiedRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    maxWidth: '58%'
  },
  verifiedText: {
    color: '#DBEAFE',
    fontFamily: typography.body,
    fontSize: 12,
    lineHeight: 16
  },
  navigateButton: {
    backgroundColor: colors.white,
    borderRadius: 999,
    minHeight: 32,
    paddingHorizontal: 16,
    paddingVertical: 6
  },
  navigateButtonText: {
    color: '#137FEC',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20
  }
});
