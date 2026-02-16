import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';
import { AppCard } from '../src/components/ui/AppCard';
import { PillChip } from '../src/components/ui/PillChip';
import { PrimaryButton } from '../src/components/ui/PrimaryButton';
import { ObservedDateInput } from '../src/components/ObservedDateInput';
import { PlacePickerModal } from '../src/components/PlacePickerModal';
import { createPriceEntry } from '../src/db/repositories/priceEntriesRepo';
import { getOrCreateProduct, listProductOptions } from '../src/db/repositories/productsRepo';
import { getOrCreateStore } from '../src/db/repositories/storesRepo';
import { useI18n } from '../src/i18n/useI18n';
import { colors, radius, shadows, spacing, typography } from '../src/theme/tokens';
import { Coordinates, PlaceSelection } from '../src/types/domain';
import { formatYen } from '../src/utils/formatters';
import { shouldApplySuggestedStoreName } from '../src/utils/placeAutofill';

const entrySchema = z.object({
  productName: z.string().trim().min(1),
  storeName: z.string().trim().min(1),
  cityArea: z.string().trim().min(1),
  priceYen: z.coerce.number().int().positive(),
  latitude: z.coerce.number().gte(-90).lte(90),
  longitude: z.coerce.number().gte(-180).lte(180),
  observedAt: z.date()
});

const DEFAULT_COORDS: Coordinates = {
  latitude: 35.6812,
  longitude: 139.7671
};

const PRODUCT_PREVIEW_IMAGE =
  'https://www.figma.com/api/mcp/asset/2c8dfeab-4703-46bb-bf49-2862bbf3f14b';
const MAP_PREVIEW_IMAGE =
  'https://www.figma.com/api/mcp/asset/01bc5b08-f5aa-4e7d-86e5-8204c24e9069';

const SUGGESTED_PRODUCTS = ['Pocky', 'KitKat', 'Matcha', 'Sake'];
const CATEGORIES = ['Snacks', 'Beverage', 'Beauty', 'Daily'];

const nowDate = (): Date => new Date();

const toDateOnlyIso = (date: Date): string => {
  const localDateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return localDateOnly.toISOString();
};

const nextCategory = (current: string): string => {
  const currentIndex = CATEGORIES.indexOf(current);
  const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % CATEGORIES.length : 0;
  return CATEGORIES[nextIndex];
};

export default function CaptureScreen() {
  const router = useRouter();
  const { language, t } = useI18n();
  const locale = language === 'ko' ? 'ko-KR' : 'en-US';

  const [productName, setProductName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [cityArea, setCityArea] = useState('');
  const [priceYen, setPriceYen] = useState('');
  const [latitude, setLatitude] = useState(DEFAULT_COORDS.latitude.toFixed(6));
  const [longitude, setLongitude] = useState(DEFAULT_COORDS.longitude.toFixed(6));
  const [addressLine, setAddressLine] = useState('');
  const [observedAtDate, setObservedAtDate] = useState<Date>(nowDate());
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPlacePickerVisible, setIsPlacePickerVisible] = useState(false);
  const [hasMapSelection, setHasMapSelection] = useState(false);
  const [selectedPlaceName, setSelectedPlaceName] = useState('');
  const [productSuggestions, setProductSuggestions] = useState<string[]>([]);
  const [storeNameTouched, setStoreNameTouched] = useState(false);
  const [lastAutoFilledStoreName, setLastAutoFilledStoreName] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('Snacks');
  const [notes, setNotes] = useState('');

  const observedPreview = useMemo(() => {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(observedAtDate);
  }, [locale, observedAtDate]);

  const pricePreview = useMemo(() => {
    const parsed = Number.parseInt(priceYen, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 398;
  }, [priceYen]);

  const clearForm = () => {
    setPriceYen('');
    setProductName('');
    setStoreName('');
    setCityArea('');
    setAddressLine('');
    setLatitude(DEFAULT_COORDS.latitude.toFixed(6));
    setLongitude(DEFAULT_COORDS.longitude.toFixed(6));
    setHasMapSelection(false);
    setSelectedPlaceName('');
    setStoreNameTouched(false);
    setLastAutoFilledStoreName(null);
    setObservedAtDate(nowDate());
    setProductSuggestions([]);
    setSelectedCategory('Snacks');
    setNotes('');
    setStatusMessage(null);
  };

  const refreshSuggestions = async (query: string) => {
    const options = await listProductOptions(query);
    setProductSuggestions(options.map((option) => option.name).slice(0, 6));
  };

  const getCurrentCoordinates = (): Coordinates => ({
    latitude: Number.parseFloat(latitude) || DEFAULT_COORDS.latitude,
    longitude: Number.parseFloat(longitude) || DEFAULT_COORDS.longitude
  });

  const handleApplyPlaceSelection = (selection: PlaceSelection) => {
    setHasMapSelection(true);
    setSelectedPlaceName(selection.suggestedStoreName ?? selectedPlaceName);
    setLatitude(selection.latitude.toFixed(6));
    setLongitude(selection.longitude.toFixed(6));
    setCityArea(selection.cityArea);

    if (!productName.trim()) {
      setProductName('KitKat Matcha Green Tea');
    }

    if (!priceYen.trim()) {
      setPriceYen('398');
    }

    if (selection.addressLine) {
      setAddressLine(selection.addressLine);
    }

    const canAutoFillStoreName = shouldApplySuggestedStoreName({
      currentStoreName: storeName,
      storeNameTouched,
      lastAutoFilledStoreName
    });

    if (selection.suggestedStoreName && canAutoFillStoreName) {
      setStoreName(selection.suggestedStoreName);
      setLastAutoFilledStoreName(selection.suggestedStoreName);
      setStoreNameTouched(false);
    }

    setStatusMessage(t('map_selected_status'));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setStatusMessage(null);

    if (!hasMapSelection) {
      setIsSaving(false);
      setStatusMessage(t('map_required_status'));
      return;
    }

    const parsed = entrySchema.safeParse({
      productName,
      storeName,
      cityArea,
      priceYen,
      latitude,
      longitude,
      observedAt: observedAtDate
    });

    if (!parsed.success) {
      setIsSaving(false);
      const firstIssue = parsed.error.issues[0];
      setStatusMessage(firstIssue?.message ?? t('input_error'));
      return;
    }

    try {
      const observedAt = toDateOnlyIso(parsed.data.observedAt);
      const product = await getOrCreateProduct(parsed.data.productName);
      const store = await getOrCreateStore({
        name: parsed.data.storeName,
        cityArea: parsed.data.cityArea,
        coordinates: {
          latitude: parsed.data.latitude,
          longitude: parsed.data.longitude
        },
        addressLine
      });

      await createPriceEntry({
        productId: product.id,
        storeId: store.id,
        priceYen: parsed.data.priceYen,
        observedAt
      });

      clearForm();
      setStatusMessage(t('saved_status'));
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : t('save_error'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.screen}>
        <View style={styles.header}>
          <Pressable onPress={() => router.navigate('/compare')} style={styles.headerButton}>
            <MaterialCommunityIcons color={colors.primary} name="chevron-left" size={20} />
            <Text style={styles.headerButtonText}>{t('back')}</Text>
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {hasMapSelection ? t('capture_header_new_entry') : t('capture_header_new_price')}
          </Text>
          <Pressable onPress={clearForm} style={styles.headerButtonRight}>
            <Text style={styles.headerButtonText}>{t('reset')}</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.mainColumn}>
            {!hasMapSelection ? (
              <>
                <Text style={styles.pageHeading}>{t('capture_title')}</Text>

                <View style={styles.sectionWrap}>
                  <Text style={styles.sectionLabel}>{t('merchandise')}</Text>
                  <AppCard padded={false} style={styles.flatCard}>
                    <View style={styles.fieldRow}>
                      <Text style={styles.fieldLabel}>Name</Text>
                      <TextInput
                        placeholder="e.g. Strawberry KitKat"
                        placeholderTextColor={colors.textTertiary}
                        style={styles.rowInput}
                        value={productName}
                        onChangeText={(value) => {
                          setProductName(value);
                          void refreshSuggestions(value);
                        }}
                      />
                    </View>
                    <View style={styles.divider} />
                    <ScrollView
                      horizontal
                      contentContainerStyle={styles.quickChipRow}
                      showsHorizontalScrollIndicator={false}
                    >
                      {SUGGESTED_PRODUCTS.map((label) => (
                        <PillChip
                          key={label}
                          active={productName.trim().toLowerCase() === label.toLowerCase()}
                          label={label}
                          onPress={() => setProductName(label)}
                        />
                      ))}
                      {productSuggestions
                        .filter((item) => !SUGGESTED_PRODUCTS.includes(item))
                        .slice(0, 3)
                        .map((item) => (
                          <PillChip key={item} label={item} onPress={() => setProductName(item)} />
                        ))}
                    </ScrollView>
                  </AppCard>
                </View>

                <View style={styles.sectionWrap}>
                  <Text style={styles.sectionLabel}>{t('capture_details')}</Text>
                  <AppCard padded={false} style={styles.flatCard}>
                    <View style={styles.fieldRow}>
                      <Text style={styles.fieldLabel}>{t('price')}</Text>
                      <View style={styles.priceRowRight}>
                        <TextInput
                          keyboardType="numeric"
                          placeholder="0"
                          placeholderTextColor={colors.textTertiary}
                          style={styles.priceInput}
                          value={priceYen}
                          onChangeText={setPriceYen}
                        />
                        <Text style={styles.currencyText}>JPY</Text>
                      </View>
                    </View>
                    <View style={styles.indentedDivider} />
                    <Pressable style={styles.fieldRow} onPress={() => setSelectedCategory((value) => nextCategory(value))}>
                      <Text style={styles.fieldLabel}>{t('category')}</Text>
                      <View style={styles.trailingRow}>
                        <Text style={styles.trailingValue}>{selectedCategory}</Text>
                        <MaterialCommunityIcons color={colors.textDisabled} name="chevron-right" size={20} />
                      </View>
                    </Pressable>
                    <View style={styles.indentedDivider} />
                    <View style={styles.fieldRow}>
                      <Text style={styles.fieldLabel}>{t('date')}</Text>
                      <Text style={styles.dateValue}>{observedPreview}</Text>
                    </View>
                  </AppCard>
                  <View style={styles.dateInputWrap}>
                    <ObservedDateInput
                      value={observedAtDate}
                      preview={observedPreview}
                      labelDone={t('done')}
                      onChange={setObservedAtDate}
                    />
                  </View>
                </View>

                <View style={styles.sectionWrap}>
                  <AppCard padded={false} style={styles.flatCard}>
                    <View style={styles.fieldRow}>
                      <Text style={styles.fieldLabel}>{t('store')}</Text>
                      <TextInput
                        placeholder="Store Name"
                        placeholderTextColor={colors.textTertiary}
                        style={styles.rowInput}
                        value={storeName}
                        onChangeText={(value) => {
                          setStoreName(value);
                          setStoreNameTouched(true);
                        }}
                      />
                      <Pressable onPress={() => setIsPlacePickerVisible(true)} style={styles.fieldAction}>
                        <MaterialCommunityIcons color={colors.primary} name="map-marker-radius" size={18} />
                      </Pressable>
                    </View>
                    <View style={styles.divider} />
                    <Pressable style={styles.locationQuickRow} onPress={() => setIsPlacePickerVisible(true)}>
                      <View style={styles.locationTile}>
                        <ImageBackground source={{ uri: MAP_PREVIEW_IMAGE }} style={styles.locationTileMap} />
                      </View>
                      <View style={styles.locationQuickMeta}>
                        <Text style={styles.locationQuickTitle}>
                          {hasMapSelection ? cityArea : t('not_selected')}
                        </Text>
                        <Text style={styles.locationQuickSubtitle}>{hasMapSelection ? 'Tokyo, Japan' : t('pick_on_map')}</Text>
                      </View>
                      <MaterialCommunityIcons color={colors.textDisabled} name="chevron-right" size={20} />
                    </Pressable>
                  </AppCard>
                  <Text style={styles.supportText}>{t('capture_share_hint')}</Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.selectedTopSpacing} />
                <AppCard padded={false} style={styles.detectedCard}>
                  <View style={styles.detectedRow}>
                    <Image source={{ uri: PRODUCT_PREVIEW_IMAGE }} style={styles.productPreviewImage} />
                    <View style={styles.detectedContent}>
                      <Text style={styles.detectedName} numberOfLines={1}>
                        {productName || 'KitKat Matcha Green Tea'}
                      </Text>
                      <Text style={styles.detectedSubtitle}>12 Mini Bars Pack</Text>
                      <View style={styles.detectedPriceRow}>
                        <Text style={styles.detectedPrice}>{formatYen(pricePreview, locale).replace('JP¥', '¥')}</Text>
                        <Text style={styles.detectedPriceMuted}>¥450</Text>
                      </View>
                    </View>
                  </View>
                </AppCard>
                <Text style={styles.supportTextLeft}>{t('capture_detected_hint')}</Text>

                <View style={styles.sectionWrap}>
                  <Text style={styles.sectionLabel}>{t('location')}</Text>
                  <AppCard padded={false} style={styles.flatCard}>
                    <View style={styles.mapHeroWrap}>
                      <ImageBackground source={{ uri: MAP_PREVIEW_IMAGE }} style={styles.mapHeroImage}>
                        <View style={styles.pinWrap}>
                          <MaterialCommunityIcons color={colors.mapPin} name="map-marker" size={40} />
                        </View>
                        <Pressable onPress={() => setIsPlacePickerVisible(true)} style={styles.viewMapButton}>
                          <Text style={styles.viewMapText}>{t('view_map')}</Text>
                        </Pressable>
                      </ImageBackground>
                    </View>
                    <View style={styles.locationRowLarge}>
                      <View style={styles.locationIconCircle}>
                        <MaterialCommunityIcons color={colors.white} name="storefront-outline" size={16} />
                      </View>
                      <View style={styles.locationDetails}>
                        <Text style={styles.locationName}>{storeName || selectedPlaceName || t('selected_place')}</Text>
                        <Text style={styles.locationAddress} numberOfLines={1}>
                          {addressLine || t('no_address')}
                        </Text>
                      </View>
                      <Pressable onPress={() => setIsPlacePickerVisible(true)} style={styles.changeButton}>
                        <Text style={styles.changeButtonText}>{t('change')}</Text>
                      </Pressable>
                    </View>
                  </AppCard>
                </View>

                <View style={styles.sectionWrap}>
                  <Text style={styles.sectionLabel}>{t('notes')}</Text>
                  <AppCard padded={false} style={styles.flatCard}>
                    <TextInput
                      multiline
                      maxLength={140}
                      numberOfLines={4}
                      onChangeText={setNotes}
                      placeholder={t('capture_notes_placeholder')}
                      placeholderTextColor={colors.textTertiary}
                      style={styles.notesInput}
                      textAlignVertical="top"
                      value={notes}
                    />
                  </AppCard>
                  <Text style={styles.counterText}>{notes.length}/140</Text>
                </View>
              </>
            )}

            {statusMessage ? <Text style={styles.status}>{statusMessage}</Text> : null}
          </View>
        </ScrollView>

        <View style={styles.bottomAction}>
          <PrimaryButton label={t('save_entry')} onPress={handleSave} disabled={isSaving} />
        </View>
      </KeyboardAvoidingView>

      <PlacePickerModal
        visible={isPlacePickerVisible}
        initialCoordinates={getCurrentCoordinates()}
        onClose={() => setIsPlacePickerVisible(false)}
        onConfirm={handleApplyPlaceSelection}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1
  },
  header: {
    alignItems: 'center',
    backgroundColor: 'rgba(242,242,247,0.9)',
    borderBottomColor: 'rgba(203,213,225,0.5)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingHorizontal: spacing.md
  },
  headerButton: {
    alignItems: 'center',
    flexDirection: 'row',
    minWidth: 70
  },
  headerButtonRight: {
    alignItems: 'flex-end',
    minWidth: 70
  },
  headerButtonText: {
    color: colors.primary,
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    lineHeight: 24
  },
  headerTitle: {
    color: '#0F172A',
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    fontWeight: '700',
    maxWidth: 220,
    textAlign: 'center'
  },
  content: {
    alignItems: 'center',
    paddingBottom: 150,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md
  },
  mainColumn: {
    maxWidth: 448,
    width: '100%'
  },
  pageHeading: {
    color: '#0F172A',
    fontFamily: typography.display,
    fontSize: typography.sizes.headingXl,
    letterSpacing: -0.85,
    marginBottom: spacing.xs
  },
  sectionWrap: {
    marginTop: spacing.sm
  },
  sectionLabel: {
    color: '#8E8E93',
    fontFamily: typography.body,
    fontSize: typography.sizes.caption,
    letterSpacing: 0.3,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.sm,
    textTransform: 'uppercase'
  },
  flatCard: {
    borderRadius: radius.md
  },
  fieldRow: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 48,
    paddingHorizontal: spacing.md
  },
  fieldLabel: {
    color: colors.black,
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    minWidth: 96
  },
  rowInput: {
    color: colors.textPrimary,
    flex: 1,
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    paddingVertical: spacing.sm
  },
  priceRowRight: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  priceInput: {
    color: colors.textPrimary,
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    minWidth: 40,
    paddingVertical: spacing.sm,
    textAlign: 'right'
  },
  currencyText: {
    color: colors.textTertiary,
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    marginLeft: spacing.xs
  },
  divider: {
    backgroundColor: '#C6C6C8',
    height: 0.5
  },
  indentedDivider: {
    backgroundColor: '#C6C6C8',
    height: 0.5,
    marginLeft: spacing.md
  },
  quickChipRow: {
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  trailingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  trailingValue: {
    color: '#8E8E93',
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    marginRight: spacing.xs
  },
  dateValue: {
    color: colors.primary,
    fontFamily: typography.body,
    fontSize: typography.sizes.title
  },
  dateInputWrap: {
    marginTop: spacing.xs
  },
  fieldAction: {
    marginLeft: spacing.xs,
    padding: spacing.xs
  },
  locationQuickRow: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  locationTile: {
    backgroundColor: '#E2E8F0',
    borderColor: '#F1F5F9',
    borderRadius: 6,
    borderWidth: 1,
    height: 40,
    overflow: 'hidden',
    width: 40
  },
  locationTileMap: {
    flex: 1,
    opacity: 0.8
  },
  locationQuickMeta: {
    flex: 1,
    marginLeft: spacing.sm,
    marginRight: spacing.sm
  },
  locationQuickTitle: {
    color: colors.black,
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    lineHeight: 24
  },
  locationQuickSubtitle: {
    color: '#8E8E93',
    fontFamily: typography.body,
    fontSize: typography.sizes.caption,
    lineHeight: 20
  },
  supportText: {
    color: '#8E8E93',
    fontFamily: typography.body,
    fontSize: typography.sizes.caption,
    lineHeight: 20,
    marginTop: spacing.sm,
    textAlign: 'center'
  },
  selectedTopSpacing: {
    height: spacing.xs
  },
  detectedCard: {
    borderRadius: radius.md,
    padding: spacing.md
  },
  detectedRow: {
    flexDirection: 'row'
  },
  productPreviewImage: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    height: 72,
    width: 72
  },
  detectedContent: {
    flex: 1,
    marginLeft: spacing.md
  },
  detectedName: {
    color: colors.black,
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    fontWeight: '700',
    lineHeight: 24
  },
  detectedSubtitle: {
    color: colors.textSecondary,
    fontFamily: typography.body,
    fontSize: typography.sizes.body,
    lineHeight: 22
  },
  detectedPriceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: spacing.xxs
  },
  detectedPrice: {
    color: colors.black,
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    fontWeight: '700'
  },
  detectedPriceMuted: {
    color: colors.textTertiary,
    fontFamily: typography.body,
    fontSize: typography.sizes.body,
    marginLeft: spacing.xs,
    textDecorationLine: 'line-through'
  },
  supportTextLeft: {
    color: colors.textSecondary,
    fontFamily: typography.body,
    fontSize: typography.sizes.caption,
    lineHeight: 20,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm
  },
  mapHeroWrap: {
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    overflow: 'hidden'
  },
  mapHeroImage: {
    height: 128,
    justifyContent: 'space-between'
  },
  pinWrap: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center'
  },
  viewMapButton: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderColor: colors.borderSubtle,
    borderRadius: 8,
    borderWidth: 1,
    margin: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    ...shadows.soft
  },
  viewMapText: {
    color: colors.black,
    fontFamily: typography.body,
    fontSize: typography.sizes.micro,
    lineHeight: 16
  },
  locationRowLarge: {
    alignItems: 'center',
    borderTopColor: colors.dividerSoft,
    borderTopWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md
  },
  locationIconCircle: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32
  },
  locationDetails: {
    flex: 1,
    marginLeft: spacing.sm,
    marginRight: spacing.sm
  },
  locationName: {
    color: colors.black,
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    fontWeight: '700',
    lineHeight: 24
  },
  locationAddress: {
    color: colors.textSecondary,
    fontFamily: typography.body,
    fontSize: typography.sizes.body,
    lineHeight: 22
  },
  changeButton: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs
  },
  changeButtonText: {
    color: colors.primary,
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    lineHeight: 24
  },
  notesInput: {
    color: colors.textPrimary,
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    lineHeight: 28,
    minHeight: 120,
    padding: spacing.md
  },
  counterText: {
    color: colors.textSecondary,
    fontFamily: typography.body,
    fontSize: typography.sizes.caption,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    textAlign: 'right'
  },
  status: {
    color: colors.textSecondary,
    fontFamily: typography.body,
    fontSize: typography.sizes.caption,
    lineHeight: 20,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm
  },
  bottomAction: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderTopColor: colors.divider,
    borderTopWidth: 1,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm
  }
});
