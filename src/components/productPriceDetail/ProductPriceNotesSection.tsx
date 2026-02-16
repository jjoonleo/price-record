import { StyleSheet, Text, View } from 'react-native';
import { AppCard } from '../ui/AppCard';
import { spacing, typography } from '../../theme/tokens';

type ProductPriceNotesSectionProps = {
  width: number;
  notes: string;
  meta: string;
};

export const ProductPriceNotesSection = ({ width, notes, meta }: ProductPriceNotesSectionProps) => {
  return (
    <View style={[styles.sectionBlock, { width }]}>
      <AppCard style={styles.notesCard}>
        <Text style={styles.notesText}>{notes}</Text>
      </AppCard>
      <Text style={styles.notesMeta}>{meta}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionBlock: {
    marginTop: spacing.xl
  },
  notesCard: {
    borderRadius: 16,
    minHeight: 80
  },
  notesText: {
    color: '#475569',
    fontFamily: typography.body,
    fontSize: typography.sizes.body,
    lineHeight: 24
  },
  notesMeta: {
    color: '#94A3B8',
    fontFamily: typography.body,
    fontSize: typography.sizes.micro,
    lineHeight: 16,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xs
  }
});
