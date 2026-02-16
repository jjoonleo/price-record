import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { runMigrations } from '../src/db/migrations';
import { useI18n } from '../src/i18n/useI18n';
import { colors, gradients, radius, spacing, typography } from '../src/theme/tokens';

export default function RootLayout() {
  const { t } = useI18n();
  const [isReady, setIsReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const bootstrap = async () => {
    try {
      setErrorMessage(null);
      await Promise.race([
        runMigrations(),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Initialization timed out. Please retry.')), 12000);
        })
      ]);
      setIsReady(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t('init_failed'));
    }
  };

  useEffect(() => {
    void bootstrap();
  }, []);

  if (!isReady && !errorMessage) {
    return (
      <LinearGradient colors={gradients.screen} style={styles.bootScreen}>
        <ActivityIndicator color={colors.sea500} size="large" />
        <Text style={styles.bootTitle}>{t('init_preparing')}</Text>
        <Text style={styles.bootSubtitle}>{t('init_subtitle')}</Text>
      </LinearGradient>
    );
  }

  if (errorMessage) {
    return (
      <LinearGradient colors={gradients.screen} style={styles.bootScreen}>
        <Text style={styles.errorTitle}>{t('init_failed')}</Text>
        <Text style={styles.errorText}>{errorMessage}</Text>
        <Pressable onPress={bootstrap} style={styles.retryButton}>
          <Text style={styles.retryText}>{t('retry')}</Text>
        </Pressable>
      </LinearGradient>
    );
  }

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.ink900,
        tabBarInactiveTintColor: colors.slate500,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: 0,
          height: 74,
          paddingBottom: 10,
          paddingTop: 8
        },
        tabBarLabelStyle: {
          fontFamily: typography.body,
          fontWeight: '600',
          fontSize: 12
        },
        tabBarIcon: ({ color, focused, size }) => {
          const iconByRoute: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
            capture: focused ? 'plus-circle' : 'plus-circle-outline',
            compare: focused ? 'chart-bar' : 'chart-bar',
            history: focused ? 'history' : 'history'
          };

          return (
            <MaterialCommunityIcons
              color={color}
              name={iconByRoute[route.name] ?? 'circle-outline'}
              size={size + 2}
            />
          );
        }
      })}
    >
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="capture" options={{ title: t('tabs_capture') }} />
      <Tabs.Screen name="compare" options={{ title: t('tabs_compare') }} />
      <Tabs.Screen name="history" options={{ title: t('tabs_history') }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bootScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl
  },
  bootTitle: {
    marginTop: spacing.lg,
    fontFamily: typography.display,
    color: colors.ink900,
    fontSize: 24
  },
  bootSubtitle: {
    marginTop: spacing.sm,
    fontFamily: typography.body,
    color: colors.ink700,
    fontSize: 14
  },
  errorTitle: {
    fontFamily: typography.display,
    color: colors.coral500,
    fontSize: 24,
    marginBottom: spacing.sm
  },
  errorText: {
    fontFamily: typography.body,
    color: colors.ink700,
    textAlign: 'center',
    marginBottom: spacing.lg
  },
  retryButton: {
    backgroundColor: colors.ink900,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm
  },
  retryText: {
    color: colors.white,
    fontFamily: typography.body,
    fontWeight: '700'
  }
});
