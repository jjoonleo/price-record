import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../theme/tokens';

type PlacePickerInfoHeaderProps = {
  title: string;
  meta: string;
  onClose: () => void;
};

export const PlacePickerInfoHeader = ({
  title,
  meta,
  onClose
}: PlacePickerInfoHeaderProps) => {
  return (
    <View style={styles.headerRow}>
      <View style={styles.titleWrap}>
        <Text numberOfLines={1} style={styles.title}>
          {title}
        </Text>
        <Text numberOfLines={1} style={styles.meta}>
          {meta}
        </Text>
      </View>
      <Pressable onPress={onClose} style={styles.closeButton}>
        <MaterialCommunityIcons color={colors.textSecondary} name="close" size={18} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  titleWrap: {
    flex: 1,
    paddingRight: spacing.md
  },
  title: {
    color: colors.black,
    fontFamily: typography.display,
    fontSize: typography.sizes.headingMd,
    letterSpacing: -0.55,
    lineHeight: 28
  },
  meta: {
    color: colors.textSecondary,
    fontFamily: typography.body,
    fontSize: typography.sizes.body,
    lineHeight: 22.5,
    marginTop: spacing.xxs
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: '#E3E3E8',
    borderRadius: 15,
    height: 30,
    justifyContent: 'center',
    width: 30
  }
});
