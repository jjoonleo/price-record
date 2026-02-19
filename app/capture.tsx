import { MaterialCommunityIcons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
  CaptureFormValues,
  DEFAULT_CAPTURE_COORDINATES,
  createCaptureFormSchema,
  getCaptureFormDefaults
} from '../src/features/capture/formValidation';
import { useI18n } from '../src/i18n/useI18n';
import {
  createPriceEntry,
  getPriceEntryById,
  PriceEntry,
  updatePriceEntry
} from '../src/db/repositories/priceEntriesRepo';
import { getProductById, listProductOptions, Product as ProductEntity } from '../src/db/repositories/productsRepo';
import {
  findStoreByIdentity,
  getOrCreateStore,
  getStoreById,
  listRecentStores
} from '../src/db/repositories/storesRepo';
import { captureCurrentLocation } from '../src/services/locationService';
import { ProductOption } from '../src/types/domain';
import { Coordinates, PlaceSelection, Store } from '../src/types/domain';
import { colors, radius, shadows, spacing, typography } from '../src/theme/tokens';

const DEFAULT_COORDINATES: Coordinates = {
  latitude: DEFAULT_CAPTURE_COORDINATES.latitude,
  longitude: DEFAULT_CAPTURE_COORDINATES.longitude
};

type CaptureMode = 'create' | 'edit';
type CaptureStep = 1 | 2;

type QueryParams = {
  mode?: string;
  entryId?: string;
  selectedProductId?: string;
  returnRoute?: string;
  returnMode?: 'edit' | 'create';
  returnEntryId?: string;
};

const toParamValue = (value: string | string[] | undefined): string | null => {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  if (typeof value === 'string') {
    return value;
  }

  return null;
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

  const firstAddressSegment = selection.addressLine?.split(',')[0]?.trim();
  if (firstAddressSegment) {
    return firstAddressSegment;
  }

  return fallbackLabel;
};

export default function CaptureScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { language, t } = useI18n();
  const params = useLocalSearchParams<QueryParams>();
  const locale = language === 'ko' ? 'ko-KR' : 'en-US';

  const frameWidth = Math.min(Math.max(width - spacing.md * 2, 0), 448);
  const bottomBarInset = Math.max(insets.bottom, spacing.md);

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPlacePickerVisible, setIsPlacePickerVisible] = useState(false);
  const [selectedPlaceName, setSelectedPlaceName] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [selectedStoreNicknameBeforeEdit, setSelectedStoreNicknameBeforeEdit] = useState('');
  const [initialPickerCoordinates, setInitialPickerCoordinates] = useState(DEFAULT_COORDINATES);
  const [recentStores, setRecentStores] = useState<Store[]>([]);
  const [recentStoreQuery, setRecentStoreQuery] = useState('');
  const [isRecentStoresLoading, setIsRecentStoresLoading] = useState(false);
  const [activeStep, setActiveStep] = useState<CaptureStep>(1);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
  const [isProductLoading, setIsProductLoading] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductEntity | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<PriceEntry | null>(null);

  const mode = toParamValue(params.mode);
  const entryId = toParamValue(params.entryId);
  const requestedProductId = toParamValue(params.selectedProductId);
  const returnRoute = toParamValue(params.returnRoute);
  const returnMode = toParamValue(params.returnMode);
  const returnEntryId = toParamValue(params.returnEntryId);
  const isEditMode = mode === 'edit' && Boolean(entryId);

  const schema = useMemo(
    () =>
      createCaptureFormSchema({
        priceRequired: t('validation_price_required'),
        priceInvalidInteger: t('validation_price_invalid_integer'),
        pricePositive: t('validation_price_positive'),
        systemStoreRequired: t('validation_system_store_required'),
        cityAreaRequired: t('validation_city_area_required'),
        dateRequired: t('validation_date_required'),
        locationRequired: t('validation_location_required'),
        addressRequired: t('validation_address_required'),
        coordinatesInvalid: t('validation_coordinates_invalid')
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

  const locationErrorMessage =
    errors.hasMapSelection?.message ||
    errors.systemStoreName?.message ||
    errors.addressLine?.message ||
    errors.cityArea?.message ||
    errors.latitude?.message ||
    errors.longitude?.message;

  const canProceedToStep2 = Boolean(selectedProductId);

  const hydrateStoreFromSelection = useCallback(
    (store: {
      id: string | null;
      name: string;
      nickname?: string;
      cityArea: string;
      latitude: number;
      longitude: number;
      addressLine: string;
    },
    nextStatus = t('map_selected_status')) => {
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
    },
    [setValue, t]
  );

  const resetFormDraft = useCallback(() => {
    reset(getCaptureFormDefaults());
    setSelectedProductId(null);
    setSelectedProduct(null);
    setSelectedEntry(null);
    setSelectedStoreId(null);
    setSelectedStoreNicknameBeforeEdit('');
    setSelectedPlaceName('');
    setProductSearchQuery('');
    setProductOptions([]);
    setInitialPickerCoordinates(DEFAULT_COORDINATES);
    setActiveStep(1);
    void listRecentStores(8).then(() => {});
    setRecentStoreQuery('');
    setStatusMessage(t('saved_status'));
  }, [reset, t]);

  const clearMapSelection = useCallback(() => {
    setValue('hasMapSelection', false, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true
    });
  }, [setValue]);

  const refreshRecentStores = useCallback(async (query: string) => {
    setIsRecentStoresLoading(true);
    try {
      const rows = await listRecentStores(8, query.trim() || undefined);
      setRecentStores(rows);
    } finally {
      setIsRecentStoresLoading(false);
    }
  }, []);

  const refreshProductOptions = useCallback(async (query: string) => {
    setIsProductLoading(true);
    try {
      const rows = await listProductOptions(query.trim() || undefined);
      setProductOptions(rows);
    } finally {
      setIsProductLoading(false);
    }
  }, []);

  const loadSelectedProduct = useCallback(async (productId: string | null) => {
    if (!productId) {
      setSelectedProduct(null);
      return;
    }

    const product = await getProductById(productId);
    setSelectedProduct(product);
  }, []);

  const loadEditPayload = useCallback(
    async (entryIdValue: string, replacementProductId?: string | null) => {
    const entry = await getPriceEntryById(entryIdValue);

    if (!entry) {
      setStatusMessage(t('detail_edit_pending'));
      return;
    }

    const productIdToUse = replacementProductId || entry.productId;
    setSelectedEntry(entry);
    setSelectedProductId(productIdToUse);
    await loadSelectedProduct(productIdToUse);
    setActiveStep(2);

    reset({
      ...getCaptureFormDefaults(),
      priceYen: String(entry.priceYen),
      observedAt: new Date(entry.observedAt)
    });

    const store = await getStoreById(entry.storeId);

    if (store) {
      hydrateStoreFromSelection(
        {
          id: store.id,
          name: store.name,
          nickname: store.nickname,
          cityArea: store.cityArea,
          latitude: store.latitude,
          longitude: store.longitude,
          addressLine: store.addressLine
        },
        t('map_selected_status')
      );
      setStatusMessage(null);
    } else {
      clearMapSelection();
      setStatusMessage(t('map_required_status'));
    }
  }, [clearMapSelection, hydrateStoreFromSelection, loadSelectedProduct, reset, t]);

  const hydrateFromQuery = useCallback(async () => {
    setStatusMessage(null);
    setSelectedEntry(null);
    setSelectedStoreId(null);
    setSelectedStoreNicknameBeforeEdit('');
    setSelectedPlaceName('');

    if (isEditMode && entryId) {
      await loadEditPayload(entryId, requestedProductId);
      return;
    }

    reset(getCaptureFormDefaults());
    clearMapSelection();
    setSelectedProductId(requestedProductId ?? null);
    await loadSelectedProduct(requestedProductId ?? null);
    setActiveStep(requestedProductId ? 2 : 1);
  }, [
    clearMapSelection,
    entryId,
    isEditMode,
    loadEditPayload,
    loadSelectedProduct,
    reset,
    requestedProductId
  ]);

  useEffect(() => {
    void hydrateFromQuery();
  }, [hydrateFromQuery]);

  useEffect(() => {
    void refreshRecentStores(recentStoreQuery);
  }, [recentStoreQuery, refreshRecentStores]);

  useEffect(() => {
    void refreshProductOptions(productSearchQuery);
  }, [productSearchQuery, refreshProductOptions]);

  useEffect(() => {
    if (!requestedProductId) {
      return;
    }

    if (isEditMode) {
      return;
    }

    setSelectedProductId(requestedProductId);
    void loadSelectedProduct(requestedProductId);
  }, [isEditMode, loadSelectedProduct, requestedProductId]);

  const handleSelectRecentStore = (store: Store) => {
    hydrateStoreFromSelection({
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

      hydrateStoreFromSelection({
        id: matchedStore?.id ?? null,
        name: matchedStore?.name ?? resolvedSystemStoreName,
        nickname: matchedStore?.nickname,
        cityArea: selection.cityArea,
        latitude: selection.latitude,
        longitude: selection.longitude,
        addressLine: selection.addressLine ?? ''
      });
      setIsPlacePickerVisible(false);
    })();
  };

  const confirmNicknameClear = (): Promise<boolean> => {
    return new Promise((resolve) => {
      let settled = false;
      const finish = (value: boolean) => {
        if (settled) {
          return;
        }
        settled = true;
        resolve(value);
      };

      Alert.alert(
        t('clear_nickname_title'),
        t('clear_nickname_body'),
        [
          {
            text: t('cancel'),
            style: 'cancel',
            onPress: () => finish(false)
          },
          {
            text: t('clear_nickname_confirm'),
            style: 'destructive',
            onPress: () => finish(true)
          }
        ],
        {
          cancelable: true,
          onDismiss: () => finish(false)
        }
      );
    });
  };

  const openPlacePicker = async () => {
    if (hasSelectedStore) {
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
      // keep defaults
    }

    setInitialPickerCoordinates(nextCoordinates);
    setIsPlacePickerVisible(true);
  };

  const openProductForm = (nextMode: CaptureMode, productId?: string | null) => {
    const returnRouteValue = isEditMode ? 'edit' : 'create';
    const payload: Record<string, string> = {
      mode: nextMode,
      returnRoute: '/capture',
      returnMode: returnRouteValue
    };

    if (productId) {
      payload.productId = productId;
    }

    if (selectedEntry?.id) {
      payload.returnEntryId = selectedEntry.id;
    } else if (entryId) {
      payload.returnEntryId = entryId;
    }

    router.push({ pathname: '/product-form', params: payload });
  };

  const openAddProductForm = () => {
    openProductForm('create');
  };

  const openEditProductForm = () => {
    if (!selectedProductId) {
      return;
    }

    openProductForm('edit', selectedProductId);
  };

  const selectProduct = (product: ProductOption) => {
    setSelectedProductId(product.id);
    void loadSelectedProduct(product.id);
    setProductSearchQuery(product.name);
    setActiveStep(2);
    setStatusMessage(null);
  };

  const removeMapLock = () => {
    const shouldClearNickname =
      Boolean(selectedStoreId) && selectedStoreNicknameBeforeEdit.length > 0 && systemStoreName.trim().length > 0;

    if (!shouldClearNickname) {
      clearMapSelection();
      return;
    }

    void (async () => {
      const confirm = await confirmNicknameClear();
      if (confirm) {
        clearMapSelection();
      }
    })();
  };

  const onValidSubmit: SubmitHandler<CaptureFormValues> = async (values) => {
    if (!selectedProductId) {
      setStatusMessage(t('capture_select_product_first'));
      setActiveStep(1);
      return;
    }

    if (!hasSelectedStore) {
      setStatusMessage(t('validation_location_required'));
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    const shouldConfirmNicknameClear =
      Boolean(selectedStoreId) &&
      selectedStoreNicknameBeforeEdit.length > 0 &&
      values.storeNickname.trim().length === 0;

    if (shouldConfirmNicknameClear) {
      const confirmed = await confirmNicknameClear();
      if (!confirmed) {
        setIsSaving(false);
        return;
      }
    }

    try {
      const observedAt = toDateOnlyIso(values.observedAt);
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

      const payload = {
        productId: selectedProductId,
        storeId: store.id,
        priceYen: Number(values.priceYen),
        observedAt
      };

      if (isEditMode && selectedEntry?.id) {
        await updatePriceEntry({
          id: selectedEntry.id,
          ...payload
        });
      } else {
        await createPriceEntry(payload);
      }

      reset(getCaptureFormDefaults());
      setStatusMessage(
        isEditMode && selectedEntry?.id ? t('detail_updated_status') : t('saved_status')
      );
      Alert.alert(
        isEditMode && selectedEntry?.id ? t('detail_updated_title') : t('saved_title'),
        isEditMode && selectedEntry?.id
          ? t('detail_updated_body')
          : t('saved_message')
      );

      setSelectedStoreId(null);
      setSelectedStoreNicknameBeforeEdit('');
      setSelectedPlaceName('');
      setRecentStoreQuery('');
      setActiveStep(1);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : t('save_error'));
    } finally {
      setIsSaving(false);
    }
  };

  const onInvalidSubmit: SubmitErrorHandler<CaptureFormValues> = () => {
    // inline validation handled by field-level messages
  };

  const submitForm = handleSubmit(onValidSubmit, onInvalidSubmit);

  const openPlacePickerAfterProduct = () => {
    if (hasSelectedStore) {
      setIsPlacePickerVisible(true);
      return;
    }

    void openPlacePicker();
  };

  const stepHeader = activeStep === 1 ? t('capture_step_product') : t('capture_step_price_store');

  const selectedProductDisplay = selectedProduct;

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.screen}
      >
        <View style={styles.screen}>
          <View style={styles.headerWrap}>
            <View style={[styles.headerRow, { width: frameWidth }]}> 
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  if (router.canGoBack()) {
                    router.back();
                    return;
                  }
                  router.replace('/');
                }}
                style={({ pressed }) => [styles.headerActionLeft, pressed && styles.pressed]}
              >
                <MaterialCommunityIcons color={colors.primary} name="chevron-left" size={18} />
                <Text style={styles.headerActionText}>{t('back')}</Text>
              </Pressable>

              <Text style={styles.headerTitle}>{t('capture_header_new_price')}</Text>

              <Pressable
                accessibilityRole="button"
                onPress={resetFormDraft}
                style={({ pressed }) => [styles.headerActionRight, pressed && styles.pressed]}
              >
                <Text style={styles.headerActionText}>{t('reset')}</Text>
              </Pressable>
            </View>
            <Text style={styles.stepTitle}>{stepHeader}</Text>
          </View>

          <ScrollView
            contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomBarInset }]}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[styles.mainColumn, { width: frameWidth }]}> 
              {activeStep === 1 ? (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>{t('capture_step_product')}</Text>
                  <View style={styles.card}>
                    <View style={styles.fieldRow}>
                      <Text style={styles.rowLabel}>{t('search_placeholder_short')}</Text>
                      <TextInput
                        placeholder={t('search_placeholder')}
                        placeholderTextColor={colors.textTertiary}
                        style={styles.rowInput}
                        value={productSearchQuery}
                        onChangeText={setProductSearchQuery}
                      />
                    </View>

                    {productSearchQuery || productOptions.length > 0 ? (
                      <>
                        <View style={styles.divider} />
                        {isProductLoading ? (
                          <Text style={styles.fieldHint}>{t('loading_recent_stores')}</Text>
                        ) : null}
                        <View style={styles.chipsRow}>
                          {productOptions.map((option) => {
                            const isActive = option.id === selectedProductId;
                            return (
                              <Pressable
                                key={option.id}
                                onPress={() => {
                                  selectProduct(option);
                                }}
                                style={[styles.recentStoreChip, isActive && styles.recentStoreChipActive]}
                              >
                                <Text
                                  style={[styles.recentStoreChipText, isActive && styles.recentStoreChipTextActive]}
                                >
                                  {option.name}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      </>
                    ) : null}

                    {selectedProductDisplay ? (
                      <>
                        <View style={styles.divider} />
                        <View style={styles.selectedProductCard}>
                          <Text style={styles.rowLabel}>{t('capture_selected_product')}</Text>
                          <Text style={styles.selectedProductName}>{selectedProductDisplay.name}</Text>
                          {selectedProductDisplay.note ? (
                            <Text style={styles.noteRow}>
                              {selectedProductDisplay.note}
                            </Text>
                          ) : null}
                        </View>
                      </>
                    ) : null}

                    <View style={styles.divider} />
                    <View style={styles.stepButtons}>
                      <Pressable
                        accessibilityRole="button"
                        onPress={openAddProductForm}
                        style={({ pressed }) => [styles.flatButton, pressed && styles.pressed]}
                      >
                        <MaterialCommunityIcons color={colors.primary} name="plus-box" size={16} />
                        <Text style={styles.flatButtonText}>{t('capture_add_product')}</Text>
                      </Pressable>

                      <Pressable
                        accessibilityRole="button"
                        disabled={!selectedProductDisplay}
                        onPress={openEditProductForm}
                        style={({ pressed }) => [
                          styles.flatButton,
                          !selectedProductDisplay && styles.disabledButton,
                          pressed && styles.pressed
                        ]}
                      >
                        <MaterialCommunityIcons color={colors.primary} name="pencil" size={16} />
                        <Text style={styles.flatButtonText}>{t('capture_edit_product')}</Text>
                      </Pressable>
                    </View>
                  </View>

                  {selectedProductDisplay ? null : (
                    <Text style={styles.sectionLockHint}>{t('capture_select_product_hint')}</Text>
                  )}
                </View>
              ) : null}

              {activeStep === 2 ? (
                <>
                  <View style={[styles.section, !selectedProductDisplay && styles.sectionLocked]}>
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
                            const displayName = store.nickname ? `${store.name} / ${store.nickname}` : store.name;
                            const isActive = store.id === selectedStoreId;

                            return (
                              <Pressable
                                key={store.id}
                                onPress={() => {
                                  handleSelectRecentStore(store);
                                }}
                                style={[styles.recentStoreChip, isActive && styles.recentStoreChipActive]}
                              >
                                <Text
                                  style={[styles.recentStoreChipText, isActive && styles.recentStoreChipTextActive]}
                                >
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
                        onPress={openPlacePickerAfterProduct}
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
                            onPress={removeMapLock}
                            style={({ pressed }) => [styles.locationSummaryRow, pressed && styles.pressed]}
                          >
                            <View style={styles.locationBadge}>
                              <MaterialCommunityIcons color={colors.primary} name="map-marker" size={16} />
                            </View>
                            <View style={styles.locationTextWrap}>
                              <Text numberOfLines={1} style={styles.locationPrimaryText}>
                                {systemStoreName}
                              </Text>
                              <Text numberOfLines={1} style={styles.locationSecondaryText}>
                                {addressLine || cityArea}
                              </Text>
                            </View>
                            <Text style={styles.locationActionText}>{t('change')}</Text>
                          </Pressable>
                        </>
                      ) : null}
                    </View>

                    {!hasSelectedStore ? (
                      <Text style={styles.locationRequiredHint}>{t('location_required_hint')}</Text>
                    ) : null}
                    {locationErrorMessage ? <Text style={styles.fieldErrorPadded}>{locationErrorMessage}</Text> : null}
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.sectionLabel}>{t('capture_price_input')}</Text>
                    <View style={styles.card}>
                      <View style={styles.fieldRow}>
                        <Text style={styles.rowLabel}>{t('price')}</Text>
                        <View style={styles.priceInputWrap}>
                          <Controller
                            control={control}
                            name="priceYen"
                            render={({ field: { onBlur, onChange, value } }) => (
                              <TextInput
                                editable={!isRecentStoresLoading}
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
                            <Text style={styles.sectionLockHint}>{t('location_required_hint')}</Text>
                          )}
                        </View>
                      </View>

                      {errors.observedAt?.message ? <Text style={styles.fieldError}>{errors.observedAt.message}</Text> : null}
                    </View>
                  </View>
                </>
              ) : null}

              {statusMessage ? <Text style={styles.statusMessage}>{statusMessage}</Text> : null}
            </View>
          </ScrollView>

          <View style={[styles.bottomBar, { paddingBottom: bottomBarInset }]}>
            <View style={[styles.bottomBarInner, { width: frameWidth }]}> 
              {activeStep === 1 ? (
                <PrimaryButton
                  label={t('capture_next_step')}
                  onPress={() => {
                    if (!canProceedToStep2) {
                      setStatusMessage(t('capture_select_product_hint'));
                      return;
                    }
                    setStatusMessage(null);
                    setActiveStep(2);
                  }}
                  disabled={!canProceedToStep2}
                  style={styles.saveButton}
                />
              ) : (
                <View style={styles.step2Footer}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      setStatusMessage(null);
                      setActiveStep(1);
                    }}
                    style={({ pressed }) => [styles.step2BackButton, pressed && styles.pressed]}
                  >
                    <Text style={styles.step2BackText}>{t('capture_prev_step')}</Text>
                  </Pressable>

                  <PrimaryButton
                    label={isSaving ? t('saving') : t('save_entry')}
                    onPress={() => {
                      setStatusMessage(null);
                      void submitForm();
                    }}
                    disabled={isSaving || !hasSelectedStore || !canProceedToStep2}
                    style={styles.saveButton}
                  />
                </View>
              )}
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      <PlacePickerModal
        visible={isPlacePickerVisible}
        initialCoordinates={initialPickerCoordinates}
        initialPlaceSelection={
          hasSelectedStore
            ? {
                latitude: Number.parseFloat(latitude) || DEFAULT_COORDINATES.latitude,
                longitude: Number.parseFloat(longitude) || DEFAULT_COORDINATES.longitude,
                cityArea: cityArea || t('not_selected'),
                addressLine,
                suggestedStoreName: selectedPlaceName || undefined
              }
            : undefined
        }
        showPlaceInfoInitially={hasSelectedStore}
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
    paddingBottom: 4,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs
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
  stepTitle: {
    color: colors.textSecondary,
    fontFamily: typography.body,
    fontSize: typography.sizes.caption,
    marginTop: spacing.xs,
    textAlign: 'center'
  },
  scrollContent: {
    alignItems: 'center',
    paddingTop: spacing.md
  },
  mainColumn: {
    maxWidth: 448
  },
  section: {
    marginBottom: spacing.md
  },
  sectionLocked: {
    opacity: 0.8
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
  selectedProductCard: {
    padding: spacing.md,
    rowGap: 4
  },
  selectedProductName: {
    color: colors.textPrimary,
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    fontWeight: '700'
  },
  noteRow: {
    color: colors.textSecondary,
    fontFamily: typography.body,
    fontSize: typography.sizes.body
  },
  stepButtons: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md
  },
  flatButton: {
    alignItems: 'center',
    borderColor: colors.borderSubtle,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: spacing.md
  },
  flatButtonText: {
    color: colors.primary,
    fontFamily: typography.body,
    fontSize: typography.sizes.title
  },
  disabledButton: {
    opacity: 0.5
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
  step2Footer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md
  },
  step2BackButton: {
    alignItems: 'center',
    borderColor: colors.borderSubtle,
    borderRadius: radius.xl,
    borderWidth: 1,
    flex: 1,
    minHeight: 54,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg
  },
  step2BackText: {
    color: colors.textPrimary,
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    fontWeight: '700',
    lineHeight: 26
  },
  saveButton: {
    borderRadius: radius.lg,
    width: '100%',
    flex: 2
  },
  pressed: {
    opacity: 0.85
  }
});
