import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../theme/tokens';

const blueprintLines = [
  '<main data-screen="place-picker-modal">',
  '  <section data-slot="map-surface">',
  '    <header data-slot="search-overlay">',
  '      <div data-slot="search-input-row" />',
  '      <div data-slot="status-messages" />',
  '      <aside data-slot="suggestion-panel" />',
  '    </header>',
  '    <aside data-slot="floating-controls" />',
  '    <footer data-slot="place-info-sheet">',
  '      <header data-slot="sheet-header" />',
  '      <section data-slot="place-details" />',
  '      <section data-slot="confirm-action" />',
  '    </footer>',
  '  </section>',
  '</main>'
] as const;

export const PLACE_PICKER_LAYOUT_BLUEPRINT_HTML = blueprintLines.join('\n');

export const PlacePickerLayoutBlueprint = () => {
  return (
    <View style={styles.container}>
      {blueprintLines.map((line) => (
        <Text key={line} style={styles.line}>
          {line}
        </Text>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderColor: colors.borderSubtle,
    borderRadius: 12,
    borderWidth: 1,
    padding: spacing.md
  },
  line: {
    color: colors.textPrimary,
    fontFamily: typography.mono,
    fontSize: typography.sizes.caption,
    lineHeight: 20
  }
});
