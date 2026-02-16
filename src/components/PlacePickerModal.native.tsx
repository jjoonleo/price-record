import { MaterialCommunityIcons } from '@expo/vector-icons';
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
import { PrimaryButton } from './ui/PrimaryButton';
import { usePlaceSearch } from '../hooks/usePlaceSearch';
import {
  PlaceSuggestion,
  PlacesApiStatus,
  getInitialPlacesApiStatus,
  getPlaceDetails
} from '../services/placesService';
import { captureCurrentLocation, reverseGeocodeToArea } from '../services/locationService';
import { useI18n } from '../i18n/useI18n';
import { colors, radius, shadows, spacing, typography } from '../theme/tokens';
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
  const notSelectedLabel = t('not_selected');
  const insets = useSafeAreaInsets();
  const [apiStatus, setApiStatus] = useState<PlacesApiStatus>({ mode: 'pin-only', reason: 'missing-key' });
  const [searchQuery, setSearchQuery] = useState('');
  const [coordinates, setCoordinates] = useState<Coordinates>(initialCoordinates);
  const [cityArea, setCityArea] = useState(notSelectedLabel);
  const [addressLine, setAddressLine] = useState<string | undefined>();
  const [suggestedStoreName, setSuggestedStoreName] = useState<string | undefined>();
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [isInitializingLocation, setIsInitializingLocation] = useState(false);
  const [mapRegion, setMapRegion] = useState<Region>(regionFromCoordinates(initialCoordinates));
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<string | null>(null);

  const resolveAddress = useCallback(
    async (nextCoordinates: Coordinates) => {
      setIsResolvingAddress(true);

      try {
        const reverse = await reverseGeocodeToArea(nextCoordinates);
        setCityArea(reverse.cityArea);
        setAddressLine(reverse.addressLine);
      } catch {
        setCityArea(notSelectedLabel);
      } finally {
        setIsResolvingAddress(false);
      }
    },
    [notSelectedLabel]
  );

  useEffect(() => {
    if (!visible) {
      return;
    }

    const initStatus = getInitialPlacesApiStatus();
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
    setApiStatus({ mode: 'pin-only', reason });
  }, []);

  const { suggestions, isLoading: isSearchLoading, errorMessage } = usePlaceSearch(searchQuery, apiStatus, onSearchFailure);

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

  const handleConfirmSelection = () => {
    onConfirm({
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      cityArea,
      addressLine,
      suggestedStoreName
    });
    onClose();
  };

  const handleUseCurrentLocation = async () => {
    const result = await captureCurrentLocation();
    if (result.status === 'granted') {
      setCoordinates(result.coordinates);
      setCityArea(result.cityArea);
      setAddressLine(result.addressLine);
      setMapRegion(regionFromCoordinates(result.coordinates));
    }
  };

  return (
    <Modal animationType="slide" presentationStyle="fullScreen" visible={visible}>
      <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.screen}>
        <View style={[styles.header, { paddingTop: Math.max(insets.top, spacing.sm) }]}>
          <Pressable onPress={onClose} style={styles.headerAction}>
            <Text style={styles.headerActionText}>{t('cancel')}</Text>
          </Pressable>
          <Text style={styles.headerTitle}>{t('pick_place')}</Text>
          <Pressable onPress={handleConfirmSelection} style={styles.headerActionRight}>
            <Text style={styles.headerConfirmText}>{t('confirm')}</Text>
          </Pressable>
        </View>

        <View style={styles.mapShell}>
          {isInitializingLocation ? (
            <View style={styles.mapLoadingWrap}>
              <ActivityIndicator color={colors.primary} size="large" />
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
                pinColor={colors.mapPin}
                onDragEnd={(event) => {
                  void updateFromMapCoordinate(event.nativeEvent.coordinate);
                }}
              />
            </MapView>
          )}

          <View style={styles.searchWrap}>
            <View style={styles.searchInputShell}>
              <MaterialCommunityIcons color={colors.textSecondary} name="magnify" size={16} style={styles.searchIcon} />
              <TextInput
                editable={apiStatus.mode === 'search-enabled'}
                onChangeText={setSearchQuery}
                placeholder={t('search_placeholder_short')}
                placeholderTextColor={colors.textSecondary}
                style={styles.searchInput}
                value={searchQuery}
              />
              <MaterialCommunityIcons color={colors.textSecondary} name="microphone-outline" size={16} />
            </View>
            {fallbackMessage ? <Text style={styles.helperText}>{fallbackMessage}</Text> : null}
            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
          </View>

          <View style={styles.controlsWrap}>
            <Pressable onPress={handleUseCurrentLocation} style={styles.mapControlButton}>
              <MaterialCommunityIcons color={colors.primary} name="crosshairs-gps" size={18} />
            </Pressable>
            <Pressable onPress={() => setMapRegion(regionFromCoordinates(coordinates))} style={styles.mapControlButton}>
              <MaterialCommunityIcons color={colors.primary} name="navigation-variant" size={18} />
            </Pressable>
          </View>

          {apiStatus.mode === 'search-enabled' && (isSearchLoading || suggestions.length > 0) ? (
            <View style={styles.suggestionPanel}>
              {isSearchLoading ? (
                <View style={styles.loaderRow}>
                  <ActivityIndicator color={colors.primary} size="small" />
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

          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeaderRow}>
              <View style={styles.sheetTitleWrap}>
                <Text style={styles.sheetTitle}>{suggestedStoreName || t('selected_place')}</Text>
                <Text style={styles.sheetSubtitle}>{cityArea}</Text>
              </View>
              <Pressable onPress={onClose} style={styles.closeButton}>
                <MaterialCommunityIcons color={colors.textSecondary} name="close" size={18} />
              </Pressable>
            </View>

            <View style={styles.detailRow}>
              <MaterialCommunityIcons color={colors.primary} name="map-marker" size={18} style={styles.detailIcon} />
              <View style={styles.detailTextWrap}>
                <Text style={styles.detailPrimary}>{addressLine || t('no_address')}</Text>
                <Text style={styles.detailSecondary}>{cityArea}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <MaterialCommunityIcons color={colors.textSecondary} name="clock-outline" size={18} style={styles.detailIcon} />
              <Text style={styles.detailSecondary}>{t('compare_open_24h')}</Text>
            </View>

            {isResolvingAddress ? <Text style={styles.loaderText}>{t('resolving_address')}</Text> : null}

            <PrimaryButton label={t('confirm_location')} onPress={handleConfirmSelection} style={styles.confirmButton} />
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.white,
    flex: 1
  },
  header: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderBottomColor: 'rgba(198,198,200,0.5)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 50,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs
  },
  headerAction: {
    minWidth: 76
  },
  headerActionRight: {
    alignItems: 'flex-end',
    minWidth: 76
  },
  headerActionText: {
    color: colors.primary,
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    lineHeight: 26
  },
  headerTitle: {
    color: colors.black,
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    fontWeight: '700',
    lineHeight: 26
  },
  headerConfirmText: {
    color: colors.primary,
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    fontWeight: '700',
    lineHeight: 26
  },
  mapShell: {
    flex: 1,
    position: 'relative'
  },
  map: {
    ...StyleSheet.absoluteFillObject
  },
  mapLoadingWrap: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    rowGap: spacing.sm
  },
  searchWrap: {
    left: spacing.md,
    position: 'absolute',
    right: spacing.md,
    top: spacing.md
  },
  searchInputShell: {
    alignItems: 'center',
    backgroundColor: 'rgba(227,227,232,0.8)',
    borderRadius: radius.lg,
    flexDirection: 'row',
    minHeight: 44,
    paddingHorizontal: spacing.sm,
    ...shadows.soft
  },
  searchIcon: {
    marginRight: spacing.xs
  },
  searchInput: {
    color: colors.textPrimary,
    flex: 1,
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    lineHeight: 24
  },
  helperText: {
    color: colors.white,
    fontFamily: typography.body,
    fontSize: typography.sizes.micro,
    marginTop: spacing.xs,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2
  },
  errorText: {
    color: '#FEE2E2',
    fontFamily: typography.body,
    fontSize: typography.sizes.micro,
    marginTop: spacing.xxs
  },
  controlsWrap: {
    gap: spacing.sm,
    position: 'absolute',
    right: spacing.md,
    top: 108
  },
  mapControlButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 10,
    height: 44,
    justifyContent: 'center',
    width: 44,
    ...shadows.soft
  },
  suggestionPanel: {
    backgroundColor: colors.white,
    borderColor: colors.borderSubtle,
    borderRadius: radius.lg,
    borderWidth: 1,
    left: spacing.md,
    maxHeight: 220,
    position: 'absolute',
    right: spacing.md,
    top: 66,
    ...shadows.card
  },
  suggestionItem: {
    borderBottomColor: colors.dividerSoft,
    borderBottomWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  suggestionPrimary: {
    color: colors.textPrimary,
    fontFamily: typography.body,
    fontSize: typography.sizes.caption,
    fontWeight: '700'
  },
  suggestionSecondary: {
    color: colors.textSecondary,
    fontFamily: typography.body,
    fontSize: typography.sizes.caption,
    marginTop: 2
  },
  loaderRow: {
    alignItems: 'center',
    columnGap: spacing.sm,
    flexDirection: 'row',
    padding: spacing.md
  },
  loaderText: {
    color: colors.textSecondary,
    fontFamily: typography.body,
    fontSize: typography.sizes.caption
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    bottom: 0,
    left: 0,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    position: 'absolute',
    right: 0,
    ...shadows.floating
  },
  sheetHandle: {
    alignSelf: 'center',
    backgroundColor: '#D1D1D6',
    borderRadius: 999,
    height: 4,
    marginBottom: spacing.xs,
    width: 36
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  sheetTitleWrap: {
    flex: 1,
    paddingRight: spacing.md
  },
  sheetTitle: {
    color: colors.black,
    fontFamily: typography.display,
    fontSize: typography.sizes.headingMd,
    lineHeight: 28
  },
  sheetSubtitle: {
    color: colors.textSecondary,
    fontFamily: typography.body,
    fontSize: typography.sizes.body,
    lineHeight: 22,
    marginTop: spacing.xxs
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: '#E3E3E8',
    borderRadius: 15,
    height: 30,
    justifyContent: 'center',
    marginTop: spacing.xs,
    width: 30
  },
  detailRow: {
    flexDirection: 'row',
    marginTop: spacing.sm
  },
  detailIcon: {
    marginRight: spacing.sm,
    marginTop: 1
  },
  detailTextWrap: {
    flex: 1
  },
  detailPrimary: {
    color: colors.black,
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    lineHeight: 24
  },
  detailSecondary: {
    color: colors.textSecondary,
    fontFamily: typography.body,
    fontSize: typography.sizes.body,
    lineHeight: 21
  },
  confirmButton: {
    marginTop: spacing.lg
  }
});
