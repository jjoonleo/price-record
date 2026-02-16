import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  ScrollView,
  Text,
  TextInput,
  View
} from 'react-native';
import MapView, { MapPressEvent, Marker, Region } from 'react-native-maps';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlaceSearch } from '../hooks/usePlaceSearch';
import {
  PlaceSuggestion,
  PlacesApiStatus,
  getInitialPlacesApiStatus,
  getPlaceDetails
} from '../services/placesService';
import { captureCurrentLocation, reverseGeocodeToArea } from '../services/locationService';
import { useI18n } from '../i18n/useI18n';
import { colors, radius, spacing, typography } from '../theme/tokens';
import { Coordinates, PlaceSelection } from '../types/domain';

type PlacePickerModalProps = {
  visible: boolean;
  initialCoordinates: Coordinates;
  onClose: () => void;
  onConfirm: (selection: PlaceSelection) => void;
};

const regionFromCoordinates = (coords: Coordinates): Region => ({
  latitude: coords.latitude,
  longitude: coords.longitude,
  latitudeDelta: 0.04,
  longitudeDelta: 0.04
});

const buildFallbackMessage = (status: PlacesApiStatus, t: ReturnType<typeof useI18n>['t']): string | null => {
  if (status.mode !== 'pin-only') {
    return null;
  }

  if (status.reason === 'missing-key') {
    return t('search_missing_key');
  }

  if (status.reason === 'quota-exceeded') {
    return t('search_quota');
  }
  if (status.reason === 'request-denied') {
    return t('search_denied');
  }

  return t('search_unavailable');
};

export const PlacePickerModal = ({
  visible,
  initialCoordinates,
  onClose,
  onConfirm
}: PlacePickerModalProps) => {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const [apiStatus, setApiStatus] = useState<PlacesApiStatus>({ mode: 'pin-only', reason: 'missing-key' });
  const [searchQuery, setSearchQuery] = useState('');
  const [coordinates, setCoordinates] = useState<Coordinates>(initialCoordinates);
  const [cityArea, setCityArea] = useState(t('not_selected'));
  const [addressLine, setAddressLine] = useState<string | undefined>();
  const [suggestedStoreName, setSuggestedStoreName] = useState<string | undefined>();
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [isInitializingLocation, setIsInitializingLocation] = useState(false);
  const [mapRegion, setMapRegion] = useState<Region>(regionFromCoordinates(initialCoordinates));
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<string | null>(null);

  const resolveAddress = useCallback(async (nextCoordinates: Coordinates) => {
    setIsResolvingAddress(true);

    try {
      const reverse = await reverseGeocodeToArea(nextCoordinates);
      setCityArea(reverse.cityArea);
      setAddressLine(reverse.addressLine);
    } catch {
      setCityArea(t('not_selected'));
    } finally {
      setIsResolvingAddress(false);
    }
  }, [t]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const initStatus = getInitialPlacesApiStatus();
    console.warn('[PlacePicker] initial API status', initStatus);
    setApiStatus(initStatus);
    setSearchQuery('');
    setCoordinates(initialCoordinates);
    setMapRegion(regionFromCoordinates(initialCoordinates));
    setSelectedSuggestionId(null);
    setIsInitializingLocation(true);

    void (async () => {
      const locationResult = await captureCurrentLocation();
      if (locationResult.status === 'granted') {
        const currentCoordinates = locationResult.coordinates;
        setCoordinates(currentCoordinates);
        setMapRegion(regionFromCoordinates(currentCoordinates));
        setCityArea(locationResult.cityArea);
        setAddressLine(locationResult.addressLine);
      } else {
        await resolveAddress(initialCoordinates);
      }
      setIsInitializingLocation(false);
    })();
  }, [initialCoordinates, resolveAddress, visible]);

  const onSearchFailure = useCallback((reason: 'request-failed' | 'quota-exceeded' | 'request-denied') => {
    if (reason === 'request-failed') {
      return;
    }
    console.warn('[PlacePicker] switching to pin-only mode', { reason });
    setApiStatus({ mode: 'pin-only', reason });
  }, []);

  const {
    suggestions,
    isLoading: isSearchLoading,
    errorMessage
  } = usePlaceSearch(searchQuery, apiStatus, onSearchFailure);

  const fallbackMessage = useMemo(() => buildFallbackMessage(apiStatus, t), [apiStatus, t]);

  const handleSuggestionSelect = async (suggestion: PlaceSuggestion) => {
    try {
      setSelectedSuggestionId(suggestion.placeId);
      const details = await getPlaceDetails(suggestion.placeId);
      const nextCoordinates = {
        latitude: details.latitude,
        longitude: details.longitude
      };

      setCoordinates(nextCoordinates);
      setMapRegion(regionFromCoordinates(nextCoordinates));
      setSuggestedStoreName(details.name || suggestion.primaryText);

      const reverse = await reverseGeocodeToArea(nextCoordinates);
      setCityArea(reverse.cityArea);
      setAddressLine(details.address || reverse.addressLine);
      setSearchQuery(suggestion.primaryText);
    } catch {
      console.warn('[PlacePicker] failed to resolve place details', {
        placeId: suggestion.placeId,
        label: suggestion.primaryText
      });
      setSuggestedStoreName(suggestion.primaryText);
    } finally {
      setSelectedSuggestionId(null);
    }
  };

  const updateFromMapCoordinate = async (nextCoordinates: Coordinates) => {
    setCoordinates(nextCoordinates);
    await resolveAddress(nextCoordinates);
  };

  const handleMapPress = (event: MapPressEvent) => {
    const nextCoordinates = event.nativeEvent.coordinate;
    void updateFromMapCoordinate(nextCoordinates);
  };

  const handleConfirm = () => {
    onConfirm({
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      cityArea,
      addressLine,
      suggestedStoreName
    });
    onClose();
  };

  return (
    <Modal animationType="slide" presentationStyle="fullScreen" visible={visible}>
      <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.screen}>
        <View style={[styles.header, { paddingTop: Math.max(insets.top, spacing.md) }]}>
          <Pressable onPress={onClose} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>{t('cancel')}</Text>
          </Pressable>
          <Text style={styles.headerTitle}>{t('pick_place')}</Text>
          <Pressable onPress={handleConfirm} style={styles.confirmButton}>
            <Text style={styles.confirmButtonText}>{t('confirm')}</Text>
          </Pressable>
        </View>

        <View style={styles.searchWrap}>
          <TextInput
            editable={apiStatus.mode === 'search-enabled'}
            onChangeText={setSearchQuery}
            placeholder={
              apiStatus.mode === 'search-enabled'
                ? t('search_placeholder')
                : t('search_disabled_placeholder')
            }
            placeholderTextColor={colors.slate500}
            style={[styles.searchInput, apiStatus.mode !== 'search-enabled' && styles.searchDisabled]}
            value={searchQuery}
          />
          <Text style={styles.helperText}>
            {fallbackMessage ?? t('search_hint')}
          </Text>
          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        </View>

        {apiStatus.mode === 'search-enabled' && (isSearchLoading || suggestions.length > 0) ? (
          <View style={styles.suggestionPanel}>
            {isSearchLoading ? (
              <View style={styles.loaderRow}>
                <ActivityIndicator color={colors.sea500} size="small" />
                <Text style={styles.loaderText}>{t('searching_places')}</Text>
              </View>
            ) : (
              <ScrollView keyboardShouldPersistTaps="handled">
                {suggestions.map((suggestion) => (
                  <Pressable
                    key={suggestion.placeId}
                    onPress={() => void handleSuggestionSelect(suggestion)}
                    style={styles.suggestionItem}
                  >
                    <Text style={styles.suggestionPrimary}>{suggestion.primaryText}</Text>
                    {suggestion.secondaryText ? (
                      <Text style={styles.suggestionSecondary}>{suggestion.secondaryText}</Text>
                    ) : null}
                    {selectedSuggestionId === suggestion.placeId ? (
                      <Text style={styles.loaderText}>{t('applying')}</Text>
                    ) : null}
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>
        ) : null}

        {isInitializingLocation ? (
          <View style={styles.mapLoadingWrap}>
            <ActivityIndicator color={colors.sea500} size="large" />
            <Text style={styles.loaderText}>{t('map_centering')}</Text>
          </View>
        ) : (
          <MapView
            onPress={handleMapPress}
            region={mapRegion}
            style={styles.map}
            onRegionChangeComplete={(region: Region) => setMapRegion(region)}
          >
            <Marker
              coordinate={coordinates}
              draggable
              onDragEnd={(event) => {
                void updateFromMapCoordinate(event.nativeEvent.coordinate);
              }}
            />
          </MapView>
        )}

        <View style={styles.selectionCard}>
          <Text style={styles.selectionTitle}>{suggestedStoreName || t('selected_place')}</Text>
          <Text style={styles.selectionText}>{cityArea}</Text>
          <Text style={styles.selectionText}>{addressLine || t('no_address')}</Text>
          <Text style={styles.selectionText}>
            {coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}
          </Text>
          {isResolvingAddress ? <Text style={styles.loaderText}>{t('resolving_address')}</Text> : null}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.white
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.sky200
  },
  headerTitle: {
    color: colors.ink900,
    fontFamily: typography.display,
    fontSize: 20
  },
  headerButton: {
    minWidth: 70
  },
  headerButtonText: {
    color: colors.ink700,
    fontFamily: typography.body,
    fontWeight: '700'
  },
  confirmButton: {
    minWidth: 70,
    alignItems: 'flex-end'
  },
  confirmButtonText: {
    color: colors.sea500,
    fontFamily: typography.body,
    fontWeight: '700'
  },
  searchWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm
  },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.slate300,
    borderRadius: radius.md,
    backgroundColor: colors.slate100,
    color: colors.ink900,
    fontFamily: typography.body,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  searchDisabled: {
    opacity: 0.6
  },
  helperText: {
    marginTop: spacing.xs,
    color: colors.ink700,
    fontFamily: typography.body,
    fontSize: 12
  },
  errorText: {
    marginTop: spacing.xs,
    color: colors.coral500,
    fontFamily: typography.body,
    fontSize: 12
  },
  suggestionPanel: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.sky200,
    borderRadius: radius.md,
    maxHeight: 180,
    backgroundColor: colors.white
  },
  suggestionItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.sky100
  },
  suggestionPrimary: {
    color: colors.ink900,
    fontFamily: typography.body,
    fontWeight: '700',
    fontSize: 13
  },
  suggestionSecondary: {
    marginTop: 2,
    color: colors.ink700,
    fontFamily: typography.body,
    fontSize: 12
  },
  map: {
    flex: 1
  },
  mapLoadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    rowGap: spacing.sm
  },
  selectionCard: {
    borderTopWidth: 1,
    borderTopColor: colors.sky200,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    rowGap: 3
  },
  selectionTitle: {
    color: colors.ink900,
    fontFamily: typography.display,
    fontSize: 18
  },
  selectionText: {
    color: colors.ink700,
    fontFamily: typography.body,
    fontSize: 12
  },
  loaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
    padding: spacing.md
  },
  loaderText: {
    color: colors.slate500,
    fontFamily: typography.body,
    fontSize: 12
  }
});
