import { StyleSheet, Text } from 'react-native';
import { AppCard } from '../ui/AppCard';
import { typography } from '../../theme/tokens';

type CompareEmptyStateCardProps = {
  title: string;
  body: string;
};

export const CompareEmptyStateCard = ({ title, body }: CompareEmptyStateCardProps) => {
  return (
    <AppCard style={styles.card}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
    </AppCard>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    marginBottom: 24,
    padding: 20
  },
  emptyTitle: {
    color: '#0F172A',
    fontFamily: typography.body,
    fontSize: typography.sizes.headingSm,
    fontWeight: '700',
    lineHeight: 30,
    marginBottom: 4
  },
  emptyBody: {
    color: '#64748B',
    fontFamily: typography.body,
    fontSize: typography.sizes.body,
    lineHeight: 23
  }
});
