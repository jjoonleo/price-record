import { StyleSheet, Text, View } from 'react-native';
import { AppCard } from '../ui/AppCard';
import { spacing, typography } from '../../theme/tokens';

type ProductPriceDetailInvalidStateProps = {
  title: string;
  body: string;
};

export const ProductPriceDetailInvalidState = ({ title, body }: ProductPriceDetailInvalidStateProps) => {
  return (
    <View style={styles.wrap}>
      <AppCard style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
      </AppCard>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.md
  },
  card: {
    borderRadius: 16
  },
  title: {
    color: '#0F172A',
    fontFamily: typography.body,
    fontSize: typography.sizes.headingSm,
    fontWeight: '700',
    marginBottom: spacing.xs
  },
  body: {
    color: '#64748B',
    fontFamily: typography.body,
    fontSize: typography.sizes.body,
    lineHeight: 23
  }
});
