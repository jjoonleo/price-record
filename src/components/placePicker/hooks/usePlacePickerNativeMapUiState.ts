import { useCallback, useEffect, useState } from 'react';
import { Keyboard } from 'react-native';
import { Region } from 'react-native-maps';
import { Coordinates } from '../../../types/domain';
import {
  isCloseToCoordinates,
  regionFromCoordinates,
  USER_TRACKING_MODES
} from '../placePickerMapUtils';

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
  const [userTrackingMode, setUserTrackingMode] = useState<number>(USER_TRACKING_MODES.none);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setMapRegion(regionFromCoordinates(coordinates));
  }, [coordinates, visible]);

  const clearTrackingMode = useCallback(() => {
    setUserTrackingMode(USER_TRACKING_MODES.none);
  }, []);

  const resetMapUiForSession = useCallback(
    (nextInitialCoordinates: Coordinates) => {
      setMapRegion(regionFromCoordinates(nextInitialCoordinates));
      clearTrackingMode();
    },
    [clearTrackingMode]
  );

  const handleMapPress = useCallback(() => {
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
    const regionBeforeRequest = mapRegion;
    const { currentLocationCoordinates: nextCoordinates, locationStatusMessage: nextLocationError } =
      await handleUseCurrentLocation();

    if (!nextCoordinates || nextLocationError) {
      return;
    }

    const isMapCenteredAtCurrentLocation = isCloseToCoordinates(
      { latitude: regionBeforeRequest.latitude, longitude: regionBeforeRequest.longitude },
      nextCoordinates
    );

    if (isMapCenteredAtCurrentLocation && userTrackingMode === USER_TRACKING_MODES.follow) {
      setUserTrackingMode(USER_TRACKING_MODES.followWithHeading);
    } else if (userTrackingMode !== USER_TRACKING_MODES.followWithHeading) {
      setUserTrackingMode(USER_TRACKING_MODES.follow);
    }

    setMapRegion(regionFromCoordinates(nextCoordinates));
  }, [handleUseCurrentLocation, mapRegion, userTrackingMode]);

  const handleRecenter = useCallback(() => {
    clearTrackingMode();
    setMapRegion(regionFromCoordinates(coordinates));
  }, [clearTrackingMode, coordinates]);

  return {
    clearTrackingMode,
    handleMapPress,
    handleMarkerPress,
    handleRecenter,
    handleUseCurrentLocationPress,
    mapRegion,
    resetMapUiForSession,
    setMapRegion,
    userTrackingMode
  };
};
