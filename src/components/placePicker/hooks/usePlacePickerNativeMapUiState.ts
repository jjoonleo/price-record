import { useCallback, useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';
import { Details, MapPressEvent, Region } from 'react-native-maps';
import { Coordinates } from '../../../types/domain';
import { regionFromCoordinates } from '../placePickerMapUtils';

type UseCurrentLocationResult = {
  currentLocationCoordinates: Coordinates | null;
  locationStatusMessage: string | null;
};

type UsePlacePickerNativeMapUiStateParams = {
  initialCoordinates: Coordinates;
  coordinates: Coordinates;
  visible: boolean;
  hasPlaceInfo: boolean;
  isPlaceInfoVisible: boolean;
  hidePlaceInfoSheet: () => void;
  showPlaceInfoSheet: () => void;
  hideSearchUi: () => void;
  handleUseCurrentLocation: () => Promise<UseCurrentLocationResult>;
};

export const usePlacePickerNativeMapUiState = ({
  initialCoordinates,
  coordinates,
  visible,
  hasPlaceInfo,
  isPlaceInfoVisible,
  hidePlaceInfoSheet,
  showPlaceInfoSheet,
  hideSearchUi,
  handleUseCurrentLocation
}: UsePlacePickerNativeMapUiStateParams) => {
  const [mapRegion, setMapRegion] = useState<Region>(regionFromCoordinates(initialCoordinates));
  const [followsUserLocation, setFollowsUserLocation] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setMapRegion(regionFromCoordinates(coordinates));
  }, [coordinates, visible]);

  const clearTrackingMode = useCallback(() => {
    setFollowsUserLocation(false);
  }, []);

  const resetMapUiForSession = useCallback(
    (nextInitialCoordinates: Coordinates) => {
      setMapRegion(regionFromCoordinates(nextInitialCoordinates));
      clearTrackingMode();
    },
    [clearTrackingMode]
  );

  const handleMapPress = useCallback((_event: MapPressEvent) => {
    if (isPlaceInfoVisible) {
      hidePlaceInfoSheet();
    }

    hideSearchUi();
    clearTrackingMode();
    Keyboard.dismiss();
  }, [clearTrackingMode, hidePlaceInfoSheet, hideSearchUi, isPlaceInfoVisible]);

  const handleMarkerPress = useCallback(() => {
    if (!hasPlaceInfo) {
      return;
    }

    hideSearchUi();
    Keyboard.dismiss();
    showPlaceInfoSheet();
  }, [hasPlaceInfo, hideSearchUi, showPlaceInfoSheet]);

  const handleUseCurrentLocationPress = useCallback(async () => {
    const { currentLocationCoordinates: nextCoordinates, locationStatusMessage: nextLocationError } =
      await handleUseCurrentLocation();

    if (!nextCoordinates || nextLocationError) {
      return;
    }

    setFollowsUserLocation(true);
    setMapRegion(regionFromCoordinates(nextCoordinates));
  }, [handleUseCurrentLocation]);

  const handleRecenter = useCallback(() => {
    clearTrackingMode();
    setMapRegion(regionFromCoordinates(coordinates));
  }, [clearTrackingMode, coordinates]);

  const handleRegionChangeComplete = useCallback((nextRegion: Region, details?: Details) => {
    if (Platform.OS === 'android' && details?.isGesture === false) {
      return;
    }

    setMapRegion((previousRegion) => {
      const nextLatitude = Number.isFinite(nextRegion.latitude) ? nextRegion.latitude : previousRegion.latitude;
      const nextLongitude = Number.isFinite(nextRegion.longitude) ? nextRegion.longitude : previousRegion.longitude;
      const nextLatitudeDelta =
        Number.isFinite(nextRegion.latitudeDelta) && nextRegion.latitudeDelta > 0
          ? nextRegion.latitudeDelta
          : previousRegion.latitudeDelta;
      const nextLongitudeDelta =
        Number.isFinite(nextRegion.longitudeDelta) && nextRegion.longitudeDelta > 0
          ? nextRegion.longitudeDelta
          : previousRegion.longitudeDelta;

      const normalizedRegion: Region = {
        latitude: nextLatitude,
        longitude: nextLongitude,
        latitudeDelta: nextLatitudeDelta,
        longitudeDelta: nextLongitudeDelta
      };

      const hasMeaningfulChange =
        Math.abs(previousRegion.latitude - normalizedRegion.latitude) > 0.000001 ||
        Math.abs(previousRegion.longitude - normalizedRegion.longitude) > 0.000001 ||
        Math.abs(previousRegion.latitudeDelta - normalizedRegion.latitudeDelta) > 0.000001 ||
        Math.abs(previousRegion.longitudeDelta - normalizedRegion.longitudeDelta) > 0.000001;

      return hasMeaningfulChange ? normalizedRegion : previousRegion;
    });
  }, []);

  return {
    clearTrackingMode,
    handleMapPress,
    handleMarkerPress,
    handleRecenter,
    handleRegionChangeComplete,
    handleUseCurrentLocationPress,
    mapRegion,
    resetMapUiForSession,
    followsUserLocation
  };
};
