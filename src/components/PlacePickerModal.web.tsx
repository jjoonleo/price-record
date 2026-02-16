import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import {
  ActivityIndicator,
  Animated,
  Linking,
  Modal,
  Pressable,
  PanResponder,
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
  initialPlaceSelection?: PlaceSelection;
  showPlaceInfoInitially?: boolean;
  onClose: () => void;
  onConfirm: (selection: PlaceSelection) => void;
};

const formatWebsiteLabel = (websiteUri?: string): string | null => {
  if (!websiteUri) {
    return null;
  }

  try {
    return new URL(websiteUri).hostname.replace(/^www\./u, '');
  } catch {
    return null;
  }
};

const buildFallbackMessage = (status: PlacesApiStatus, t: ReturnType<typeof useI18n>['t']): string | null => {
  if (status.mode !== 'pin-only') {
    return null;
  }

  if (status.reason === 'missing-key') return t('search_missing_key');
  if (status.reason === 'quota-exceeded') return t('search_quota');
  if (status.reason === 'request-denied') return t('search_denied');

  return t('search_unavailable');
};

const parseCityAreaFromAddress = (address?: string): string | undefined => {
  if (!address) {
    return undefined;
  }

  const parts = address
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return undefined;
  }

  if (parts.length === 1) {
    return parts[0];
  }

  return parts[parts.length - 2];
};

export const PlacePickerModal = ({
  visible,
  initialCoordinates,
  initialPlaceSelection,
  showPlaceInfoInitially = false,
  onClose,
  onConfirm
}: PlacePickerModalProps) => {
  const { t } = useI18n();
  const notSelectedLabel = t('not_selected');

  const [apiStatus, setApiStatus] = useState<PlacesApiStatus>({ mode: 'pin-only', reason: 'missing-key' });
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [keepSuggestionPanelVisible, setKeepSuggestionPanelVisible] = useState(false);
  const [coordinates, setCoordinates] = useState<Coordinates>(initialCoordinates);
  const [cityArea, setCityArea] = useState(notSelectedLabel);
  const [addressLine, setAddressLine] = useState<string | undefined>();
  const [suggestedStoreName, setSuggestedStoreName] = useState<string | undefined>();
  const [websiteUri, setWebsiteUri] = useState<string | undefined>();
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isInitializingLocation, setIsInitializingLocation] = useState(false);
  const [isLocatingCurrent, setIsLocatingCurrent] = useState(false);
  const [locationStatusMessage, setLocationStatusMessage] = useState<string | null>(null);
  const [isPlaceInfoVisible, setIsPlaceInfoVisible] = useState(false);
  const [sheetHeight, setSheetHeight] = useState(0);
  const sheetTranslateY = useRef(new Animated.Value(420)).current;
  const suppressSearchBlurRef = useRef(false);
  const didHydrateFromInitialSelectionRef = useRef(false);
  const showPlaceInfoSheetRef = useRef<() => void>(() => {});
  const hidePlaceInfoSheetRef = useRef<() => void>(() => {});
  const mapTapStateRef = useRef({ isVisible: false, hasPlaceInfo: false });
  const initialSelectionQuery = useMemo(
    () =>
      [initialPlaceSelection?.suggestedStoreName, initialPlaceSelection?.addressLine, initialPlaceSelection?.cityArea]
        .filter((value): value is string => Boolean(value))
        .join(', '),
    [initialPlaceSelection]
  );

  const mapNodeRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any | null>(null);
  const markerRef = useRef<any | null>(null);
  const currentLocationMarkerRef = useRef<any | null>(null);
  const leafletRef = useRef<any | null>(null);
  const hasOpenedRef = useRef(false);
  const skipNextCoordinateSyncRef = useRef(false);
  const [currentLocationCoordinates, setCurrentLocationCoordinates] = useState<Coordinates | null>(null);
  const activeCoordinates = useMemo(() => {
    if (hasOpenedRef.current) {
      return coordinates;
    }

    return initialCoordinates;
  }, [coordinates, initialCoordinates]);
  const hasPlaceInfo = useMemo(
    () => Boolean(suggestedStoreName) || Boolean(addressLine) || Boolean(cityArea && cityArea !== notSelectedLabel),
    [addressLine, cityArea, notSelectedLabel, suggestedStoreName]
  );

  const resolveAddress = useCallback(
    async (nextCoordinates: Coordinates) => {
      setIsResolvingAddress(true);
      try {
        const reverse = await reverseGeocodeToArea(nextCoordinates);
        setCityArea(reverse.cityArea);
        setAddressLine(reverse.addressLine);
      } catch {
        setCityArea(notSelectedLabel);
        setAddressLine(undefined);
      } finally {
        setIsResolvingAddress(false);
      }
    },
    [notSelectedLabel]
  );

  const getSheetHiddenOffset = useCallback(() => {
    return sheetHeight > 0 ? sheetHeight : 420;
  }, [sheetHeight]);

  const animateSheet = useCallback(
    (visible: boolean, immediate = false) => {
      const hiddenOffset = getSheetHiddenOffset();

      if (immediate) {
        sheetTranslateY.setValue(visible ? 0 : hiddenOffset);
        setIsPlaceInfoVisible(visible);
        return;
      }

      if (visible) {
        setIsPlaceInfoVisible(true);
      }

      Animated.timing(sheetTranslateY, {
        duration: 220,
        toValue: visible ? 0 : hiddenOffset,
        useNativeDriver: false
      }).start(({ finished }) => {
        if (!visible && finished) {
          setIsPlaceInfoVisible(false);
        }
      });
    },
    [getSheetHiddenOffset, sheetTranslateY]
  );

  const showPlaceInfoSheet = useCallback(() => {
    animateSheet(true);
  }, [animateSheet]);

  const hidePlaceInfoSheet = useCallback(
    (immediate = false) => {
      animateSheet(false, immediate);
    },
    [animateSheet]
  );

  useEffect(() => {
    showPlaceInfoSheetRef.current = showPlaceInfoSheet;
    hidePlaceInfoSheetRef.current = hidePlaceInfoSheet;
  }, [hidePlaceInfoSheet, showPlaceInfoSheet]);

  useEffect(() => {
    mapTapStateRef.current = {
      isVisible: isPlaceInfoVisible,
      hasPlaceInfo
    };
  }, [hasPlaceInfo, isPlaceInfoVisible]);

  const handleSheetLayout = useCallback(
    (event: { nativeEvent: { layout: { height: number } } }) => {
      const nextHeight = event.nativeEvent.layout.height;
      if (nextHeight <= 0) {
        return;
      }

      setSheetHeight(nextHeight);
      if (!isPlaceInfoVisible) {
        sheetTranslateY.setValue(nextHeight);
      }
    },
    [isPlaceInfoVisible, sheetTranslateY]
  );

  const sheetPanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: () => isPlaceInfoVisible,
        onPanResponderGrant: () => {
          sheetTranslateY.stopAnimation();
        },
        onPanResponderMove: (_, gestureState) => {
          if (!isPlaceInfoVisible || gestureState.dy <= 0) {
            return;
          }

          sheetTranslateY.setValue(Math.min(gestureState.dy, getSheetHiddenOffset()));
        },
        onPanResponderRelease: (_, gestureState) => {
          const shouldHide =
            gestureState.dy > 70 || gestureState.vy > 1 || (gestureState.dy > 35 && gestureState.vy >= 0);

          if (shouldHide) {
            hidePlaceInfoSheet();
          } else {
            showPlaceInfoSheet();
          }
        },
        onPanResponderTerminate: () => {
          showPlaceInfoSheet();
        }
      }),
    [getSheetHiddenOffset, hidePlaceInfoSheet, isPlaceInfoVisible, showPlaceInfoSheet, sheetTranslateY]
  );
  const sheetHiddenOffset = sheetHeight > 0 ? sheetHeight : 420;
  const controlsLiftDistance = useMemo(
    () => Math.max(72, Math.min(sheetHiddenOffset, 320)),
    [sheetHiddenOffset]
  );
  const controlsTranslateY = useMemo(
    () =>
      sheetTranslateY.interpolate({
        inputRange: [0, sheetHiddenOffset],
        outputRange: [-controlsLiftDistance, 0],
        extrapolate: 'clamp'
      }),
    [controlsLiftDistance, sheetHiddenOffset, sheetTranslateY]
  );

  useEffect(() => {
    if (!visible) {
      hasOpenedRef.current = false;
      skipNextCoordinateSyncRef.current = false;
      didHydrateFromInitialSelectionRef.current = false;
      return;
    }

    if (hasOpenedRef.current) {
      return;
    }

    hasOpenedRef.current = true;
    skipNextCoordinateSyncRef.current = true;

    setApiStatus(getInitialPlacesApiStatus());
    setCoordinates(initialCoordinates);
    setCityArea(initialPlaceSelection?.cityArea ?? notSelectedLabel);
    setAddressLine(initialPlaceSelection?.addressLine);
    setSuggestedStoreName(initialPlaceSelection?.suggestedStoreName);
    setSearchQuery(initialSelectionQuery);
    setWebsiteUri(undefined);
    setLocationStatusMessage(null);
    setIsLocatingCurrent(false);
    setSelectedSuggestionId(null);
    setIsSearchFocused(false);
    setKeepSuggestionPanelVisible(false);
    suppressSearchBlurRef.current = false;
    setMapError(null);
    setIsInitializingLocation(true);
    didHydrateFromInitialSelectionRef.current = false;
    setCurrentLocationCoordinates(null);

    void (async () => {
      const currentResult = await captureCurrentLocation();
      if (currentResult.status === 'granted') {
        setCurrentLocationCoordinates(currentResult.coordinates);
      }
      if (initialPlaceSelection) {
        if (!initialPlaceSelection.addressLine || !initialPlaceSelection.cityArea) {
          await resolveAddress(initialCoordinates);
        }
      } else {
        setCityArea(notSelectedLabel);
        setAddressLine(undefined);
        setSuggestedStoreName(undefined);
        setSearchQuery('');
      }
      if (showPlaceInfoInitially) {
        showPlaceInfoSheet();
      } else {
        hidePlaceInfoSheet(true);
      }
      setIsInitializingLocation(false);
    })();
  }, [
    showPlaceInfoInitially,
    initialSelectionQuery,
    initialPlaceSelection,
    hidePlaceInfoSheet,
    initialCoordinates,
    resolveAddress,
    showPlaceInfoSheet,
    visible,
    notSelectedLabel
  ]);

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
          zoomControl: false,
          attributionControl: false
        }).setView([activeCoordinates.latitude, activeCoordinates.longitude], 15);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        const marker = L.marker([activeCoordinates.latitude, activeCoordinates.longitude], {
          draggable: false,
          icon: L.divIcon({
            className: 'place-picker-pin',
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            html:
              '<div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:999px;background:#FF3B30;box-shadow:0 8px 16px rgba(0,0,0,0.2)"><span style="width:10px;height:10px;border-radius:999px;background:#fff"></span></div>'
          })
        }).addTo(map);
        marker.setOpacity(hasPlaceInfo ? 1 : 0);

        map.on('click', (_event: any) => {
          const { isVisible, hasPlaceInfo } = mapTapStateRef.current;
          if (isVisible) {
            hidePlaceInfoSheetRef.current();
          }
          setKeepSuggestionPanelVisible(false);
          setIsSearchFocused(false);
        });
        marker.on('click', (event: any) => {
          L.DomEvent.stopPropagation(event);
          if (!mapTapStateRef.current.hasPlaceInfo) {
            return;
          }
          setKeepSuggestionPanelVisible(false);
          setIsSearchFocused(false);
          showPlaceInfoSheetRef.current();
        });

        mapRef.current = map;
        markerRef.current = marker;
        if (currentLocationCoordinates) {
          currentLocationMarkerRef.current = L.circleMarker(
            [currentLocationCoordinates.latitude, currentLocationCoordinates.longitude],
            {
              radius: 6,
              color: '#1D4ED8',
              weight: 2,
              fillColor: '#1D4ED8',
              fillOpacity: 1
            }
          ).addTo(map);
        }

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
      currentLocationMarkerRef.current = null;
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

    if (skipNextCoordinateSyncRef.current) {
      skipNextCoordinateSyncRef.current = false;
      return;
    }

    marker.setLatLng([coordinates.latitude, coordinates.longitude]);
    marker.setOpacity(hasPlaceInfo ? 1 : 0);
    map.invalidateSize();
    map.setView([coordinates.latitude, coordinates.longitude], map.getZoom() ?? 15, { animate: false });
  }, [coordinates, hasPlaceInfo, visible]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const marker = markerRef.current;
    if (!marker) {
      return;
    }

    marker.setOpacity(hasPlaceInfo ? 1 : 0);
  }, [hasPlaceInfo, visible]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const map = mapRef.current;
    const L = leafletRef.current;

    if (!map || !L || !currentLocationCoordinates) {
      return;
    }

    if (currentLocationMarkerRef.current) {
      currentLocationMarkerRef.current.setLatLng([
        currentLocationCoordinates.latitude,
        currentLocationCoordinates.longitude
      ]);
      return;
    }

    currentLocationMarkerRef.current = L.circleMarker(
      [currentLocationCoordinates.latitude, currentLocationCoordinates.longitude],
      {
        radius: 6,
        color: '#1D4ED8',
        weight: 2,
        fillColor: '#1D4ED8',
        fillOpacity: 1
      }
    ).addTo(map);
  }, [currentLocationCoordinates, visible]);

  const onSearchFailure = useCallback((reason: 'request-failed' | 'quota-exceeded' | 'request-denied') => {
    if (reason === 'request-failed') return;
    setApiStatus({ mode: 'pin-only', reason });
  }, []);

  const { suggestions, isLoading: isSearchLoading, errorMessage } = usePlaceSearch(searchQuery, apiStatus, onSearchFailure);
  const fallbackMessage = useMemo(() => buildFallbackMessage(apiStatus, t), [apiStatus, t]);

  const handleSuggestionSelect = async (suggestion: PlaceSuggestion) => {
    try {
      setIsSearchFocused(false);
      setKeepSuggestionPanelVisible(false);
      suppressSearchBlurRef.current = false;
      setSelectedSuggestionId(suggestion.placeId);
      const details = await getPlaceDetails(suggestion.placeId);
      const nextCoordinates = { latitude: details.latitude, longitude: details.longitude };
      skipNextCoordinateSyncRef.current = false;
      setCoordinates(nextCoordinates);
      setSuggestedStoreName(details.name || suggestion.primaryText);
      setWebsiteUri(details.websiteUri);
      const addressLineCandidate = details.address;
      setCityArea(parseCityAreaFromAddress(addressLineCandidate) ?? notSelectedLabel);
      setAddressLine(addressLineCandidate);
      setSearchQuery(suggestion.primaryText);
      const map = mapRef.current;
      if (map) {
        map.setView([nextCoordinates.latitude, nextCoordinates.longitude], map.getZoom() ?? 15, { animate: true });
      }
    } catch {
      setSuggestedStoreName(suggestion.primaryText);
      setWebsiteUri(undefined);
      setSearchQuery(suggestion.primaryText);
    } finally {
      showPlaceInfoSheet();
      setSelectedSuggestionId(null);
    }
  };

  useEffect(() => {
    if (!visible || !showPlaceInfoInitially || didHydrateFromInitialSelectionRef.current) {
      return;
    }

    if (!initialPlaceSelection || isSearchLoading || suggestions.length === 0) {
      return;
    }

    if (!initialSelectionQuery || searchQuery !== initialSelectionQuery) {
      return;
    }

    const topSuggestion = suggestions[0];
    if (!topSuggestion) {
      return;
    }

    didHydrateFromInitialSelectionRef.current = true;
    void handleSuggestionSelect(topSuggestion);
  }, [
    handleSuggestionSelect,
    initialPlaceSelection,
    isSearchLoading,
    showPlaceInfoInitially,
    initialSelectionQuery,
    searchQuery,
    suggestions,
    visible
  ]);

  const handleUseCurrentLocation = async () => {
    setIsLocatingCurrent(true);
    setLocationStatusMessage(null);
    const result = await captureCurrentLocation();
    if (result.status === 'granted') {
      const map = mapRef.current;
      setCurrentLocationCoordinates(result.coordinates);
      if (map) {
        map.setView([result.coordinates.latitude, result.coordinates.longitude], map.getZoom() ?? 15, {
          animate: true
        });
      }
    } else {
      setLocationStatusMessage(result.message);
    }
    setIsLocatingCurrent(false);
  };

  const websiteLabel = formatWebsiteLabel(websiteUri);

  const handleConfirmSelection = () => {
    const normalizedAddressLine = addressLine?.trim() ?? '';
    if (!normalizedAddressLine) {
      return;
    }

    onConfirm({
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      cityArea,
      addressLine: normalizedAddressLine,
      suggestedStoreName
    });
    onClose();
  };

  const canConfirmSelection = !isResolvingAddress && (addressLine?.trim().length ?? 0) > 0;


  return (
    <Modal animationType="slide" presentationStyle="fullScreen" visible={visible}>
      <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
        <View style={styles.mapShell}>
          <div ref={mapNodeRef} style={mapStyle} />
          {isInitializingLocation ? (
            <View style={styles.mapLoadingWrap}>
              <ActivityIndicator color={colors.primary} size="large" />
              <Text style={styles.loaderText}>{t('map_centering')}</Text>
            </View>
          ) : null}

          <View style={styles.searchWrap}>
            <View style={styles.searchRow}>
              <Pressable onPress={onClose} style={styles.backButton}>
                <MaterialCommunityIcons color={colors.textPrimary} name="chevron-left" size={26} />
              </Pressable>
              <View style={styles.searchInputShell}>
                {!isSearchFocused ? (
                  <MaterialCommunityIcons color={colors.textSecondary} name="magnify" size={16} style={styles.searchIcon} />
                ) : null}
                <TextInput
                  editable={apiStatus.mode === 'search-enabled'}
                  onChangeText={setSearchQuery}
                  onBlur={() => {
                    if (suppressSearchBlurRef.current) {
                      suppressSearchBlurRef.current = false;
                      return;
                    }
                    setIsSearchFocused(false);
                  }}
                  onFocus={() => {
                    setIsSearchFocused(true);
                    setKeepSuggestionPanelVisible(false);
                  }}
                  blurOnSubmit={false}
                  onSubmitEditing={() => {
                    hidePlaceInfoSheet();
                    setKeepSuggestionPanelVisible(true);
                  }}
                  placeholder={t('search_placeholder_short')}
                  placeholderTextColor={colors.textSecondary}
                  style={styles.searchInput}
                  value={searchQuery}
                />
                {searchQuery.trim().length > 0 ? (
                  <Pressable
                    accessibilityLabel="Clear search"
                    onPress={() => {
                      setSearchQuery('');
                      setKeepSuggestionPanelVisible(false);
                    }}
                    style={styles.searchClearButton}
                  >
                    <MaterialCommunityIcons color={colors.textSecondary} name="close-circle" size={16} />
                  </Pressable>
                ) : null}
              </View>
            </View>
            {fallbackMessage ? <Text style={styles.helperText}>{fallbackMessage}</Text> : null}
            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
            {locationStatusMessage ? <Text style={styles.errorText}>{locationStatusMessage}</Text> : null}
            {apiStatus.mode === 'search-enabled' &&
            (isSearchFocused || keepSuggestionPanelVisible) &&
            (isSearchLoading || suggestions.length > 0) ? (
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
                        onPressIn={() => {
                          suppressSearchBlurRef.current = true;
                        }}
                        onPress={() => void handleSuggestionSelect(suggestion)}
                        style={styles.suggestionItem}
                      >
                        <Text style={styles.suggestionPrimary}>{suggestion.primaryText}</Text>
                        {suggestion.secondaryText ? <Text style={styles.suggestionSecondary}>{suggestion.secondaryText}</Text> : null}
                        {selectedSuggestionId === suggestion.placeId ? <Text style={styles.loaderText}>{t('applying')}</Text> : null}
                      </Pressable>
                    ))}
                  </ScrollView>
                )}
              </View>
            ) : null}
          </View>

          <Animated.View
            style={[
              styles.controlsWrap,
              {
                bottom: spacing.md,
                transform: [{ translateY: controlsTranslateY }]
              }
            ]}
          >
            <Pressable disabled={isLocatingCurrent} onPress={handleUseCurrentLocation} style={styles.mapControlButton}>
              {isLocatingCurrent ? (
                <ActivityIndicator color={colors.primary} size="small" />
              ) : (
                <MaterialCommunityIcons color={colors.primary} name="crosshairs-gps" size={18} />
              )}
            </Pressable>
          </Animated.View>

          {mapError ? <Text style={styles.mapError}>{mapError}</Text> : null}

          <Animated.View
            onLayout={handleSheetLayout}
            pointerEvents={isPlaceInfoVisible ? 'auto' : 'none'}
            style={[
              styles.sheet,
              {
                transform: [{ translateY: sheetTranslateY }]
              }
            ]}
            {...sheetPanResponder.panHandlers}
          >
            <View style={styles.sheetHandleWrap}>
              <View style={styles.sheetHandle} />
            </View>
            <View style={styles.sheetBody}>
              <View style={styles.sheetHeaderRow}>
                <View style={styles.sheetTitleWrap}>
                  <Text numberOfLines={1} style={styles.sheetTitle}>
                    {suggestedStoreName || t('selected_place')}
                  </Text>
                  <Text numberOfLines={1} style={styles.sheetMeta}>
                    {cityArea}
                  </Text>

                  <View style={styles.detailStack}>
                    <View style={styles.detailRow}>
                      <View style={styles.detailIconSlot}>
                        <MaterialCommunityIcons color={colors.primary} name="map-marker" size={17} />
                      </View>
                      <View style={styles.detailTextWrap}>
                        <Text style={styles.detailPrimary}>{addressLine || t('no_address')}</Text>
                        <Text style={styles.detailSecondary}>{cityArea}</Text>
                      </View>
                    </View>

                    {websiteUri && websiteLabel ? (
                      <View style={styles.detailRow}>
                        <View style={styles.detailIconSlot}>
                          <MaterialCommunityIcons color={colors.textTertiary} name="web" size={17} />
                        </View>
                        <Pressable
                          accessibilityRole="link"
                          onPress={() => {
                            if (typeof window !== 'undefined') {
                              window.open(websiteUri, '_blank', 'noopener,noreferrer');
                            }
                          }}
                          style={({ pressed }) => [pressed && styles.pressed]}
                        >
                          <Text numberOfLines={1} style={styles.detailLinkText}>
                            {websiteLabel}
                          </Text>
                        </Pressable>
                      </View>
                    ) : null}

                  </View>
                </View>

                <Pressable onPress={() => hidePlaceInfoSheet()} style={styles.closeButton}>
                  <MaterialCommunityIcons color={colors.textSecondary} name="close" size={18} />
                </Pressable>
              </View>

              {isResolvingAddress ? <Text style={styles.loaderText}>{t('resolving_address')}</Text> : null}
              {!isResolvingAddress && !canConfirmSelection ? (
                <Text style={styles.errorText}>{t('validation_address_required')}</Text>
              ) : null}

              <PrimaryButton
                label={t('confirm_location')}
                onPress={handleConfirmSelection}
                disabled={!canConfirmSelection}
                style={styles.confirmButton}
              />
            </View>
          </Animated.View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  mapShell: {
    flex: 1,
    position: 'relative'
  },
  mapLoadingWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    rowGap: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.35)',
    zIndex: 20
  },
  searchWrap: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    top: spacing.md,
    zIndex: 30
  },
  searchRow: {
    alignItems: 'center',
    width: '100%',
    flexDirection: 'row',
    columnGap: spacing.xs
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(227,227,232,0.8)',
    borderRadius: radius.lg,
    height: 44,
    justifyContent: 'center',
    width: 44,
    ...shadows.soft
  },
  searchInputShell: {
    alignItems: 'center',
    backgroundColor: 'rgba(227,227,232,0.8)',
    borderRadius: radius.lg,
    flex: 1,
    flexDirection: 'row',
    minWidth: 0,
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
  searchClearButton: {
    alignItems: 'center',
    height: 28,
    justifyContent: 'center',
    width: 28
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
    alignItems: 'flex-end',
    zIndex: 1200
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
    marginTop: spacing.xs,
    maxHeight: 220,
    zIndex: 40,
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
    textAlign: 'center',
    zIndex: 45
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    zIndex: 1000,
    ...shadows.floating
  },
  sheetHandleWrap: {
    alignItems: 'center',
    paddingBottom: spacing.xxs,
    paddingTop: spacing.xs
  },
  sheetHandle: {
    backgroundColor: '#D1D1D6',
    borderRadius: 999,
    height: 4,
    width: 36
  },
  sheetBody: {
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs
  },
  sheetHeaderRow: {
    alignItems: 'flex-start',
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
    letterSpacing: -0.55,
    lineHeight: 28
  },
  sheetMeta: {
    color: colors.textSecondary,
    fontFamily: typography.body,
    fontSize: typography.sizes.body,
    lineHeight: 22.5,
    marginTop: spacing.xxs
  },
  detailStack: {
    marginTop: spacing.xs,
    rowGap: spacing.sm
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: '#E3E3E8',
    borderRadius: 15,
    height: 30,
    justifyContent: 'center',
    width: 30
  },
  detailRow: {
    alignItems: 'center',
    flexDirection: 'row'
  },
  detailIconSlot: {
    alignItems: 'center',
    marginRight: spacing.sm,
    width: 28
  },
  detailTextWrap: {
    flex: 1
  },
  detailPrimary: {
    color: colors.black,
    fontFamily: typography.body,
    fontSize: typography.sizes.title,
    lineHeight: 23.4
  },
  detailSecondary: {
    color: colors.textSecondary,
    fontFamily: typography.body,
    fontSize: typography.sizes.body,
    lineHeight: 20.63
  },
  detailLinkText: {
    color: colors.primary,
    fontFamily: typography.body,
    fontSize: typography.sizes.body,
    lineHeight: 20.63
  },
  confirmButton: {
    marginTop: spacing.xl
  },
  pressed: {
    opacity: 0.8
  }
});

const mapStyle: CSSProperties = {
  bottom: 0,
  left: 0,
  position: 'absolute',
  right: 0,
  top: 0,
  width: '100%',
  height: '100%',
  zIndex: 0
};
