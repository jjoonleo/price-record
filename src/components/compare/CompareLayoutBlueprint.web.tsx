import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../theme/tokens';

const blueprintLines = [
  '<main data-screen="compare">',
  '  <header data-slot="compare-header" />',
  '  <section data-slot="product-hero" />',
  '  <section data-slot="best-value-card" />',
  '  <section data-slot="price-comparison-card">',
  '    <button data-slot="view-full-history" />',
  '  </section>',
  '  <section data-slot="top-recommendations-card" />',
  '</main>'
] as const;

export const COMPARE_LAYOUT_BLUEPRINT_HTML = blueprintLines.join('\n');

export const CompareLayoutBlueprint = () => {
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
