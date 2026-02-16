import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppCard } from '../src/components/ui/AppCard';
import { useI18n } from '../src/i18n/useI18n';
import { colors, spacing, typography } from '../src/theme/tokens';

export default function ProfileScreen() {
  const { t } = useI18n();

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <View style={styles.content}>
        <Text style={styles.title}>{t('profile_title')}</Text>
        <AppCard style={styles.card}>
          <Text style={styles.cardTitle}>{t('profile_placeholder_title')}</Text>
          <Text style={styles.cardBody}>{t('profile_placeholder_body')}</Text>
        </AppCard>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1
  },
  content: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl
  },
  title: {
    color: colors.textPrimary,
    fontFamily: typography.display,
    fontSize: typography.sizes.headingMd,
    marginBottom: spacing.md,
    width: '100%'
  },
  card: {
    borderRadius: 14,
    maxWidth: 448,
    width: '100%'
  },
  cardTitle: {
    color: colors.textPrimary,
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    fontWeight: '700',
    marginBottom: spacing.xs
  },
  cardBody: {
    color: colors.textSecondary,
    fontFamily: typography.body,
    fontSize: typography.sizes.body,
    lineHeight: 22
  }
});

