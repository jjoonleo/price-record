import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Linking,
  Modal,
  Keyboard,
  Pressable,
  PanResponder,
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
  initialPlaceSelection?: PlaceSelection;
  showPlaceInfoInitially?: boolean;
  onClose: () => void;
  onConfirm: (selection: PlaceSelection) => void;
};

const regionFromCoordinates = (coords: Coordinates): Region => ({
  latitude: coords.latitude,
  longitude: coords.longitude,
  latitudeDelta: 0.04,
  longitudeDelta: 0.04
});

const USER_TRACKING_MODES = {
  none: 0,
  follow: 1,
  followWithHeading: 2
} as const;

const MAP_LOCATION_TOLERANCE = 0.0015;

const isCloseToCoordinates = (left: Coordinates, right: Coordinates): boolean => {
  return (
    Math.abs(left.latitude - right.latitude) <= MAP_LOCATION_TOLERANCE &&
    Math.abs(left.longitude - right.longitude) <= MAP_LOCATION_TOLERANCE
  );
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
  initialPlaceSelection,
  showPlaceInfoInitially = false,
  onClose,
  onConfirm
}: PlacePickerModalProps) => {
  const { t } = useI18n();
  const notSelectedLabel = t('not_selected');
  const insets = useSafeAreaInsets();
  const [apiStatus, setApiStatus] = useState<PlacesApiStatus>({ mode: 'pin-only', reason: 'missing-key' });
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [coordinates, setCoordinates] = useState<Coordinates>(initialCoordinates);
  const [cityArea, setCityArea] = useState(notSelectedLabel);
  const [addressLine, setAddressLine] = useState<string | undefined>();
  const [suggestedStoreName, setSuggestedStoreName] = useState<string | undefined>();
  const [websiteUri, setWebsiteUri] = useState<string | undefined>();
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [isInitializingLocation, setIsInitializingLocation] = useState(false);
  const [isLocatingCurrent, setIsLocatingCurrent] = useState(false);
  const [locationStatusMessage, setLocationStatusMessage] = useState<string | null>(null);
  const [mapRegion, setMapRegion] = useState<Region>(regionFromCoordinates(initialCoordinates));
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<string | null>(null);
  const [isPlaceInfoVisible, setIsPlaceInfoVisible] = useState(false);
  const [sheetHeight, setSheetHeight] = useState(0);
  const [userTrackingMode, setUserTrackingMode] = useState<number>(USER_TRACKING_MODES.none);
  const [currentLocationCoordinates, setCurrentLocationCoordinates] = useState<Coordinates | null>(null);
  const sheetTranslateY = useRef(new Animated.Value(Dimensions.get('window').height)).current;
  const suppressSearchBlurRef = useRef(false);
  const hasOpenedRef = useRef(false);
  const didHydrateFromInitialSelectionRef = useRef(false);
  const activeCoordinates = useMemo(() => {
    if (hasOpenedRef.current) {
      return coordinates;
    }

    return initialCoordinates;
  }, [coordinates, initialCoordinates]);
  const activeMapRegion = useMemo(() => {
    if (hasOpenedRef.current) {
      return mapRegion;
    }

    return regionFromCoordinates(initialCoordinates);
  }, [mapRegion, initialCoordinates]);
  const hasPlaceInfo = useMemo(
    () => Boolean(suggestedStoreName) || Boolean(addressLine) || (cityArea && cityArea !== notSelectedLabel),
    [addressLine, cityArea, notSelectedLabel, suggestedStoreName]
  );
  const initialSelectionQuery = useMemo(
    () =>
      [initialPlaceSelection?.suggestedStoreName, initialPlaceSelection?.addressLine, initialPlaceSelection?.cityArea]
        .filter((value): value is string => Boolean(value))
        .join(', '),
    [initialPlaceSelection]
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
        useNativeDriver: true
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

  const clearTrackingMode = useCallback(() => {
    setUserTrackingMode(USER_TRACKING_MODES.none);
  }, []);

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
  const controlsBottomOffset = useMemo(() => {
    return Math.max(spacing.md, insets.bottom + spacing.md);
  }, [insets.bottom]);
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
      didHydrateFromInitialSelectionRef.current = false;
      return;
    }

    if (hasOpenedRef.current) {
      return;
    }

    hasOpenedRef.current = true;

    const initStatus = getInitialPlacesApiStatus();
    setApiStatus(initStatus);
    setCoordinates(initialCoordinates);
    setMapRegion(regionFromCoordinates(initialCoordinates));
    setCityArea(initialPlaceSelection?.cityArea ?? notSelectedLabel);
    setAddressLine(initialPlaceSelection?.addressLine);
    setSuggestedStoreName(initialPlaceSelection?.suggestedStoreName);
    setSearchQuery(initialSelectionQuery);
    setWebsiteUri(undefined);
    setLocationStatusMessage(null);
    setIsLocatingCurrent(false);
    setSelectedSuggestionId(null);
    setIsSearchFocused(false);
    suppressSearchBlurRef.current = false;
    clearTrackingMode();
    setCurrentLocationCoordinates(null);
    setIsInitializingLocation(true);
    didHydrateFromInitialSelectionRef.current = false;

    void (async () => {
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
    clearTrackingMode,
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
      Keyboard.dismiss();
      setIsSearchFocused(false);
      suppressSearchBlurRef.current = false;
      setSelectedSuggestionId(suggestion.placeId);
      const details = await getPlaceDetails(suggestion.placeId);
      const nextCoordinates = {
        latitude: details.latitude,
        longitude: details.longitude
      };

      setCoordinates(nextCoordinates);
      setMapRegion(regionFromCoordinates(nextCoordinates));
      setSuggestedStoreName(details.name || suggestion.primaryText);
      setWebsiteUri(details.websiteUri);

      const reverse = await reverseGeocodeToArea(nextCoordinates);
      setCityArea(reverse.cityArea);
      setAddressLine(details.address || reverse.addressLine);
      setSearchQuery(suggestion.primaryText);
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

  const handleMapPress = (_event: MapPressEvent) => {
    if (isPlaceInfoVisible) {
      hidePlaceInfoSheet();
    } else if (hasPlaceInfo) {
      showPlaceInfoSheet();
    }
    clearTrackingMode();
    setIsSearchFocused(false);
    Keyboard.dismiss();
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
    setIsLocatingCurrent(true);
    setLocationStatusMessage(null);
    const result = await captureCurrentLocation();
    if (result.status === 'granted') {
      const isMapCenteredAtCurrentLocation = isCloseToCoordinates(
        { latitude: mapRegion.latitude, longitude: mapRegion.longitude },
        result.coordinates
      );
      setCurrentLocationCoordinates(result.coordinates);

      if (isMapCenteredAtCurrentLocation && userTrackingMode === USER_TRACKING_MODES.follow) {
        setUserTrackingMode(USER_TRACKING_MODES.followWithHeading);
      } else if (userTrackingMode !== USER_TRACKING_MODES.followWithHeading) {
        setUserTrackingMode(USER_TRACKING_MODES.follow);
      }
      setMapRegion(regionFromCoordinates(result.coordinates));
    } else {
      setLocationStatusMessage(result.message);
    }
    setIsLocatingCurrent(false);
  };

  const websiteLabel = formatWebsiteLabel(websiteUri);

  return (
    <Modal animationType="slide" presentationStyle="fullScreen" visible={visible}>
      <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.screen}>
        <View style={[styles.header, { paddingTop: Math.max(insets.top, spacing.sm) }]}>
          <Pressable onPress={onClose} style={styles.headerAction}>
            <Text style={styles.headerActionText}>{t('cancel')}</Text>
          </Pressable>
          <Text style={styles.headerTitle}>{t('pick_place')}</Text>
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
              onPanDrag={clearTrackingMode}
              region={activeMapRegion}
              style={styles.map}
              onRegionChangeComplete={(region: Region) => setMapRegion(region)}
              userTrackingMode={userTrackingMode as never}
              showsUserLocation
            >
              {currentLocationCoordinates ? (
                <Marker coordinate={currentLocationCoordinates} anchor={{ x: 0.5, y: 0.5 }}>
                  <View style={styles.currentLocationDot} />
                </Marker>
              ) : null}
              {hasPlaceInfo ? (
                <Marker
                  coordinate={activeCoordinates}
                  pinColor={colors.mapPin}
                />
              ) : null}
            </MapView>
          )}

          <View style={styles.searchWrap}>
            <View style={styles.searchInputShell}>
              <MaterialCommunityIcons color={colors.textSecondary} name="magnify" size={16} style={styles.searchIcon} />
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
                onFocus={() => setIsSearchFocused(true)}
                placeholder={t('search_placeholder_short')}
                placeholderTextColor={colors.textSecondary}
                style={styles.searchInput}
                value={searchQuery}
              />
              <MaterialCommunityIcons color={colors.textSecondary} name="microphone-outline" size={16} />
            </View>
            {fallbackMessage ? <Text style={styles.helperText}>{fallbackMessage}</Text> : null}
            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
            {locationStatusMessage ? <Text style={styles.errorText}>{locationStatusMessage}</Text> : null}
          </View>

          <Animated.View
            style={[
              styles.controlsWrap,
              {
                bottom: controlsBottomOffset,
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
            <Pressable
              onPress={() => {
                clearTrackingMode();
                setMapRegion(regionFromCoordinates(coordinates));
              }}
              style={styles.mapControlButton}
            >
              <MaterialCommunityIcons color={colors.primary} name="navigation-variant" size={18} />
            </Pressable>
          </Animated.View>

          {apiStatus.mode === 'search-enabled' && isSearchFocused && (isSearchLoading || suggestions.length > 0) ? (
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
                            void Linking.openURL(websiteUri);
                          }}
                          style={({ pressed }) => [pressed && styles.pressed]}
                        >
                          <Text numberOfLines={1} style={styles.detailLinkText}>
                            {websiteLabel}
                          </Text>
                        </Pressable>
                      </View>
                    ) : null}

                    <View style={styles.detailRow}>
                      <View style={styles.detailIconSlot}>
                        <MaterialCommunityIcons color={colors.textTertiary} name="clock-outline" size={17} />
                      </View>
                      <Text style={styles.detailSecondary}>{t('compare_open_24h')}</Text>
                    </View>
                  </View>
                </View>

                <Pressable onPress={() => hidePlaceInfoSheet()} style={styles.closeButton}>
                  <MaterialCommunityIcons color={colors.textSecondary} name="close" size={18} />
                </Pressable>
              </View>

              {isResolvingAddress ? <Text style={styles.loaderText}>{t('resolving_address')}</Text> : null}

              <PrimaryButton label={t('confirm_location')} onPress={handleConfirmSelection} style={styles.confirmButton} />
            </View>
          </Animated.View>
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
    alignItems: 'flex-end',
    zIndex: 1200,
    elevation: 1200
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
  currentLocationDot: {
    backgroundColor: '#1D4ED8',
    borderColor: colors.white,
    borderRadius: 6,
    borderWidth: 2,
    height: 12,
    width: 12
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
    position: 'absolute',
    right: 0,
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
