import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EntryLocationMap } from '../src/components/EntryLocationMap';
import { AppCard } from '../src/components/ui/AppCard';
import { PrimaryButton } from '../src/components/ui/PrimaryButton';
import { useI18n } from '../src/i18n/useI18n';
import { colors, spacing, typography } from '../src/theme/tokens';
import {
  formatDetailObservedAt,
  parseProductPriceDetailRouteParams,
  ProductPriceDetailRouteParams,
  resolveDetailDealTone
} from '../src/utils/productPriceDetail';

const TEMP_PRODUCT_IMAGE = require('../public/icons/icon-192.png');

const toPriceLabel = (value: number, locale: string): string =>
  Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0
  })
    .format(value)
    .replace('JP¥', '¥')
    .replace(/\u00A0/g, '');

export default function ProductPriceDetailScreen() {
  const router = useRouter();
  const { language, t } = useI18n();
  const locale = language === 'ko' ? 'ko-KR' : 'en-US';
  const { width } = useWindowDimensions();
  const frameWidth = Math.min(width - spacing.md * 2, 390);
  const contentWidth = Math.min(frameWidth - spacing.md * 2, 358);
  const rawParams = useLocalSearchParams<ProductPriceDetailRouteParams>();
  const parsedParams = useMemo(() => parseProductPriceDetailRouteParams(rawParams), [rawParams]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleBack = () => {
    router.navigate('/compare');
  };

  if (!parsedParams) {
    return (
      <SafeAreaView edges={['top']} style={styles.screen}>
        <View style={styles.header}>
          <View style={[styles.headerRow, { width: frameWidth }]}>
            <Pressable accessibilityRole="button" onPress={handleBack} style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}>
              <MaterialCommunityIcons color={colors.primary} name="chevron-left" size={20} />
              <Text style={styles.headerButtonText}>{t('back')}</Text>
            </Pressable>
            <Text style={styles.headerTitle}>{t('detail_title')}</Text>
            <View style={styles.headerButtonPlaceholder} />
          </View>
        </View>

        <View style={styles.invalidStateWrap}>
          <AppCard style={styles.invalidStateCard}>
            <Text style={styles.invalidStateTitle}>{t('detail_missing_params_title')}</Text>
            <Text style={styles.invalidStateBody}>{t('detail_missing_params_body')}</Text>
          </AppCard>
        </View>
      </SafeAreaView>
    );
  }

  const dealTone = resolveDetailDealTone(parsedParams.latestPriceYen);
  const dealLabel = dealTone === 'great' ? t('detail_badge_great') : t('detail_badge_standard');
  const observedLabel = formatDetailObservedAt(parsedParams.observedAt, locale);
  const priceText = toPriceLabel(parsedParams.latestPriceYen, locale).replace('¥', '');

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <View style={styles.header}>
        <View style={[styles.headerRow, { width: frameWidth }]}>
          <Pressable accessibilityRole="button" onPress={handleBack} style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}>
            <MaterialCommunityIcons color={colors.primary} name="chevron-left" size={20} />
            <Text style={styles.headerButtonText}>{t('back')}</Text>
          </Pressable>

          <Text style={styles.headerTitle}>{t('detail_title')}</Text>

          <Pressable
            accessibilityRole="button"
            onPress={() => setStatusMessage(t('detail_share_pending'))}
            style={({ pressed }) => [styles.headerButtonTrailing, pressed && styles.pressed]}
          >
            <Text style={styles.headerButtonText}>{t('detail_share')}</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.mainColumn, { width: frameWidth }]}>
          <View style={[styles.heroBlock, { width: contentWidth }]}>
            <View style={styles.productImageWrap}>
              <Image source={TEMP_PRODUCT_IMAGE} style={styles.productImage} />
            </View>
            <Text numberOfLines={1} style={styles.productName}>
              {parsedParams.productName}
            </Text>
            <View style={styles.priceWrap}>
              <Text style={styles.priceCurrency}>¥</Text>
              <Text style={styles.priceValue}>{priceText}</Text>
            </View>
            <View style={[styles.dealBadge, dealTone === 'great' ? styles.dealBadgeGreat : styles.dealBadgeStandard]}>
              <View style={[styles.dealDot, dealTone === 'great' ? styles.dealDotGreat : styles.dealDotStandard]} />
              <Text style={[styles.dealLabel, dealTone === 'great' ? styles.dealLabelGreat : styles.dealLabelStandard]}>
                {dealLabel}
              </Text>
            </View>
          </View>

          <View style={[styles.sectionBlock, { width: contentWidth }]}>
            <Text style={styles.sectionHeading}>{t('detail_information_heading')}</Text>
            <AppCard padded={false} style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={styles.infoLeft}>
                  <View style={[styles.infoIconWrap, { backgroundColor: 'rgba(19,127,236,0.1)' }]}>
                    <MaterialCommunityIcons color="#137FEC" name="storefront-outline" size={14} />
                  </View>
                  <Text style={styles.infoLabel}>{t('detail_store_label')}</Text>
                </View>
                <Text numberOfLines={1} style={styles.infoValue}>
                  {parsedParams.storeName}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoLeft}>
                  <View style={[styles.infoIconWrap, { backgroundColor: 'rgba(249,115,22,0.1)' }]}>
                    <MaterialCommunityIcons color="#F97316" name="map-marker-outline" size={14} />
                  </View>
                  <Text style={styles.infoLabel}>{t('detail_area_label')}</Text>
                </View>
                <Text numberOfLines={1} style={styles.infoValue}>
                  {parsedParams.cityArea}
                </Text>
              </View>

              <View style={[styles.infoRow, styles.infoRowLast]}>
                <View style={styles.infoLeft}>
                  <View style={[styles.infoIconWrap, { backgroundColor: 'rgba(168,85,247,0.1)' }]}>
                    <MaterialCommunityIcons color="#A855F7" name="calendar-month-outline" size={14} />
                  </View>
                  <Text style={styles.infoLabel}>{t('detail_observed_label')}</Text>
                </View>
                <Text numberOfLines={1} style={styles.infoValue}>
                  {observedLabel}
                </Text>
              </View>
            </AppCard>
          </View>

          <View style={[styles.sectionBlock, styles.locationSection, { width: contentWidth }]}>
            <Text style={styles.sectionHeading}>{t('detail_location_heading')}</Text>
            <EntryLocationMap
              cityArea={parsedParams.cityArea}
              latitude={parsedParams.latitude}
              longitude={parsedParams.longitude}
              storeName={parsedParams.storeName}
            />
            <PrimaryButton
              label={t('detail_navigate')}
              onPress={() => setStatusMessage(t('detail_navigate_pending'))}
              style={styles.navigateButton}
              textStyle={styles.navigateButtonText}
            />
          </View>

          <View style={[styles.sectionBlock, styles.notesSection, { width: contentWidth }]}>
            <AppCard style={styles.notesCard}>
              <Text style={styles.notesText}>{t('detail_notes_empty')}</Text>
            </AppCard>
            <Text style={styles.notesMeta}>{t('detail_meta_empty')}</Text>
          </View>

          <View style={[styles.actionGroup, { width: contentWidth }]}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setStatusMessage(t('detail_edit_pending'))}
              style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
            >
              <Text style={styles.actionButtonPrimaryText}>{t('detail_edit_entry')}</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => setStatusMessage(t('detail_delete_pending'))}
              style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
            >
              <Text style={styles.actionButtonDangerText}>{t('detail_delete_entry')}</Text>
            </Pressable>
          </View>

          {statusMessage ? <Text style={styles.statusMessage}>{statusMessage}</Text> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#F6F7F8',
    flex: 1
  },
  header: {
    backgroundColor: 'rgba(246,247,248,0.9)',
    borderBottomColor: colors.borderSubtle,
    borderBottomWidth: 1
  },
  headerRow: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    minHeight: 44,
    paddingHorizontal: spacing.md,
    position: 'relative'
  },
  headerButton: {
    alignItems: 'center',
    flexDirection: 'row',
    minWidth: 82
  },
  headerButtonTrailing: {
    alignItems: 'flex-end',
    minWidth: 70
  },
  headerButtonPlaceholder: {
    minWidth: 70
  },
  headerButtonText: {
    color: colors.primary,
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    lineHeight: 26
  },
  headerTitle: {
    color: '#0F172A',
    flex: 1,
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    fontWeight: '700',
    textAlign: 'center'
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 48,
    paddingTop: spacing.lg
  },
  mainColumn: {
    alignItems: 'center',
    minHeight: '100%'
  },
  heroBlock: {
    alignItems: 'center',
    minHeight: 293
  },
  productImageWrap: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.borderSubtle,
    borderRadius: 16,
    borderWidth: 1,
    height: 96,
    justifyContent: 'center',
    marginTop: 6,
    width: 96
  },
  productImage: {
    borderRadius: 14,
    height: 88,
    width: 88
  },
  productName: {
    color: '#64748B',
    fontFamily: typography.body,
    fontSize: typography.sizes.headingSm,
    fontWeight: '500',
    lineHeight: 30,
    marginTop: spacing.lg
  },
  priceWrap: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    marginTop: 2
  },
  priceCurrency: {
    color: '#94A3B8',
    fontFamily: typography.body,
    fontSize: typography.sizes.headingMd,
    fontWeight: '600',
    lineHeight: 32,
    marginBottom: 8
  },
  priceValue: {
    color: '#0F172A',
    fontFamily: typography.body,
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: -1.2,
    lineHeight: 48
  },
  dealBadge: {
    alignItems: 'center',
    borderRadius: 999,
    flexDirection: 'row',
    marginTop: spacing.xs,
    paddingHorizontal: 10,
    paddingVertical: 2
  },
  dealBadgeGreat: {
    backgroundColor: '#DCFCE7'
  },
  dealBadgeStandard: {
    backgroundColor: '#E2E8F0'
  },
  dealDot: {
    borderRadius: 999,
    height: 6,
    marginRight: 6,
    width: 6
  },
  dealDotGreat: {
    backgroundColor: '#22C55E'
  },
  dealDotStandard: {
    backgroundColor: '#64748B'
  },
  dealLabel: {
    fontFamily: typography.body,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16
  },
  dealLabelGreat: {
    color: '#166534'
  },
  dealLabelStandard: {
    color: '#334155'
  },
  sectionBlock: {
    marginTop: spacing.md
  },
  sectionHeading: {
    color: '#64748B',
    fontFamily: typography.body,
    fontSize: typography.sizes.micro,
    fontWeight: '600',
    letterSpacing: 0.6,
    lineHeight: 16,
    marginBottom: spacing.xs,
    textTransform: 'uppercase'
  },
  infoCard: {
    borderRadius: 16,
    overflow: 'hidden'
  },
  infoRow: {
    alignItems: 'center',
    borderBottomColor: colors.dividerSoft,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingHorizontal: spacing.md
  },
  infoRowLast: {
    borderBottomWidth: 0
  },
  infoLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    marginRight: spacing.md
  },
  infoIconWrap: {
    alignItems: 'center',
    borderRadius: 8,
    height: 28,
    justifyContent: 'center',
    marginRight: spacing.sm,
    width: 28
  },
  infoLabel: {
    color: '#0F172A',
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    lineHeight: 26
  },
  infoValue: {
    color: '#64748B',
    flexShrink: 1,
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    lineHeight: 26,
    textAlign: 'right'
  },
  locationSection: {
    marginTop: spacing.xl
  },
  navigateButton: {
    borderRadius: 16,
    marginTop: spacing.sm,
    minHeight: 54
  },
  navigateButtonText: {
    fontSize: typography.sizes.title,
    fontWeight: '600'
  },
  notesSection: {
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
  },
  actionGroup: {
    marginTop: spacing.xl,
    gap: spacing.sm
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.borderSubtle,
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 54,
    justifyContent: 'center',
    paddingHorizontal: spacing.md
  },
  actionButtonPrimaryText: {
    color: '#007AFF',
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    fontWeight: '600',
    lineHeight: 26
  },
  actionButtonDangerText: {
    color: '#FF3B30',
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    fontWeight: '600',
    lineHeight: 26
  },
  statusMessage: {
    color: colors.textSecondary,
    fontFamily: typography.body,
    fontSize: typography.sizes.caption,
    lineHeight: 20,
    marginTop: spacing.md,
    textAlign: 'center'
  },
  invalidStateWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.md
  },
  invalidStateCard: {
    borderRadius: 16
  },
  invalidStateTitle: {
    color: '#0F172A',
    fontFamily: typography.body,
    fontSize: typography.sizes.headingSm,
    fontWeight: '700',
    marginBottom: spacing.xs
  },
  invalidStateBody: {
    color: '#64748B',
    fontFamily: typography.body,
    fontSize: typography.sizes.body,
    lineHeight: 23
  },
  pressed: {
    opacity: 0.82
  }
});
