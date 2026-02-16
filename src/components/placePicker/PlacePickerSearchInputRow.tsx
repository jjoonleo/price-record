import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { colors, radius, shadows, spacing, typography } from '../../theme/tokens';

type PlacePickerSearchInputRowProps = {
  value: string;
  editable: boolean;
  isFocused: boolean;
  placeholder: string;
  onBackPress: () => void;
  onChangeText: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onSubmitEditing: () => void;
  onClear: () => void;
  clearAccessibilityLabel: string;
};

export const PlacePickerSearchInputRow = ({
  value,
  editable,
  isFocused,
  placeholder,
  onBackPress,
  onChangeText,
  onFocus,
  onBlur,
  onSubmitEditing,
  onClear,
  clearAccessibilityLabel
}: PlacePickerSearchInputRowProps) => {
  return (
    <View style={styles.row}>
      <Pressable onPress={onBackPress} style={styles.backButton}>
        <MaterialCommunityIcons color={colors.textPrimary} name="chevron-left" size={26} />
      </Pressable>
      <View style={styles.inputShell}>
        {!isFocused ? (
          <MaterialCommunityIcons color={colors.textSecondary} name="magnify" size={16} style={styles.searchIcon} />
        ) : null}
        <TextInput
          editable={editable}
          onBlur={onBlur}
          onChangeText={onChangeText}
          onFocus={onFocus}
          onSubmitEditing={onSubmitEditing}
          blurOnSubmit={false}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
          value={value}
        />
        {value.trim().length > 0 ? (
          <Pressable accessibilityLabel={clearAccessibilityLabel} onPress={onClear} style={styles.clearButton}>
            <MaterialCommunityIcons color={colors.textSecondary} name="close-circle" size={16} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    columnGap: spacing.xs,
    flexDirection: 'row',
    width: '100%'
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(227,227,232,0.8)',
    borderRadius: radius.lg,
    height: 44,
    justifyContent: 'center',
    width: 44,
    ...shadows.soft
  },
  inputShell: {
    alignItems: 'center',
    backgroundColor: 'rgba(227,227,232,0.8)',
    borderRadius: radius.lg,
    flex: 1,
    flexDirection: 'row',
    minHeight: 44,
    minWidth: 0,
    paddingHorizontal: spacing.sm,
    ...shadows.soft
  },
  searchIcon: {
    marginRight: spacing.xs
  },
  input: {
    color: colors.textPrimary,
    flex: 1,
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    lineHeight: 24
  },
  clearButton: {
    alignItems: 'center',
    height: 28,
    justifyContent: 'center',
    width: 28
  }
});
