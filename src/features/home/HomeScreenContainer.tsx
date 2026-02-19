import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { shallow } from 'zustand/shallow';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { filterHomeListItems } from './homeListModel';
import { useI18n } from '../../i18n/useI18n';
import { useFiltersStore } from '../../state/useFiltersStore';
import { colors, spacing, typography } from '../../theme/tokens';
import { formatYen } from '../../utils/formatters';
import { resolveProductImageSource } from '../../utils/productImage';
import { homeScreenSelectors } from './store/homeScreenSelectors';
import { useHomeScreenStoreWithEquality } from './store/homeScreenStoreContext';

const toPriceLabel = (value: number, locale: string): string =>
  formatYen(value, locale).replace('JP¥', '¥').replace(/\u00A0/g, '');

export const HomeScreenContainer = () => {
  const router = useRouter();
  const { language, t } = useI18n();
  const locale = language === 'ko' ? 'ko-KR' : 'en-US';
  const { width } = useWindowDimensions();
  const frameWidth = Math.min(Math.max(width - spacing.md * 2, 0), 390);
  const { setSelectedProductId, clearHistoryStoreFilter } = useFiltersStore();

  const {
    searchText,
    items,
    productImageById,
    isLoading,
    errorMessage,
    setSearchText,
    clearSearchText,
    hydrateHome
  } = useHomeScreenStoreWithEquality(
    (state) => ({
      searchText: homeScreenSelectors.searchText(state),
      items: homeScreenSelectors.items(state),
      productImageById: homeScreenSelectors.productImageById(state),
      isLoading: homeScreenSelectors.isLoading(state),
      errorMessage: homeScreenSelectors.errorMessage(state),
      setSearchText: homeScreenSelectors.setSearchText(state),
      clearSearchText: homeScreenSelectors.clearSearchText(state),
      hydrateHome: homeScreenSelectors.hydrateHome(state)
    }),
    shallow
  );

  useFocusEffect(
    useCallback(() => {
      void hydrateHome(t('home_load_error'));
    }, [hydrateHome, t])
  );

  const filteredItems = useMemo(
    () => filterHomeListItems(items, searchText),
    [items, searchText]
  );

  const handleOpenCompare = useCallback(
    (productId: string) => {
      setSelectedProductId(productId);
      clearHistoryStoreFilter();
      router.push('/compare');
    },
    [clearHistoryStoreFilter, router, setSelectedProductId]
  );

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <View style={styles.header}>
        <View style={[styles.headerInner, { width: frameWidth }]}>
          <Text style={styles.title}>{t('home_title')}</Text>

          <View style={styles.searchWrap}>
            <MaterialCommunityIcons
              color={colors.textTertiary}
              name="magnify"
              size={17}
              style={styles.searchIcon}
            />
            <TextInput
              accessibilityLabel={t('home_search_placeholder')}
              onChangeText={setSearchText}
              placeholder={t('home_search_placeholder')}
              placeholderTextColor={colors.textSecondary}
              style={styles.searchInput}
              value={searchText}
            />
            {searchText ? (
              <Pressable
                accessibilityRole="button"
                onPress={clearSearchText}
                style={({ pressed }) => [styles.searchClearButton, pressed && styles.pressed]}
              >
                <MaterialCommunityIcons color={colors.textTertiary} name="close-circle" size={16} />
              </Pressable>
            ) : (
              <View style={styles.searchTrailingIconWrap}>
                <MaterialCommunityIcons color={colors.textTertiary} name="tune-variant" size={16} />
              </View>
            )}
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={[styles.mainColumn, { width: frameWidth }]}>
          {isLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={colors.primary} size="small" />
              <Text style={styles.loadingText}>{t('home_loading')}</Text>
            </View>
          ) : null}

          {!isLoading && errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          {!isLoading && !errorMessage && items.length === 0 ? (
            <View style={styles.messageCard}>
              <Text style={styles.messageTitle}>{t('home_empty_title')}</Text>
              <Text style={styles.messageBody}>{t('home_empty_body')}</Text>
            </View>
          ) : null}

          {!isLoading && !errorMessage && items.length > 0 && filteredItems.length === 0 ? (
            <View style={styles.messageCard}>
              <Text style={styles.messageTitle}>{t('home_no_results')}</Text>
            </View>
          ) : null}

          {!isLoading && !errorMessage && filteredItems.length > 0 ? (
            <View style={styles.listCard}>
              {filteredItems.map((item, index) => {
                const imageSource = resolveProductImageSource(productImageById[item.productId]);
                const hasPriceInfo = item.priceYen !== null;
                const subtitle = hasPriceInfo
                  ? `${item.storeName} • ${item.cityArea}`
                  : t('home_no_price_subtitle');
                const priceLabel =
                  item.priceYen === null
                    ? t('home_no_price_badge')
                    : toPriceLabel(item.priceYen, locale);

                return (
                  <Pressable
                    key={item.productId}
                    accessibilityRole="button"
                    onPress={() => handleOpenCompare(item.productId)}
                    style={({ pressed }) => [
                      styles.row,
                      index > 0 && styles.rowDivider,
                      pressed && styles.pressed
                    ]}
                  >
                    <View style={styles.thumbnailFrame}>
                      <View style={styles.thumbnailBackground}>
                        <Image source={imageSource} style={styles.thumbnailImage} />
                      </View>
                    </View>

                    <View style={styles.itemMeta}>
                      <Text numberOfLines={1} style={styles.itemTitle}>
                        {item.productName}
                      </Text>
                      <Text numberOfLines={1} style={styles.itemSubtitle}>
                        {subtitle}
                      </Text>
                    </View>

                    <Text style={styles.itemPrice}>{priceLabel}</Text>
                    <MaterialCommunityIcons color={colors.textDisabled} name="chevron-right" size={16} />
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>
      </ScrollView>

      <Pressable
        accessibilityHint={t('home_capture')}
        accessibilityRole="button"
        onPress={() => router.push('/capture')}
        style={({ pressed }) => [styles.fab, pressed && styles.pressed]}
      >
        <MaterialCommunityIcons color={colors.white} name="plus" size={30} />
      </Pressable>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#F6F7F8',
    flex: 1
  },
  header: {
    alignItems: 'center',
    backgroundColor: 'rgba(246,247,248,0.95)',
    borderBottomColor: colors.dividerSoft,
    borderBottomWidth: 1,
    paddingBottom: 16,
    paddingTop: 6
  },
  headerInner: {
    alignItems: 'flex-start'
  },
  title: {
    color: colors.textPrimary,
    fontFamily: typography.body,
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.8,
    lineHeight: 43,
    marginBottom: spacing.xs
  },
  searchWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(229,231,235,0.7)',
    borderRadius: 10,
    flexDirection: 'row',
    minHeight: 35,
    width: '100%'
  },
  searchIcon: {
    marginLeft: spacing.sm,
    marginRight: spacing.xs
  },
  searchInput: {
    color: colors.textSecondary,
    flex: 1,
    fontFamily: typography.body,
    fontSize: 16,
    lineHeight: 22,
    minHeight: 35,
    paddingVertical: 0
  },
  searchClearButton: {
    alignItems: 'center',
    height: 35,
    justifyContent: 'center',
    width: 32
  },
  searchTrailingIconWrap: {
    alignItems: 'center',
    height: 35,
    justifyContent: 'center',
    width: 32
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 138,
    paddingTop: spacing.md
  },
  mainColumn: {
    alignItems: 'center',
    minHeight: '100%'
  },
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 90,
    width: '100%'
  },
  loadingText: {
    color: colors.textSecondary,
    fontFamily: typography.body,
    fontSize: typography.sizes.caption,
    marginTop: spacing.xs
  },
  errorText: {
    color: colors.danger,
    fontFamily: typography.body,
    fontSize: typography.sizes.caption,
    marginTop: spacing.xs,
    width: '100%'
  },
  messageCard: {
    backgroundColor: colors.surface,
    borderColor: colors.divider,
    borderRadius: 13,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    width: '100%'
  },
  messageTitle: {
    color: colors.textPrimary,
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    fontWeight: '700',
    lineHeight: 24
  },
  messageBody: {
    color: colors.textSecondary,
    fontFamily: typography.body,
    fontSize: typography.sizes.body,
    lineHeight: 22,
    marginTop: 4
  },
  listCard: {
    backgroundColor: colors.surface,
    borderColor: colors.divider,
    borderRadius: 13,
    borderWidth: 1,
    overflow: 'hidden',
    width: '100%'
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 71.5,
    paddingHorizontal: spacing.sm,
    paddingVertical: 12
  },
  rowDivider: {
    borderTopColor: colors.divider,
    borderTopWidth: 1
  },
  thumbnailFrame: {
    height: 40,
    marginRight: spacing.sm,
    width: 40
  },
  thumbnailBackground: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 6,
    height: 40,
    overflow: 'hidden',
    width: 40
  },
  thumbnailImage: {
    borderRadius: 6,
    height: 40,
    width: 40
  },
  itemMeta: {
    flex: 1,
    minWidth: 0,
    paddingRight: spacing.xs
  },
  itemTitle: {
    color: colors.textPrimary,
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    fontWeight: '500',
    lineHeight: 26
  },
  itemSubtitle: {
    color: colors.textSecondary,
    fontFamily: typography.body,
    fontSize: typography.sizes.body,
    lineHeight: 21
  },
  itemPrice: {
    color: '#137FEC',
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    fontWeight: '700',
    lineHeight: 26,
    marginRight: 4
  },
  fab: {
    alignItems: 'center',
    backgroundColor: '#137FEC',
    borderRadius: 999,
    bottom: 96,
    height: 56,
    justifyContent: 'center',
    position: 'absolute',
    right: spacing.md,
    width: 56,
    ...{
      shadowColor: '#137FEC',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 8
    }
  },
  pressed: {
    opacity: 0.88
  }
});
