import { StyleSheet, Text, View } from 'react-native';
import { spacing, typography } from '../../theme/tokens';

const BLOCKS = [
  'Header',
  'Hero',
  'Information Section',
  'Location Section',
  'Notes Section',
  'Action Buttons',
  'Status Message'
] as const;

export const ProductPriceDetailLayoutBlueprint = () => {
  return (
    <View accessibilityLabel="product-price-detail-blueprint" style={styles.container}>
      <Text style={styles.title}>Product Price Detail Blueprint</Text>
      {BLOCKS.map((block) => (
        <View key={block} style={styles.block}>
          <Text style={styles.blockText}>{block}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md
  },
  title: {
    color: '#0F172A',
    fontFamily: typography.body,
    fontSize: typography.sizes.body,
    fontWeight: '700',
    marginBottom: spacing.sm
  },
  block: {
    borderColor: '#CBD5E1',
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  blockText: {
    color: '#334155',
    fontFamily: typography.body,
    fontSize: typography.sizes.caption,
    lineHeight: 20
  }
});
