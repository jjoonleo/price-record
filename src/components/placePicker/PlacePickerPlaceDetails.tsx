import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../theme/tokens';

type PlacePickerPlaceDetailsProps = {
  addressLine?: string;
  cityAreaLabel: string;
  noAddressLabel: string;
  websiteUri?: string;
  websiteLabel?: string | null;
  onOpenWebsite: (websiteUri: string) => void;
};

export const PlacePickerPlaceDetails = ({
  addressLine,
  cityAreaLabel,
  noAddressLabel,
  websiteUri,
  websiteLabel,
  onOpenWebsite
}: PlacePickerPlaceDetailsProps) => {
  return (
    <View style={styles.stack}>
      <View style={styles.row}>
        <View style={styles.iconSlot}>
          <MaterialCommunityIcons color={colors.primary} name="map-marker" size={17} />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.primary}>{addressLine || noAddressLabel}</Text>
          <Text style={styles.secondary}>{cityAreaLabel}</Text>
        </View>
      </View>

      {websiteUri && websiteLabel ? (
        <View style={styles.row}>
          <View style={styles.iconSlot}>
            <MaterialCommunityIcons color={colors.textTertiary} name="web" size={17} />
          </View>
          <Pressable
            accessibilityRole="link"
            onPress={() => onOpenWebsite(websiteUri)}
            style={({ pressed }) => [pressed && styles.pressed]}
          >
            <Text numberOfLines={1} style={styles.linkText}>
              {websiteLabel}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  stack: {
    marginTop: spacing.xs,
    rowGap: spacing.sm
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row'
  },
  iconSlot: {
    alignItems: 'center',
    marginRight: spacing.sm,
    width: 28
  },
  textWrap: {
    flex: 1
  },
  primary: {
    color: colors.black,
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    lineHeight: 23.4
  },
  secondary: {
    color: colors.textSecondary,
    fontFamily: typography.body,
    fontSize: typography.sizes.body,
    lineHeight: 20.63
  },
  linkText: {
    color: colors.primary,
    fontFamily: typography.body,
    fontSize: typography.sizes.body,
    lineHeight: 20.63
  },
  pressed: {
    opacity: 0.8
  }
});
