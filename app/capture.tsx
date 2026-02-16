import { MaterialCommunityIcons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
import {
  findStoreByIdentity,
  getOrCreateStore,
  listRecentStores
} from '../src/db/repositories/storesRepo';
import { captureCurrentLocation } from '../src/services/locationService';
import { colors, radius, shadows, spacing, typography } from '../src/theme/tokens';
import { Coordinates, PlaceSelection, Store } from '../src/types/domain';
import { getDisplayStoreName } from '../src/utils/formatters';

const DEFAULT_COORDINATES: Coordinates = {
  latitude: DEFAULT_CAPTURE_COORDINATES.latitude,
  longitude: DEFAULT_CAPTURE_COORDINATES.longitude
};

const toDateOnlyIso = (date: Date): string => {
  const localDateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return localDateOnly.toISOString();
};

const resolveSystemStoreName = (selection: PlaceSelection, fallbackLabel: string): string => {
  const suggested = selection.suggestedStoreName?.trim();
  if (suggested) {
    return suggested;
  }

  const firstAddressSegment = selection.addressLine.split(',')[0]?.trim();
  if (firstAddressSegment) {
    return firstAddressSegment;
  }

  return fallbackLabel;
};

const isSectionLocked = (hasSelectedStore: boolean): boolean => !hasSelectedStore;

export default function CaptureScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { language, t } = useI18n();

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPlacePickerVisible, setIsPlacePickerVisible] = useState(false);
  const [selectedPlaceName, setSelectedPlaceName] = useState('');
  const [productSuggestions, setProductSuggestions] = useState<string[]>([]);
  const [recentStores, setRecentStores] = useState<Store[]>([]);
  const [recentStoreQuery, setRecentStoreQuery] = useState('');
  const [isRecentStoresLoading, setIsRecentStoresLoading] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [selectedStoreNicknameBeforeEdit, setSelectedStoreNicknameBeforeEdit] = useState('');
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
        systemStoreRequired: t('validation_system_store_required'),
        cityAreaRequired: t('validation_city_area_required'),
        dateRequired: t('validation_date_required'),
        locationRequired: t('validation_location_required'),
        addressRequired: t('validation_address_required'),
        coordinatesInvalid: t('validation_coordinates_invalid'),
        notesTooLong: t('input_error')
      }),
    [t]
  );

  const {
    control,
    formState: { errors },
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

  const systemStoreName = watch('systemStoreName');
  const cityArea = watch('cityArea');
  const latitude = watch('latitude');
  const longitude = watch('longitude');
  const addressLine = watch('addressLine');
  const notes = watch('notes');
  const observedAtDate = watch('observedAt');
  const hasMapSelection = watch('hasMapSelection');

  const hasSelectedStore = hasMapSelection && systemStoreName.trim().length > 0;

  const observedPreview = useMemo(() => {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(observedAtDate);
  }, [locale, observedAtDate]);

  const refreshRecentStores = useCallback(async (query: string) => {
    setIsRecentStoresLoading(true);
    try {
      const rows = await listRecentStores(8, query.trim() || undefined);
      setRecentStores(rows);
    } finally {
      setIsRecentStoresLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshRecentStores(recentStoreQuery);
  }, [recentStoreQuery, refreshRecentStores]);

  const refreshSuggestions = async (query: string) => {
    if (!hasSelectedStore || query.trim().length === 0) {
      setProductSuggestions([]);
      return;
    }

    const options = await listProductOptions(query);
    setProductSuggestions(options.map((option) => option.name).slice(0, 6));
  };

  const applyResolvedStoreSelection = (
    store: {
      id: string | null;
      name: string;
      nickname?: string;
      cityArea: string;
      latitude: number;
      longitude: number;
      addressLine: string;
    },
    nextStatus = t('map_selected_status')
  ) => {
    setSelectedStoreId(store.id);
    setSelectedStoreNicknameBeforeEdit(store.nickname?.trim() ?? '');
    setSelectedPlaceName(store.name);
    setInitialPickerCoordinates({ latitude: store.latitude, longitude: store.longitude });

    setValue('hasMapSelection', true, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true
    });
    setValue('latitude', store.latitude.toFixed(6), {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true
    });
    setValue('longitude', store.longitude.toFixed(6), {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true
    });
    setValue('cityArea', store.cityArea, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true
    });
    setValue('addressLine', store.addressLine, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true
    });
    setValue('systemStoreName', store.name, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true
    });
    setValue('storeNickname', store.nickname ?? '', {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true
    });

    setStatusMessage(nextStatus);
  };

  const resetDraft = (nextStatus: string | null = null) => {
    reset(getCaptureFormDefaults());
    setSelectedPlaceName('');
    setProductSuggestions([]);
    setSelectedStoreId(null);
    setSelectedStoreNicknameBeforeEdit('');
    setInitialPickerCoordinates(DEFAULT_COORDINATES);
    setRecentStoreQuery('');
    void refreshRecentStores('');
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

  const handleSelectRecentStore = (store: Store) => {
    applyResolvedStoreSelection({
      id: store.id,
      name: store.name,
      nickname: store.nickname,
      cityArea: store.cityArea,
      latitude: store.latitude,
      longitude: store.longitude,
      addressLine: store.addressLine
    });
  };

  const handleApplyPlaceSelection = (selection: PlaceSelection) => {
    void (async () => {
      const resolvedSystemStoreName = resolveSystemStoreName(selection, t('unnamed_place'));
      const matchedStore = await findStoreByIdentity({
        name: resolvedSystemStoreName,
        cityArea: selection.cityArea,
        coordinates: {
          latitude: selection.latitude,
          longitude: selection.longitude
        }
      });

      applyResolvedStoreSelection({
        id: matchedStore?.id ?? null,
        name: matchedStore?.name ?? resolvedSystemStoreName,
        nickname: matchedStore?.nickname,
        cityArea: selection.cityArea,
        latitude: selection.latitude,
        longitude: selection.longitude,
        addressLine: selection.addressLine
      });
      setIsPlacePickerVisible(false);
    })();
  };

  const confirmNicknameClear = (): Promise<boolean> => {
    return new Promise((resolve) => {
      let finished = false;
      const settle = (value: boolean) => {
        if (finished) {
          return;
        }
        finished = true;
        resolve(value);
      };

      Alert.alert(
        t('clear_nickname_title'),
        t('clear_nickname_body'),
        [
          {
            text: t('cancel'),
            style: 'cancel',
            onPress: () => settle(false)
          },
          {
            text: t('clear_nickname_confirm'),
            style: 'destructive',
            onPress: () => settle(true)
          }
        ],
        {
          cancelable: true,
          onDismiss: () => settle(false)
        }
      );
    });
  };

  const onValidSubmit: SubmitHandler<CaptureFormValues> = async (values) => {
    setStatusMessage(null);

    const shouldConfirmNicknameClear =
      Boolean(selectedStoreId) && selectedStoreNicknameBeforeEdit.length > 0 && values.storeNickname.trim().length === 0;

    if (shouldConfirmNicknameClear) {
      const confirmed = await confirmNicknameClear();
      if (!confirmed) {
        return;
      }
    }

    setIsSaving(true);

    try {
      const observedAt = toDateOnlyIso(values.observedAt);
      const product = await getOrCreateProduct(values.productName);
      const store = await getOrCreateStore({
        name: values.systemStoreName,
        nickname: values.storeNickname,
        cityArea: values.cityArea,
        coordinates: {
          latitude: Number(values.latitude),
          longitude: Number(values.longitude)
        },
        addressLine: values.addressLine
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

  const locationPrimary = hasSelectedStore ? systemStoreName : t('not_selected');
  const locationSecondary = hasSelectedStore ? addressLine || cityArea || t('not_selected') : t('not_selected');
  const locationErrorMessage =
    errors.hasMapSelection?.message ||
    errors.systemStoreName?.message ||
    errors.addressLine?.message ||
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
                <Text style={styles.sectionLabel}>{t('location')}</Text>
                <View style={styles.card}>
                  <View style={styles.fieldRow}>
                    <Text style={styles.rowLabel}>{t('recent_stores')}</Text>
                    <TextInput
                      placeholder={t('saved_store_search_placeholder')}
                      placeholderTextColor={colors.textTertiary}
                      style={styles.rowInput}
                      value={recentStoreQuery}
                      onChangeText={setRecentStoreQuery}
                    />
                  </View>

                  {isRecentStoresLoading ? <Text style={styles.fieldHint}>{t('loading_recent_stores')}</Text> : null}

                  {recentStores.length > 0 ? (
                    <View style={styles.chipsRow}>
                      {recentStores.map((store) => {
                        const displayName = getDisplayStoreName(store);
                        const isActive = store.id === selectedStoreId;

                        return (
                          <Pressable
                            key={store.id}
                            onPress={() => handleSelectRecentStore(store)}
                            style={[styles.recentStoreChip, isActive && styles.recentStoreChipActive]}
                          >
                            <Text style={[styles.recentStoreChipText, isActive && styles.recentStoreChipTextActive]}>
                              {displayName}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : (
                    <Text style={styles.fieldHint}>{t('no_recent_stores')}</Text>
                  )}

                  <View style={styles.divider} />

                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      void openPlacePicker();
                    }}
                    style={({ pressed }) => [styles.addPlaceRow, pressed && styles.pressed]}
                  >
                    <View style={styles.locationBadge}>
                      <MaterialCommunityIcons color={colors.primary} name="map-marker-plus-outline" size={16} />
                    </View>
                    <Text style={styles.addPlaceText}>{t('add_new_place')}</Text>
                  </Pressable>

                  {hasSelectedStore ? (
                    <>
                      <View style={styles.divider} />

                      <View style={styles.fieldRow}>
                        <Text style={styles.rowLabel}>{t('system_store_name')}</Text>
                        <Text numberOfLines={1} style={styles.readOnlyValue}>
                          {systemStoreName}
                        </Text>
                      </View>

                      <View style={styles.divider} />

                      <View style={styles.fieldRow}>
                        <Text style={styles.rowLabel}>{t('store_nickname_optional')}</Text>
                        <Controller
                          control={control}
                          name="storeNickname"
                          render={({ field: { onBlur, onChange, value } }) => (
                            <TextInput
                              placeholder={t('store_nickname_placeholder')}
                              placeholderTextColor={colors.textTertiary}
                              style={styles.rowInput}
                              value={value}
                              onBlur={onBlur}
                              onChangeText={onChange}
                            />
                          )}
                        />
                      </View>

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
                        <Text style={styles.locationActionText}>{t('change')}</Text>
                      </Pressable>
                    </>
                  ) : null}
                </View>

                {!hasSelectedStore ? <Text style={styles.locationRequiredHint}>{t('location_required_hint')}</Text> : null}
                {locationErrorMessage ? <Text style={styles.fieldErrorPadded}>{locationErrorMessage}</Text> : null}
                <Text style={styles.shareHint}>{t('capture_share_hint')}</Text>
              </View>

              <View style={[styles.section, isSectionLocked(hasSelectedStore) && styles.sectionLocked]}>
                <Text style={styles.sectionLabel}>{t('merchandise')}</Text>
                <View style={styles.card}>
                  <View style={styles.fieldRow}>
                    <Text style={styles.rowLabel}>{t('name')}</Text>
                    <Controller
                      control={control}
                      name="productName"
                      render={({ field: { onBlur, onChange, value } }) => (
                        <TextInput
                          editable={hasSelectedStore}
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

                  {hasSelectedStore && productSuggestions.length > 0 ? (
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

                {!hasSelectedStore ? <Text style={styles.sectionLockHint}>{t('select_store_first_hint')}</Text> : null}
              </View>

              <View style={[styles.section, isSectionLocked(hasSelectedStore) && styles.sectionLocked]}>
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
                            editable={hasSelectedStore}
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
                      {hasSelectedStore ? (
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
                      ) : (
                        <Text style={styles.sectionLockHint}>{t('select_store_first_hint')}</Text>
                      )}
                    </View>
                  </View>

                  {errors.observedAt?.message ? <Text style={styles.fieldError}>{errors.observedAt.message}</Text> : null}
                </View>
              </View>

              <View style={[styles.section, isSectionLocked(hasSelectedStore) && styles.sectionLocked]}>
                <Text style={styles.sectionLabel}>{t('notes')}</Text>
                <View style={styles.notesCard}>
                  <Controller
                    control={control}
                    name="notes"
                    render={({ field: { onBlur, onChange, value } }) => (
                      <TextInput
                        editable={hasSelectedStore}
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
                {!hasSelectedStore ? <Text style={styles.sectionLockHint}>{t('select_store_first_hint')}</Text> : null}
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
                disabled={isSaving || !hasSelectedStore}
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
                addressLine,
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
  sectionLocked: {
    opacity: 0.7
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
    width: 126
  },
  rowInput: {
    color: colors.textPrimary,
    flex: 1,
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    minHeight: 48,
    paddingHorizontal: spacing.sm
  },
  readOnlyValue: {
    color: colors.textPrimary,
    flex: 1,
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    fontWeight: '700',
    lineHeight: 24,
    paddingHorizontal: spacing.sm
  },
  divider: {
    backgroundColor: colors.divider,
    height: StyleSheet.hairlineWidth,
    marginLeft: spacing.md
  },
  fieldHint: {
    color: colors.textSecondary,
    fontFamily: typography.body,
    fontSize: typography.sizes.caption,
    lineHeight: 19,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs
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
  recentStoreChip: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.borderSubtle,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: spacing.xs,
    marginRight: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6
  },
  recentStoreChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  recentStoreChipText: {
    color: colors.textPrimary,
    fontFamily: typography.body,
    fontSize: typography.sizes.body,
    lineHeight: 22
  },
  recentStoreChipTextActive: {
    color: colors.white,
    fontWeight: '700'
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
  addPlaceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 52,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  addPlaceText: {
    color: colors.primary,
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    fontWeight: '700',
    lineHeight: 24,
    marginLeft: spacing.sm
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
  sectionLockHint: {
    color: colors.textSecondary,
    fontFamily: typography.body,
    fontSize: typography.sizes.caption,
    lineHeight: 19,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md
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
