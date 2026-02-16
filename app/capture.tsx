import { MaterialCommunityIcons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Controller, SubmitErrorHandler, SubmitHandler, useForm } from 'react-hook-form';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ObservedDateInput } from '../src/components/ObservedDateInput';
import { PlacePickerModal } from '../src/components/PlacePickerModal';
import { PrimaryButton } from '../src/components/ui/PrimaryButton';
import {
  CAPTURE_NOTES_LIMIT,
  CaptureFormValues,
  DEFAULT_CAPTURE_COORDINATES,
  createCaptureFormSchema,
  getCaptureFormDefaults
} from '../src/features/capture/formValidation';
import { useI18n } from '../src/i18n/useI18n';
import { createPriceEntry } from '../src/db/repositories/priceEntriesRepo';
import { getOrCreateProduct, listProductOptions } from '../src/db/repositories/productsRepo';
import { getOrCreateStore } from '../src/db/repositories/storesRepo';
import { captureCurrentLocation } from '../src/services/locationService';
import { colors, radius, shadows, spacing, typography } from '../src/theme/tokens';
import { Coordinates, PlaceSelection } from '../src/types/domain';
import { shouldApplySuggestedStoreName } from '../src/utils/placeAutofill';

const DEFAULT_COORDINATES: Coordinates = {
  latitude: DEFAULT_CAPTURE_COORDINATES.latitude,
  longitude: DEFAULT_CAPTURE_COORDINATES.longitude
};

const toDateOnlyIso = (date: Date): string => {
  const localDateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return localDateOnly.toISOString();
};

export default function CaptureScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { language, t } = useI18n();

  const [addressLine, setAddressLine] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPlacePickerVisible, setIsPlacePickerVisible] = useState(false);
  const [selectedPlaceName, setSelectedPlaceName] = useState('');
  const [productSuggestions, setProductSuggestions] = useState<string[]>([]);
  const [storeNameTouched, setStoreNameTouched] = useState(false);
  const [lastAutoFilledStoreName, setLastAutoFilledStoreName] = useState<string | null>(null);
  const [initialPickerCoordinates, setInitialPickerCoordinates] = useState<Coordinates>(DEFAULT_COORDINATES);

  const locale = language === 'ko' ? 'ko-KR' : 'en-US';
  const frameWidth = useMemo(() => Math.min(Math.max(width - spacing.md * 2, 0), 448), [width]);
  const bottomBarInset = Math.max(insets.bottom, spacing.md);
  const scrollBottomPadding = 124 + bottomBarInset;

  const schema = useMemo(
    () =>
      createCaptureFormSchema({
        productRequired: t('validation_product_required'),
        priceRequired: t('validation_price_required'),
        priceInvalidInteger: t('validation_price_invalid_integer'),
        pricePositive: t('validation_price_positive'),
        storeRequired: t('validation_store_required'),
        cityAreaRequired: t('validation_city_area_required'),
        dateRequired: t('validation_date_required'),
        locationRequired: t('validation_location_required'),
        coordinatesInvalid: t('validation_coordinates_invalid'),
        notesTooLong: t('input_error')
      }),
    [t]
  );

  const {
    control,
    formState: { errors },
    getValues,
    handleSubmit,
    reset,
    setValue,
    watch
  } = useForm<CaptureFormValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: getCaptureFormDefaults()
  });

  const storeName = watch('storeName');
  const cityArea = watch('cityArea');
  const latitude = watch('latitude');
  const longitude = watch('longitude');
  const notes = watch('notes');
  const observedAtDate = watch('observedAt');
  const hasMapSelection = watch('hasMapSelection');

  const observedPreview = useMemo(() => {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(observedAtDate);
  }, [locale, observedAtDate]);

  const refreshSuggestions = async (query: string) => {
    if (query.trim().length === 0) {
      setProductSuggestions([]);
      return;
    }

    const options = await listProductOptions(query);
    setProductSuggestions(options.map((option) => option.name).slice(0, 6));
  };

  const resetDraft = (nextStatus: string | null = null) => {
    reset(getCaptureFormDefaults());
    setAddressLine('');
    setSelectedPlaceName('');
    setProductSuggestions([]);
    setStoreNameTouched(false);
    setLastAutoFilledStoreName(null);
    setInitialPickerCoordinates(DEFAULT_COORDINATES);
    setStatusMessage(nextStatus);
  };

  const openPlacePicker = async () => {
    if (hasMapSelection) {
      setIsPlacePickerVisible(true);
      return;
    }

    let nextCoordinates = DEFAULT_COORDINATES;
    try {
      const locationResult = await captureCurrentLocation();
      if (locationResult.status === 'granted') {
        nextCoordinates = locationResult.coordinates;
      }
    } catch {
      // keep fallback coordinates
    }

    setInitialPickerCoordinates(nextCoordinates);
    setIsPlacePickerVisible(true);
  };

  const handleApplyPlaceSelection = (selection: PlaceSelection) => {
    setInitialPickerCoordinates({ latitude: selection.latitude, longitude: selection.longitude });
    setSelectedPlaceName(selection.suggestedStoreName ?? '');
    setAddressLine(selection.addressLine ?? '');

    setValue('hasMapSelection', true, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true
    });
    setValue('latitude', selection.latitude.toFixed(6), {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true
    });
    setValue('longitude', selection.longitude.toFixed(6), {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true
    });
    setValue('cityArea', selection.cityArea, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true
    });

    const canAutoFillStoreName = shouldApplySuggestedStoreName({
      currentStoreName: getValues('storeName'),
      storeNameTouched,
      lastAutoFilledStoreName
    });

    if (selection.suggestedStoreName && canAutoFillStoreName) {
      setValue('storeName', selection.suggestedStoreName, {
        shouldDirty: true,
        shouldValidate: true
      });
      setLastAutoFilledStoreName(selection.suggestedStoreName);
      setStoreNameTouched(false);
    }

    setStatusMessage(t('map_selected_status'));
  };

  const onValidSubmit: SubmitHandler<CaptureFormValues> = async (values) => {
    setIsSaving(true);
    setStatusMessage(null);

    try {
      const observedAt = toDateOnlyIso(values.observedAt);
      const product = await getOrCreateProduct(values.productName);
      const store = await getOrCreateStore({
        name: values.storeName,
        cityArea: values.cityArea,
        coordinates: {
          latitude: Number(values.latitude),
          longitude: Number(values.longitude)
        },
        addressLine
      });

      await createPriceEntry({
        productId: product.id,
        storeId: store.id,
        priceYen: Number(values.priceYen),
        observedAt
      });

      resetDraft(t('saved_status'));
      Alert.alert(t('saved_title'), t('saved_message'));
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : t('save_error'));
    } finally {
      setIsSaving(false);
    }
  };

  const onInvalidSubmit: SubmitErrorHandler<CaptureFormValues> = () => {
    // Inline field-level errors are shown via react-hook-form state.
  };

  const submitForm = handleSubmit(onValidSubmit, onInvalidSubmit);

  const locationPrimary = hasMapSelection
    ? selectedPlaceName || storeName || t('unnamed_place')
    : t('not_selected');
  const locationSecondary = hasMapSelection
    ? addressLine || cityArea || t('not_selected')
    : t('not_selected');
  const locationErrorMessage =
    errors.hasMapSelection?.message ||
    errors.cityArea?.message ||
    errors.latitude?.message ||
    errors.longitude?.message;

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.screen}>
        <View style={styles.screen}>
          <View style={styles.headerWrap}>
            <View style={[styles.headerRow, { width: frameWidth }]}>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.navigate('/compare')}
                style={({ pressed }) => [styles.headerActionLeft, pressed && styles.pressed]}
              >
                <MaterialCommunityIcons color={colors.primary} name="chevron-left" size={18} />
                <Text style={styles.headerActionText}>{t('back')}</Text>
              </Pressable>

              <Text style={styles.headerTitle}>{t('capture_header_new_price')}</Text>

              <Pressable
                accessibilityRole="button"
                onPress={() => resetDraft(null)}
                style={({ pressed }) => [styles.headerActionRight, pressed && styles.pressed]}
              >
                <Text style={styles.headerActionText}>{t('reset')}</Text>
              </Pressable>
            </View>
          </View>

          <ScrollView
            contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPadding }]}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[styles.mainColumn, { width: frameWidth }]}>
              <Text style={styles.pageTitle}>{t('capture_header_new_entry')}</Text>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>{t('merchandise')}</Text>
                <View style={styles.card}>
                  <View style={styles.fieldRow}>
                    <Text style={styles.rowLabel}>{t('name')}</Text>
                    <Controller
                      control={control}
                      name="productName"
                      render={({ field: { onBlur, onChange, value } }) => (
                        <TextInput
                          placeholder={t('capture_product_placeholder')}
                          placeholderTextColor={colors.textTertiary}
                          style={styles.rowInput}
                          value={value}
                          onBlur={onBlur}
                          onChangeText={(nextValue) => {
                            onChange(nextValue);
                            void refreshSuggestions(nextValue);
                          }}
                        />
                      )}
                    />
                  </View>

                  {errors.productName?.message ? <Text style={styles.fieldError}>{errors.productName.message}</Text> : null}

                  {productSuggestions.length > 0 ? (
                    <>
                      <View style={styles.divider} />
                      <View style={styles.chipsRow}>
                        {productSuggestions.map((item) => (
                          <Pressable
                            key={item}
                            onPress={() => {
                              setValue('productName', item, {
                                shouldDirty: true,
                                shouldValidate: true
                              });
                              setProductSuggestions([]);
                            }}
                            style={styles.suggestionChip}
                          >
                            <Text style={styles.suggestionChipText}>{item}</Text>
                          </Pressable>
                        ))}
                      </View>
                    </>
                  ) : null}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>{t('capture_details')}</Text>
                <View style={styles.card}>
                  <View style={styles.fieldRow}>
                    <Text style={styles.rowLabel}>{t('price')}</Text>
                    <View style={styles.priceInputWrap}>
                      <Controller
                        control={control}
                        name="priceYen"
                        render={({ field: { onBlur, onChange, value } }) => (
                          <TextInput
                            keyboardType="numeric"
                            placeholder={t('capture_price_placeholder')}
                            placeholderTextColor={colors.textTertiary}
                            style={styles.priceInput}
                            value={value}
                            onBlur={onBlur}
                            onChangeText={onChange}
                          />
                        )}
                      />
                      <Text style={styles.currencyLabel}>JPY</Text>
                    </View>
                  </View>

                  {errors.priceYen?.message ? <Text style={styles.fieldError}>{errors.priceYen.message}</Text> : null}

                  <View style={styles.divider} />

                  <View style={styles.dateRow}>
                    <Text style={styles.rowLabel}>{t('date')}</Text>
                    <View style={styles.dateInputWrap}>
                      <Controller
                        control={control}
                        name="observedAt"
                        render={({ field }) => (
                          <ObservedDateInput
                            value={field.value}
                            preview={observedPreview}
                            labelDone={t('done')}
                            onChange={(nextDate) => {
                              field.onChange(nextDate);
                              field.onBlur();
                            }}
                          />
                        )}
                      />
                    </View>
                  </View>

                  {errors.observedAt?.message ? <Text style={styles.fieldError}>{errors.observedAt.message}</Text> : null}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>{t('location')}</Text>
                <View style={styles.card}>
                  <View style={styles.fieldRow}>
                    <Text style={styles.rowLabel}>{t('store')}</Text>
                    <View style={styles.storeInputWrap}>
                      <Controller
                        control={control}
                        name="storeName"
                        render={({ field: { onBlur, onChange, value } }) => (
                          <TextInput
                            placeholder={t('capture_store_placeholder')}
                            placeholderTextColor={colors.textTertiary}
                            style={styles.rowInput}
                            value={value}
                            onBlur={onBlur}
                            onChangeText={(nextValue) => {
                              onChange(nextValue);
                              setStoreNameTouched(true);
                            }}
                          />
                        )}
                      />
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => {
                          void openPlacePicker();
                        }}
                        style={({ pressed }) => [styles.mapEntryButton, pressed && styles.pressed]}
                      >
                        <MaterialCommunityIcons color={colors.primary} name="map-marker-outline" size={18} />
                      </Pressable>
                    </View>
                  </View>

                  {errors.storeName?.message ? <Text style={styles.fieldError}>{errors.storeName.message}</Text> : null}

                  <View style={styles.divider} />

                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      void openPlacePicker();
                    }}
                    style={({ pressed }) => [styles.locationSummaryRow, pressed && styles.pressed]}
                  >
                    <View style={styles.locationBadge}>
                      <MaterialCommunityIcons color={colors.primary} name="map-marker" size={16} />
                    </View>
                    <View style={styles.locationTextWrap}>
                      <Text numberOfLines={1} style={styles.locationPrimaryText}>
                        {locationPrimary}
                      </Text>
                      <Text numberOfLines={1} style={styles.locationSecondaryText}>
                        {locationSecondary}
                      </Text>
                    </View>
                    <Text style={styles.locationActionText}>{hasMapSelection ? t('change') : t('pick_on_map')}</Text>
                  </Pressable>
                </View>

                {!hasMapSelection ? <Text style={styles.locationRequiredHint}>{t('location_required_hint')}</Text> : null}
                {locationErrorMessage ? <Text style={styles.fieldErrorPadded}>{locationErrorMessage}</Text> : null}
                <Text style={styles.shareHint}>{t('capture_share_hint')}</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>{t('notes')}</Text>
                <View style={styles.notesCard}>
                  <Controller
                    control={control}
                    name="notes"
                    render={({ field: { onBlur, onChange, value } }) => (
                      <TextInput
                        multiline
                        maxLength={CAPTURE_NOTES_LIMIT}
                        placeholder={t('capture_notes_placeholder')}
                        placeholderTextColor={colors.textTertiary}
                        style={styles.notesInput}
                        textAlignVertical="top"
                        value={value}
                        onBlur={onBlur}
                        onChangeText={onChange}
                      />
                    )}
                  />
                </View>
                <Text style={styles.notesCounter}>
                  {notes.length}/{CAPTURE_NOTES_LIMIT}
                </Text>
                {errors.notes?.message ? <Text style={styles.fieldErrorPadded}>{errors.notes.message}</Text> : null}
              </View>

              {statusMessage ? <Text style={styles.statusMessage}>{statusMessage}</Text> : null}
            </View>
          </ScrollView>

          <View style={[styles.bottomBar, { paddingBottom: bottomBarInset }]}>
            <View style={[styles.bottomBarInner, { width: frameWidth }]}>
              <PrimaryButton
                label={isSaving ? t('saving') : t('save_entry')}
                onPress={() => {
                  setStatusMessage(null);
                  void submitForm();
                }}
                disabled={isSaving}
                style={styles.saveButton}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      <PlacePickerModal
        visible={isPlacePickerVisible}
        initialCoordinates={initialPickerCoordinates}
        initialPlaceSelection={
          hasMapSelection
            ? {
                latitude: Number.parseFloat(latitude) || DEFAULT_COORDINATES.latitude,
                longitude: Number.parseFloat(longitude) || DEFAULT_COORDINATES.longitude,
                cityArea: cityArea || t('not_selected'),
                addressLine: addressLine || undefined,
                suggestedStoreName: selectedPlaceName || undefined
              }
            : undefined
        }
        showPlaceInfoInitially={hasMapSelection}
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
  headerWrap: {
    alignItems: 'center',
    borderBottomColor: colors.divider,
    borderBottomWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  headerActionLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xxs,
    minHeight: 32,
    minWidth: 72
  },
  headerActionRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minHeight: 32,
    minWidth: 72
  },
  headerActionText: {
    color: colors.primary,
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    lineHeight: 24
  },
  headerTitle: {
    color: colors.textPrimary,
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    fontWeight: '700',
    lineHeight: 26
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg
  },
  mainColumn: {
    maxWidth: 448
  },
  pageTitle: {
    color: colors.textPrimary,
    fontFamily: typography.display,
    fontSize: typography.sizes.headingXl,
    letterSpacing: -0.85,
    lineHeight: 43,
    marginBottom: spacing.md
  },
  section: {
    marginBottom: spacing.md
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontFamily: typography.body,
    fontSize: typography.sizes.caption,
    letterSpacing: 0.325,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.md,
    textTransform: 'uppercase'
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.borderSubtle,
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: 'hidden',
    ...shadows.card
  },
  fieldRow: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 48,
    paddingHorizontal: spacing.md
  },
  rowLabel: {
    color: colors.black,
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    lineHeight: 26,
    width: 96
  },
  rowInput: {
    color: colors.textPrimary,
    flex: 1,
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    minHeight: 48,
    paddingHorizontal: spacing.sm
  },
  divider: {
    backgroundColor: colors.divider,
    height: StyleSheet.hairlineWidth,
    marginLeft: spacing.md
  },
  fieldError: {
    color: colors.warning,
    fontFamily: typography.body,
    fontSize: typography.sizes.caption,
    lineHeight: 19,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs
  },
  fieldErrorPadded: {
    color: colors.warning,
    fontFamily: typography.body,
    fontSize: typography.sizes.caption,
    lineHeight: 19,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  suggestionChip: {
    backgroundColor: 'rgba(0,122,255,0.1)',
    borderRadius: 999,
    marginBottom: spacing.xs,
    marginRight: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6
  },
  suggestionChipText: {
    color: colors.primary,
    fontFamily: typography.body,
    fontSize: typography.sizes.body,
    lineHeight: 22
  },
  priceInputWrap: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  priceInput: {
    color: colors.primary,
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    minHeight: 40,
    paddingHorizontal: spacing.sm,
    textAlign: 'right',
    width: 120
  },
  currencyLabel: {
    color: colors.textTertiary,
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    lineHeight: 26,
    marginLeft: spacing.xs
  },
  dateRow: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs
  },
  dateInputWrap: {
    flex: 1,
    marginBottom: -spacing.sm
  },
  storeInputWrap: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row'
  },
  mapEntryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 32,
    minWidth: 32
  },
  locationSummaryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 70,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  locationBadge: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.dividerSoft,
    borderRadius: 8,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    marginRight: spacing.sm,
    width: 40
  },
  locationTextWrap: {
    flex: 1
  },
  locationPrimaryText: {
    color: colors.textPrimary,
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    fontWeight: '700',
    lineHeight: 24
  },
  locationSecondaryText: {
    color: colors.textSecondary,
    fontFamily: typography.body,
    fontSize: typography.sizes.body,
    lineHeight: 22,
    marginTop: 1
  },
  locationActionText: {
    color: colors.primary,
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    lineHeight: 24,
    marginLeft: spacing.sm
  },
  locationRequiredHint: {
    color: colors.warning,
    fontFamily: typography.body,
    fontSize: typography.sizes.caption,
    lineHeight: 19,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md
  },
  shareHint: {
    color: colors.textSecondary,
    fontFamily: typography.body,
    fontSize: typography.sizes.caption,
    lineHeight: 19,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    textAlign: 'center'
  },
  notesCard: {
    backgroundColor: colors.surface,
    borderColor: colors.borderSubtle,
    borderRadius: radius.md,
    borderWidth: 1,
    minHeight: 120,
    overflow: 'hidden',
    ...shadows.card
  },
  notesInput: {
    color: colors.textPrimary,
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    lineHeight: 28,
    minHeight: 120,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm
  },
  notesCounter: {
    color: colors.textSecondary,
    fontFamily: typography.body,
    fontSize: typography.sizes.caption,
    lineHeight: 20,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    textAlign: 'right'
  },
  statusMessage: {
    color: colors.textSecondary,
    fontFamily: typography.body,
    fontSize: typography.sizes.caption,
    lineHeight: 19,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    textAlign: 'center'
  },
  bottomBar: {
    backgroundColor: colors.surfaceOverlay,
    borderTopColor: colors.divider,
    borderTopWidth: 1,
    bottom: 0,
    left: 0,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    position: 'absolute',
    right: 0
  },
  bottomBarInner: {
    alignSelf: 'center',
    maxWidth: 448
  },
  saveButton: {
    borderRadius: radius.lg,
    width: '100%'
  },
  pressed: {
    opacity: 0.85
  }
});
