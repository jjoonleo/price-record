import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

const buildFallbackMessage = (status: PlacesApiStatus, t: (key: any) => string): string | null => {
  if (status.mode !== 'pin-only') {
    return null;
  }

  if (status.reason === 'missing-key') return t('search_missing_key');
  if (status.reason === 'quota-exceeded') return t('search_quota');
  if (status.reason === 'request-denied') return t('search_denied');

  return t('search_unavailable');
};

export const PlacePickerModal = ({ visible, initialCoordinates, onClose, onConfirm }: PlacePickerModalProps) => {
  const { t } = useI18n();
  const notSelectedLabel = t('not_selected');

  const [apiStatus, setApiStatus] = useState<PlacesApiStatus>({ mode: 'pin-only', reason: 'missing-key' });
  const [searchQuery, setSearchQuery] = useState('');
  const [coordinates, setCoordinates] = useState<Coordinates>(initialCoordinates);
  const [cityArea, setCityArea] = useState(notSelectedLabel);
  const [addressLine, setAddressLine] = useState<string | undefined>();
  const [suggestedStoreName, setSuggestedStoreName] = useState<string | undefined>();
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isInitializingLocation, setIsInitializingLocation] = useState(false);

  const mapNodeRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any | null>(null);
  const markerRef = useRef<any | null>(null);

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
    if (!visible) return;

    setApiStatus(getInitialPlacesApiStatus());
    setSearchQuery('');
    setCoordinates(initialCoordinates);
    setSelectedSuggestionId(null);
    setMapError(null);
    setIsInitializingLocation(true);

    void (async () => {
      const locationResult = await captureCurrentLocation();
      if (locationResult.status === 'granted') {
        setCoordinates(locationResult.coordinates);
        setCityArea(locationResult.cityArea);
        setAddressLine(locationResult.addressLine);
      } else {
        await resolveAddress(initialCoordinates);
      }
      setIsInitializingLocation(false);
    })();
  }, [initialCoordinates, resolveAddress, visible]);

  useEffect(() => {
    if (!visible || !mapNodeRef.current || typeof window === 'undefined') {
      return;
    }

    let disposed = false;

    const initMap = async () => {
      try {
        const module = await import('leaflet');
        const L = module.default;
        if (disposed || !mapNodeRef.current) {
          return;
        }

        const map = L.map(mapNodeRef.current, {
          zoomControl: false,
          attributionControl: false
        }).setView([coordinates.latitude, coordinates.longitude], 15);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        const marker = L.marker([coordinates.latitude, coordinates.longitude], {
          draggable: true,
          icon: L.divIcon({
            className: 'place-picker-pin',
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            html:
              '<div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:999px;background:#FF3B30;box-shadow:0 8px 16px rgba(0,0,0,0.2)"><span style="width:10px;height:10px;border-radius:999px;background:#fff"></span></div>'
          })
        }).addTo(map);

        marker.on('dragend', () => {
          const next = marker.getLatLng();
          const nextCoordinates = { latitude: next.lat, longitude: next.lng };
          setCoordinates(nextCoordinates);
          void resolveAddress(nextCoordinates);
        });

        map.on('click', (event: any) => {
          const nextCoordinates = { latitude: event.latlng.lat, longitude: event.latlng.lng };
          marker.setLatLng([nextCoordinates.latitude, nextCoordinates.longitude]);
          setCoordinates(nextCoordinates);
          void resolveAddress(nextCoordinates);
        });

        mapRef.current = map;
        markerRef.current = marker;

        window.requestAnimationFrame(() => {
          map.invalidateSize();
        });
      } catch (error) {
        setMapError(error instanceof Error ? error.message : 'Map failed to load');
      }
    };

    void initMap();

    return () => {
      disposed = true;
      markerRef.current = null;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const map = mapRef.current;
    const marker = markerRef.current;

    if (!map || !marker) {
      return;
    }

    marker.setLatLng([coordinates.latitude, coordinates.longitude]);
    map.invalidateSize();
    map.setView([coordinates.latitude, coordinates.longitude], map.getZoom() ?? 15, { animate: false });
  }, [coordinates, visible]);

  const onSearchFailure = useCallback((reason: 'request-failed' | 'quota-exceeded' | 'request-denied') => {
    if (reason === 'request-failed') return;
    setApiStatus({ mode: 'pin-only', reason });
  }, []);

  const { suggestions, isLoading: isSearchLoading, errorMessage } = usePlaceSearch(searchQuery, apiStatus, onSearchFailure);
  const fallbackMessage = useMemo(() => buildFallbackMessage(apiStatus, t), [apiStatus, t]);

  const handleSuggestionSelect = async (suggestion: PlaceSuggestion) => {
    try {
      setSelectedSuggestionId(suggestion.placeId);
      const details = await getPlaceDetails(suggestion.placeId);
      const nextCoordinates = { latitude: details.latitude, longitude: details.longitude };
      setCoordinates(nextCoordinates);
      setSuggestedStoreName(details.name || suggestion.primaryText);
      const reverse = await reverseGeocodeToArea(nextCoordinates);
      setCityArea(reverse.cityArea);
      setAddressLine(details.address || reverse.addressLine);
      setSearchQuery(suggestion.primaryText);
    } finally {
      setSelectedSuggestionId(null);
    }
  };

  const handleUseCurrentLocation = async () => {
    const result = await captureCurrentLocation();
    if (result.status === 'granted') {
      setCoordinates(result.coordinates);
      setCityArea(result.cityArea);
      setAddressLine(result.addressLine);
    }
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

  const recenterMap = () => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    map.setView([coordinates.latitude, coordinates.longitude], map.getZoom() ?? 15, { animate: false });
  };

  return (
    <Modal animationType="slide" presentationStyle="fullScreen" visible={visible}>
      <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.headerAction}><Text style={styles.headerActionText}>{t('cancel')}</Text></Pressable>
          <Text style={styles.headerTitle}>{t('pick_place')}</Text>
          <Pressable onPress={handleConfirmSelection} style={styles.headerActionRight}><Text style={styles.headerConfirmText}>{t('confirm')}</Text></Pressable>
        </View>

        <View style={styles.mapShell}>
          <div ref={mapNodeRef} style={mapStyle} />
          {isInitializingLocation ? (
            <View style={styles.mapLoadingWrap}>
              <ActivityIndicator color={colors.primary} size="large" />
              <Text style={styles.loaderText}>{t('map_centering')}</Text>
            </View>
          ) : null}

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
            <Pressable onPress={recenterMap} style={styles.mapControlButton}>
              <MaterialCommunityIcons color={colors.primary} name="navigation-variant" size={18} />
            </Pressable>
          </View>

          {apiStatus.mode === 'search-enabled' && (isSearchLoading || suggestions.length > 0) ? (
            <View style={styles.suggestionPanel}>
              {isSearchLoading ? (
                <View style={styles.loaderRow}><ActivityIndicator color={colors.primary} size="small" /><Text style={styles.loaderText}>{t('searching_places')}</Text></View>
              ) : (
                <ScrollView keyboardShouldPersistTaps="handled">
                  {suggestions.map((suggestion) => (
                    <Pressable key={suggestion.placeId} onPress={() => void handleSuggestionSelect(suggestion)} style={styles.suggestionItem}>
                      <Text style={styles.suggestionPrimary}>{suggestion.primaryText}</Text>
                      {suggestion.secondaryText ? <Text style={styles.suggestionSecondary}>{suggestion.secondaryText}</Text> : null}
                      {selectedSuggestionId === suggestion.placeId ? <Text style={styles.loaderText}>{t('applying')}</Text> : null}
                    </Pressable>
                  ))}
                </ScrollView>
              )}
            </View>
          ) : null}

          {mapError ? <Text style={styles.mapError}>{mapError}</Text> : null}

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
  screen: { flex: 1, backgroundColor: colors.white },
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
  headerAction: { minWidth: 76 },
  headerActionRight: { minWidth: 76, alignItems: 'flex-end' },
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
  mapLoadingWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    rowGap: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.35)'
  },
  searchWrap: {
    position: 'absolute',
    left: spacing.md,
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
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: spacing.sm,
    padding: spacing.md
  },
  loaderText: {
    color: colors.textSecondary,
    fontFamily: typography.body,
    fontSize: typography.sizes.caption
  },
  mapError: {
    bottom: 320,
    color: '#B91C1C',
    fontFamily: typography.body,
    left: spacing.md,
    position: 'absolute',
    right: spacing.md,
    textAlign: 'center'
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

const mapStyle: CSSProperties = {
  width: '100%',
  height: '100%'
};
