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

const buildFallbackMessage = (status: PlacesApiStatus, t: (k: any, p?: any) => string): string | null => {
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
  const mapNodeRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any | null>(null);
  const markerRef = useRef<any | null>(null);
  const leafletRef = useRef<any | null>(null);

  const resolveAddress = useCallback(async (nextCoordinates: Coordinates) => {
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
  }, [notSelectedLabel]);

  useEffect(() => {
    if (!visible) return;
    setApiStatus(getInitialPlacesApiStatus());
    setSearchQuery('');
    setCoordinates(initialCoordinates);
    setSelectedSuggestionId(null);
    setMapError(null);
    void resolveAddress(initialCoordinates);
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

        leafletRef.current = L;

        const map = L.map(mapNodeRef.current, {
          zoomControl: true,
          attributionControl: true
        }).setView([coordinates.latitude, coordinates.longitude], 15);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        const marker = L.marker([coordinates.latitude, coordinates.longitude], {
          draggable: true,
          icon: L.divIcon({
            className: 'place-picker-pin',
            iconSize: [18, 18],
            iconAnchor: [9, 9],
            html:
              '<div style="width:14px;height:14px;border-radius:999px;background:#1C7C8C;border:2px solid #FFFFFF;box-shadow:0 0 0 2px rgba(28,124,140,0.25)"></div>'
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
        // Ensure correct tile layout after modal mount/layout.
        window.requestAnimationFrame(() => {
          map.invalidateSize();
        });
        window.setTimeout(() => {
          map.invalidateSize();
        }, 120);
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
    map.setView([coordinates.latitude, coordinates.longitude], map.getZoom() ?? 15, {
      animate: false
    });
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
      <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.headerButton}><Text style={styles.headerButtonText}>{t('cancel')}</Text></Pressable>
          <Text style={styles.headerTitle}>{t('pick_place')}</Text>
          <Pressable onPress={handleConfirm} style={styles.confirmButton}><Text style={styles.confirmButtonText}>{t('confirm')}</Text></Pressable>
        </View>

        <View style={styles.searchWrap}>
          <TextInput
            editable={apiStatus.mode === 'search-enabled'}
            onChangeText={setSearchQuery}
            placeholder={apiStatus.mode === 'search-enabled' ? t('search_placeholder') : t('search_disabled_placeholder')}
            placeholderTextColor={colors.slate500}
            style={[styles.searchInput, apiStatus.mode !== 'search-enabled' && styles.searchDisabled]}
            value={searchQuery}
          />
          <Text style={styles.helperText}>{fallbackMessage ?? t('search_hint')}</Text>
          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
          <Pressable onPress={handleUseCurrentLocation} style={styles.currentButton}>
            <Text style={styles.currentButtonText}>{t('update_location')}</Text>
          </Pressable>
        </View>

        {apiStatus.mode === 'search-enabled' && (isSearchLoading || suggestions.length > 0) ? (
          <View style={styles.suggestionPanel}>
            {isSearchLoading ? (
              <View style={styles.loaderRow}><ActivityIndicator color={colors.sea500} size="small" /><Text style={styles.loaderText}>{t('searching_places')}</Text></View>
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

        <View style={styles.mapWrap}>
          <div ref={mapNodeRef} style={mapStyle} />
          {mapError ? <Text style={styles.errorText}>{mapError}</Text> : null}
        </View>

        <View style={styles.selectionCard}>
          <Text style={styles.selectionTitle}>{suggestedStoreName || t('selected_place')}</Text>
          <Text style={styles.selectionText}>{cityArea}</Text>
          <Text style={styles.selectionText}>{addressLine || t('no_address')}</Text>
          <Text style={styles.selectionText}>{coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}</Text>
          {isResolvingAddress ? <Text style={styles.loaderText}>{t('resolving_address')}</Text> : null}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.sky200
  },
  headerTitle: { color: colors.ink900, fontFamily: typography.display, fontSize: 20 },
  headerButton: { minWidth: 70 },
  headerButtonText: { color: colors.ink700, fontFamily: typography.body, fontWeight: '700' },
  confirmButton: { minWidth: 70, alignItems: 'flex-end' },
  confirmButtonText: { color: colors.sea500, fontFamily: typography.body, fontWeight: '700' },
  searchWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
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
  searchDisabled: { opacity: 0.6 },
  helperText: { marginTop: spacing.xs, color: colors.ink700, fontFamily: typography.body, fontSize: 12 },
  errorText: { marginTop: spacing.xs, color: colors.coral500, fontFamily: typography.body, fontSize: 12 },
  currentButton: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: colors.ink900,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6
  },
  currentButtonText: { color: colors.white, fontFamily: typography.body, fontWeight: '700', fontSize: 12 },
  suggestionPanel: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.sky200,
    borderRadius: radius.md,
    maxHeight: 220,
    backgroundColor: colors.white
  },
  mapWrap: {
    flex: 1,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.sky200,
    borderRadius: radius.md,
    overflow: 'hidden',
    minHeight: 260
  },
  suggestionItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.sky100
  },
  suggestionPrimary: { color: colors.ink900, fontFamily: typography.body, fontWeight: '700', fontSize: 13 },
  suggestionSecondary: { marginTop: 2, color: colors.ink700, fontFamily: typography.body, fontSize: 12 },
  selectionCard: {
    borderTopWidth: 1,
    borderTopColor: colors.sky200,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    rowGap: 3
  },
  selectionTitle: { color: colors.ink900, fontFamily: typography.display, fontSize: 18 },
  selectionText: { color: colors.ink700, fontFamily: typography.body, fontSize: 12 },
  loaderRow: { flexDirection: 'row', alignItems: 'center', columnGap: spacing.sm, padding: spacing.md },
  loaderText: { color: colors.slate500, fontFamily: typography.body, fontSize: 12 }
});

const mapStyle: CSSProperties = {
  width: '100%',
  height: '100%'
};
