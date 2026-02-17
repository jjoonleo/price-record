import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { runMigrations } from '../src/db/migrations';
import { useI18n } from '../src/i18n/useI18n';
import { colors, gradients, radius, spacing, typography } from '../src/theme/tokens';

const BOOT_TIMEOUT_MS = 12000;

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
          setTimeout(() => reject(new Error('Initialization timed out. Please retry.')), BOOT_TIMEOUT_MS);
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
        <ActivityIndicator color={colors.textTertiary} size="large" />
        <Text style={styles.bootTitle}>{t('init_preparing')}</Text>
        <Text style={styles.bootSubtitle}>{t('init_subtitle')}</Text>
        <Text style={styles.versionText}>VERSION 1.0.2</Text>
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
      initialRouteName="index"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ color, focused }) => {
          const iconByRoute: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
            index: focused ? 'home' : 'home-outline',
            compare: focused ? 'compare' : 'compare',
            history: focused ? 'history' : 'history',
            profile: focused ? 'account' : 'account-outline',
            capture: focused ? 'qrcode-scan' : 'qrcode-scan'
          };

          return <MaterialCommunityIcons color={color} name={iconByRoute[route.name] ?? 'circle-outline'} size={20} />;
        }
      })}
    >
      <Tabs.Screen name="index" options={{ title: t('tabs_home') }} />
      <Tabs.Screen name="capture" options={{ href: null }} />
      <Tabs.Screen name="compare" options={{ href: null }} />
      <Tabs.Screen name="history" options={{ title: t('tabs_history') }} />
      <Tabs.Screen name="profile" options={{ title: t('tabs_profile') }} />
      <Tabs.Screen name="product-price-detail" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bootScreen: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl
  },
  bootTitle: {
    color: colors.black,
    fontFamily: typography.display,
    fontSize: typography.sizes.headingMd,
    marginTop: spacing.xl,
    textAlign: 'center'
  },
  bootSubtitle: {
    color: colors.textTertiary,
    fontFamily: typography.body,
    fontSize: typography.sizes.body,
    marginTop: spacing.xs,
    textAlign: 'center'
  },
  versionText: {
    bottom: spacing.xxl,
    color: '#C7C7CC',
    fontFamily: typography.body,
    fontSize: typography.sizes.micro,
    letterSpacing: 0.4,
    position: 'absolute'
  },
  errorTitle: {
    color: colors.danger,
    fontFamily: typography.display,
    fontSize: typography.sizes.headingMd,
    marginBottom: spacing.sm
  },
  errorText: {
    color: colors.textSecondary,
    fontFamily: typography.body,
    textAlign: 'center'
  },
  retryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    marginTop: spacing.lg,
    minWidth: 120,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm
  },
  retryText: {
    color: colors.white,
    fontFamily: typography.body,
    fontSize: typography.sizes.body,
    fontWeight: '700'
  },
  tabBar: {
    backgroundColor: colors.surfaceOverlay,
    borderTopColor: colors.divider,
    borderTopWidth: 1,
    height: 82,
    paddingBottom: 14,
    paddingTop: 6
  },
  tabLabel: {
    fontFamily: typography.body,
    fontSize: typography.sizes.micro,
    fontWeight: '500',
    marginTop: 2
  }
});
