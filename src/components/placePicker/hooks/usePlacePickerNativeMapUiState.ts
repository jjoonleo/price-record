import { useCallback, useEffect, useState } from 'react';
import { Keyboard } from 'react-native';
import { Region } from 'react-native-maps';
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

  return {
    clearTrackingMode,
    handleMapPress,
    handleMarkerPress,
    handleRecenter,
    handleUseCurrentLocationPress,
    mapRegion,
    resetMapUiForSession,
    setMapRegion,
    followsUserLocation
  };
};
