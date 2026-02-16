import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';
import { ObservedDateInput } from '../src/components/ObservedDateInput';
import { PlacePickerModal } from '../src/components/PlacePickerModal';
import { createPriceEntry } from '../src/db/repositories/priceEntriesRepo';
import { getOrCreateProduct, listProductOptions } from '../src/db/repositories/productsRepo';
import { getOrCreateStore } from '../src/db/repositories/storesRepo';
import { useI18n } from '../src/i18n/useI18n';
import { colors, gradients, radius, spacing, typography } from '../src/theme/tokens';
import { Coordinates, PlaceSelection } from '../src/types/domain';
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

const nowDate = (): Date => new Date();

const toDateOnlyIso = (date: Date): string => {
  const localDateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return localDateOnly.toISOString();
};

export default function CaptureScreen() {
  const { language, t } = useI18n();
  const [productName, setProductName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [cityArea, setCityArea] = useState('');
  const [priceYen, setPriceYen] = useState('');
  const [latitude, setLatitude] = useState('35.6812');
  const [longitude, setLongitude] = useState('139.7671');
  const [addressLine, setAddressLine] = useState('');
  const [observedAtDate, setObservedAtDate] = useState<Date>(nowDate());
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPlacePickerVisible, setIsPlacePickerVisible] = useState(false);
  const [hasMapSelection, setHasMapSelection] = useState(false);
  const [selectedPlaceName, setSelectedPlaceName] = useState<string>('');
  const [productSuggestions, setProductSuggestions] = useState<string[]>([]);
  const [storeNameTouched, setStoreNameTouched] = useState(false);
  const [lastAutoFilledStoreName, setLastAutoFilledStoreName] = useState<string | null>(null);

  const locale = language === 'ko' ? 'ko-KR' : 'en-US';

  const observedPreview = useMemo(() => {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(observedAtDate);
  }, [locale, observedAtDate]);

  const refreshSuggestions = async (query: string) => {
    const options = await listProductOptions(query);
    setProductSuggestions(options.map((option) => option.name).slice(0, 6));
  };

  const getCurrentCoordinates = (): Coordinates => ({
    latitude: Number.parseFloat(latitude) || 35.6812,
    longitude: Number.parseFloat(longitude) || 139.7671
  });

  const handleApplyPlaceSelection = (selection: PlaceSelection) => {
    setHasMapSelection(true);
    setSelectedPlaceName(selection.suggestedStoreName ?? '');
    setLatitude(selection.latitude.toFixed(6));
    setLongitude(selection.longitude.toFixed(6));
    setCityArea(selection.cityArea);

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

      setPriceYen('');
      setProductName('');
      setStoreName('');
      setCityArea('');
      setAddressLine('');
      setLatitude('35.6812');
      setLongitude('139.7671');
      setHasMapSelection(false);
      setSelectedPlaceName('');
      setStoreNameTouched(false);
      setLastAutoFilledStoreName(null);
      setObservedAtDate(nowDate());
      setStatusMessage(t('saved_status'));
      await refreshSuggestions('');
      Alert.alert(t('saved_title'), t('saved_message'));
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : t('save_error'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <LinearGradient colors={gradients.screen} style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.screen}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.screen}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.hero}>
              <Text style={styles.title}>{t('capture_title')}</Text>
              <Text style={styles.subtitle}>{t('capture_subtitle')}</Text>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.label}>{t('merchandise')}</Text>
              <TextInput
                placeholder="Example: Matcha KitKat"
                placeholderTextColor={colors.slate500}
                style={styles.input}
                value={productName}
                onChangeText={(value) => {
                  setProductName(value);
                  void refreshSuggestions(value);
                }}
              />
              {productSuggestions.length > 0 && productName.length > 0 ? (
                <View style={styles.suggestionWrap}>
                  {productSuggestions.map((item) => (
                    <Pressable key={item} onPress={() => setProductName(item)} style={styles.suggestionChip}>
                      <Text style={styles.suggestionText}>{item}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}

              <Text style={styles.label}>{t('price_jpy')}</Text>
              <TextInput
                keyboardType="numeric"
                placeholder="980"
                placeholderTextColor={colors.slate500}
                style={styles.input}
                value={priceYen}
                onChangeText={setPriceYen}
              />

              <Text style={styles.label}>{t('store_name')}</Text>
              <TextInput
                placeholder="Don Quijote Shibuya"
                placeholderTextColor={colors.slate500}
                style={styles.input}
                value={storeName}
                onChangeText={(value) => {
                  setStoreName(value);
                  setStoreNameTouched(true);
                }}
              />

              <View style={styles.locationHeader}>
                <Text style={styles.label}>{t('location')}</Text>
                <Pressable onPress={() => setIsPlacePickerVisible(true)} style={styles.locationButton}>
                  <Text style={styles.locationButtonText}>
                    {hasMapSelection ? t('change_on_map') : t('pick_on_map')}
                  </Text>
                </Pressable>
              </View>
              <View style={styles.locationCard}>
                <View style={styles.locationRow}>
                  <Text style={styles.locationKey}>{t('place')}</Text>
                  <Text numberOfLines={1} style={styles.locationValue}>
                    {hasMapSelection ? (selectedPlaceName || t('unnamed_place')) : t('not_selected')}
                  </Text>
                </View>
                <View style={styles.locationRow}>
                  <Text style={styles.locationKey}>{t('city_area')}</Text>
                  <Text numberOfLines={1} style={styles.locationValue}>
                    {hasMapSelection ? cityArea : t('not_selected')}
                  </Text>
                </View>
                {!hasMapSelection ? (
                  <Text style={styles.locationHint}>{t('location_required_hint')}</Text>
                ) : null}
              </View>

              <Text style={styles.label}>{t('observed_at')}</Text>
              <ObservedDateInput
                value={observedAtDate}
                preview={observedPreview}
                labelDone={t('done')}
                onChange={setObservedAtDate}
              />
              <Text style={styles.previewText}>{t('preview')}: {observedPreview}</Text>

              <Pressable
                disabled={isSaving}
                onPress={handleSave}
                style={({ pressed }) => [styles.saveButton, pressed && styles.saveButtonPressed, isSaving && styles.saveDisabled]}
              >
                <Text style={styles.saveButtonText}>{isSaving ? t('saving') : t('save_entry')}</Text>
              </Pressable>

              {statusMessage ? <Text style={styles.status}>{statusMessage}</Text> : null}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <PlacePickerModal
        visible={isPlacePickerVisible}
        initialCoordinates={getCurrentCoordinates()}
        onClose={() => setIsPlacePickerVisible(false)}
        onConfirm={handleApplyPlaceSelection}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: 110
  },
  hero: {
    marginBottom: spacing.lg
  },
  title: {
    fontFamily: typography.display,
    color: colors.ink900,
    fontSize: 30,
    marginBottom: spacing.xs
  },
  subtitle: {
    fontFamily: typography.body,
    color: colors.ink700,
    fontSize: 14,
    lineHeight: 20
  },
  formCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.sky200,
    padding: spacing.lg
  },
  label: {
    fontFamily: typography.body,
    color: colors.ink700,
    fontSize: 13,
    marginBottom: spacing.xs
  },
  input: {
    borderWidth: 1,
    borderColor: colors.slate300,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: typography.body,
    color: colors.ink900,
    marginBottom: spacing.md,
    backgroundColor: colors.slate100
  },
  suggestionWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: -spacing.sm,
    marginBottom: spacing.md
  },
  suggestionChip: {
    backgroundColor: colors.sky100,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    marginRight: spacing.xs,
    marginBottom: spacing.xs
  },
  suggestionText: {
    color: colors.ink700,
    fontFamily: typography.body,
    fontSize: 12
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs
  },
  locationCard: {
    borderWidth: 1,
    borderColor: colors.sky200,
    borderRadius: radius.md,
    backgroundColor: colors.slate100,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md
  },
  locationRow: {
    marginBottom: spacing.xs
  },
  locationKey: {
    color: colors.slate500,
    fontFamily: typography.body,
    fontSize: 11,
    marginBottom: 2
  },
  locationValue: {
    color: colors.ink900,
    fontFamily: typography.body,
    fontSize: 15
  },
  locationHint: {
    color: colors.sea500,
    fontFamily: typography.body,
    fontSize: 12,
    marginTop: spacing.xs
  },
  locationButton: {
    borderRadius: radius.sm,
    backgroundColor: colors.ink900,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    marginBottom: spacing.xs
  },
  locationButtonText: {
    color: colors.white,
    fontFamily: typography.body,
    fontWeight: '700',
    fontSize: 12
  },
  previewText: {
    color: colors.slate500,
    fontFamily: typography.body,
    fontSize: 12,
    marginBottom: spacing.lg
  },
  saveButton: {
    backgroundColor: colors.coral500,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center'
  },
  saveButtonPressed: {
    transform: [{ scale: 0.98 }]
  },
  saveDisabled: {
    opacity: 0.6
  },
  saveButtonText: {
    color: colors.white,
    fontFamily: typography.display,
    fontSize: 18
  },
  status: {
    marginTop: spacing.sm,
    color: colors.ink700,
    fontFamily: typography.body,
    fontSize: 12
  }
});
