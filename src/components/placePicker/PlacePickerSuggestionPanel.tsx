import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PlaceSuggestion } from '../../services/placesService';
import { colors, radius, shadows, spacing, typography } from '../../theme/tokens';

type PlacePickerSuggestionPanelProps = {
  isVisible: boolean;
  isLoading: boolean;
  suggestions: PlaceSuggestion[];
  selectedSuggestionId: string | null;
  loadingLabel: string;
  applyingLabel: string;
  isWeb?: boolean;
  onSuggestionPressIn: () => void;
  onSuggestionPress: (suggestion: PlaceSuggestion) => void;
};

export const PlacePickerSuggestionPanel = ({
  isVisible,
  isLoading,
  suggestions,
  selectedSuggestionId,
  loadingLabel,
  applyingLabel,
  isWeb = false,
  onSuggestionPressIn,
  onSuggestionPress
}: PlacePickerSuggestionPanelProps) => {
  if (!isVisible || (!isLoading && suggestions.length === 0)) {
    return null;
  }

  return (
    <View style={[styles.panel, isWeb && styles.panelWeb]}>
      {isLoading ? (
        <View style={styles.loaderRow}>
          <ActivityIndicator color={colors.primary} size="small" />
          <Text style={styles.loaderText}>{loadingLabel}</Text>
        </View>
      ) : (
        <ScrollView keyboardShouldPersistTaps="always">
          {suggestions.map((suggestion) => (
            <Pressable
              key={suggestion.placeId}
              onPressIn={onSuggestionPressIn}
              onPress={() => onSuggestionPress(suggestion)}
              style={styles.item}
            >
              <Text style={styles.primary}>{suggestion.primaryText}</Text>
              {suggestion.secondaryText ? <Text style={styles.secondary}>{suggestion.secondaryText}</Text> : null}
              {selectedSuggestionId === suggestion.placeId ? <Text style={styles.loaderText}>{applyingLabel}</Text> : null}
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.white,
    borderColor: colors.borderSubtle,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginTop: spacing.xs,
    maxHeight: 220,
    ...shadows.card
  },
  panelWeb: {
    zIndex: 40
  },
  item: {
    borderBottomColor: colors.dividerSoft,
    borderBottomWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  primary: {
    color: colors.textPrimary,
    fontFamily: typography.body,
    fontSize: typography.sizes.caption,
    fontWeight: '700'
  },
  secondary: {
    color: colors.textSecondary,
    fontFamily: typography.body,
    fontSize: typography.sizes.caption,
    marginTop: 2
  },
  loaderRow: {
    alignItems: 'center',
    columnGap: spacing.sm,
    flexDirection: 'row',
    padding: spacing.md
  },
  loaderText: {
    color: colors.textSecondary,
    fontFamily: typography.body,
    fontSize: typography.sizes.caption
  }
});
