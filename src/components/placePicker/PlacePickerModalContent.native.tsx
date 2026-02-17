import { useEffect, useState } from 'react';
import { Animated, Keyboard, KeyboardEvent, Linking, Platform } from 'react-native';
import { Details, MapPressEvent, Region } from 'react-native-maps';
import { PlaceSuggestion } from '../../services/placesService';
import { Coordinates } from '../../types/domain';
import { PlacePickerConfirmAction } from './PlacePickerConfirmAction';
import { PlacePickerFloatingControls as PlacePickerFloatingControlsNative } from './PlacePickerFloatingControls.native';
import { PlacePickerInfoHeader } from './PlacePickerInfoHeader';
import { PlacePickerInfoSheet } from './PlacePickerInfoSheet';
import { PlacePickerMapLoadingOverlay } from './PlacePickerMapLoadingOverlay';
import { PlacePickerMapSurface as PlacePickerMapSurfaceNative } from './PlacePickerMapSurface.native';
import { PlacePickerModalShell } from './PlacePickerModalShell';
import { PlacePickerPlaceDetails } from './PlacePickerPlaceDetails';
import { PlacePickerSearchInputRow } from './PlacePickerSearchInputRow';
import { PlacePickerSearchOverlay } from './PlacePickerSearchOverlay';
import { PlacePickerStatusMessages } from './PlacePickerStatusMessages';
import { PlacePickerSuggestionPanel } from './PlacePickerSuggestionPanel';

type SheetLayoutEvent = {
  nativeEvent: {
    layout: {
      height: number;
    };
  };
};

type PlacePickerModalContentNativeProps = {
  visible: boolean;
  searchOverlayTop: number;
  isInitializingLocation: boolean;
  mapCenteringLabel: string;
  coordinates: Coordinates;
  currentLocationCoordinates: Coordinates | null;
  hasPlaceInfo: boolean;
  onMapPress: (event: MapPressEvent) => void;
  onMarkerPress: () => void;
  onMapPanDrag: () => void;
  onUserLocationChange: (coordinates: Coordinates) => void;
  onRegionChangeComplete: (region: Region, details?: Details) => void;
  mapRegion: Region;
  followsUserLocation: boolean;
  clearAccessibilityLabel: string;
  isSearchEnabled: boolean;
  isSearchFocused: boolean;
  onBackPress: () => void;
  onSearchBlur: () => void;
  onSearchChange: (query: string) => void;
  onSearchClear: () => void;
  onSearchFocus: () => void;
  onSearchSubmit: () => void;
  searchPlaceholder: string;
  searchQuery: string;
  fallbackMessage: string | null;
  locationStatusMessage: string | null;
  searchErrorMessage: string | null;
  suggestionApplyingLabel: string;
  isSearchLoading: boolean;
  isSearchPanelVisible: boolean;
  searchingPlacesLabel: string;
  onSuggestionPress: (suggestion: PlaceSuggestion) => void;
  onSuggestionPressIn: () => void;
  selectedSuggestionId: string | null;
  suggestions: PlaceSuggestion[];
  controlsBottomOffset: number;
  isLocatingCurrent: boolean;
  onRecenter: () => void;
  onUseCurrentLocation: () => void;
  controlsTranslateY: Animated.AnimatedInterpolation<number>;
  sheetBodyPaddingBottom: number;
  isPlaceInfoVisible: boolean;
  onSheetLayout: (event: SheetLayoutEvent) => void;
  sheetPanHandlers?: object;
  sheetTranslateY: Animated.Value;
  cityAreaLabel: string;
  onHidePlaceInfo: () => void;
  selectedPlaceTitle: string;
  addressLine?: string;
  noAddressLabel: string;
  websiteLabel: string | null;
  websiteUri?: string;
  confirmLabel: string;
  isResolvingAddress: boolean;
  onConfirm: () => void;
  resolvingLabel: string;
};

export const PlacePickerModalContentNative = ({
  visible,
  searchOverlayTop,
  isInitializingLocation,
  mapCenteringLabel,
  coordinates,
  currentLocationCoordinates,
  hasPlaceInfo,
  onMapPress,
  onMarkerPress,
  onMapPanDrag,
  onUserLocationChange,
  onRegionChangeComplete,
  mapRegion,
  followsUserLocation,
  clearAccessibilityLabel,
  isSearchEnabled,
  isSearchFocused,
  onBackPress,
  onSearchBlur,
  onSearchChange,
  onSearchClear,
  onSearchFocus,
  onSearchSubmit,
  searchPlaceholder,
  searchQuery,
  fallbackMessage,
  locationStatusMessage,
  searchErrorMessage,
  suggestionApplyingLabel,
  isSearchLoading,
  isSearchPanelVisible,
  searchingPlacesLabel,
  onSuggestionPress,
  onSuggestionPressIn,
  selectedSuggestionId,
  suggestions,
  controlsBottomOffset,
  isLocatingCurrent,
  onRecenter,
  onUseCurrentLocation,
  controlsTranslateY,
  sheetBodyPaddingBottom,
  isPlaceInfoVisible,
  onSheetLayout,
  sheetPanHandlers,
  sheetTranslateY,
  cityAreaLabel,
  onHidePlaceInfo,
  selectedPlaceTitle,
  addressLine,
  noAddressLabel,
  websiteLabel,
  websiteUri,
  confirmLabel,
  isResolvingAddress,
  onConfirm,
  resolvingLabel
}: PlacePickerModalContentNativeProps) => {
  const [androidKeyboardHeight, setAndroidKeyboardHeight] = useState(0);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    const showSubscription = Keyboard.addListener('keyboardDidShow', (event: KeyboardEvent) => {
      setAndroidKeyboardHeight(event.endCoordinates.height);
    });

    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setAndroidKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return (
    <PlacePickerModalShell visible={visible} edges={['left', 'right']}>
      {isInitializingLocation ? (
        <PlacePickerMapLoadingOverlay label={mapCenteringLabel} />
      ) : (
        <PlacePickerMapSurfaceNative
          coordinates={coordinates}
          currentLocationCoordinates={currentLocationCoordinates}
          hasPlaceInfo={hasPlaceInfo}
          onMapPress={onMapPress}
          onMarkerPress={onMarkerPress}
          onPanDrag={onMapPanDrag}
          onUserLocationChange={onUserLocationChange}
          onRegionChangeComplete={onRegionChangeComplete}
          region={mapRegion}
          followsUserLocation={followsUserLocation}
        />
      )}

      <PlacePickerSearchOverlay top={searchOverlayTop}>
        <PlacePickerSearchInputRow
          clearAccessibilityLabel={clearAccessibilityLabel}
          editable={isSearchEnabled}
          isFocused={isSearchFocused}
          onBackPress={onBackPress}
          onBlur={onSearchBlur}
          onChangeText={onSearchChange}
          onClear={onSearchClear}
          onFocus={onSearchFocus}
          onSubmitEditing={() => {
            if (Platform.OS === 'ios' || Platform.OS === 'android') {
              Keyboard.dismiss();
            }
            onSearchSubmit();
          }}
          placeholder={searchPlaceholder}
          value={searchQuery}
        />

        <PlacePickerStatusMessages
          fallbackMessage={fallbackMessage}
          locationStatusMessage={locationStatusMessage}
          searchErrorMessage={searchErrorMessage}
        />

        <PlacePickerSuggestionPanel
          applyingLabel={suggestionApplyingLabel}
          isLoading={isSearchLoading}
          isVisible={isSearchPanelVisible}
          loadingLabel={searchingPlacesLabel}
          onSuggestionPress={onSuggestionPress}
          onSuggestionPressIn={onSuggestionPressIn}
          selectedSuggestionId={selectedSuggestionId}
          suggestions={suggestions}
        />
      </PlacePickerSearchOverlay>

      <PlacePickerFloatingControlsNative
        bottomOffset={controlsBottomOffset}
        isLocatingCurrent={isLocatingCurrent}
        onRecenter={onRecenter}
        onUseCurrentLocation={onUseCurrentLocation}
        translateY={controlsTranslateY}
      />

      <PlacePickerInfoSheet
        bodyPaddingBottom={sheetBodyPaddingBottom}
        isVisible={isPlaceInfoVisible}
        keyboardOverlapOffset={androidKeyboardHeight}
        onLayout={onSheetLayout}
        panHandlers={sheetPanHandlers}
        translateY={sheetTranslateY}
      >
        <PlacePickerInfoHeader meta={cityAreaLabel} onClose={onHidePlaceInfo} title={selectedPlaceTitle} />

        <PlacePickerPlaceDetails
          addressLine={addressLine}
          cityAreaLabel={cityAreaLabel}
          noAddressLabel={noAddressLabel}
          onOpenWebsite={(uri) => {
            void Linking.openURL(uri);
          }}
          websiteLabel={websiteLabel}
          websiteUri={websiteUri}
        />

        <PlacePickerConfirmAction
          confirmLabel={confirmLabel}
          isResolvingAddress={isResolvingAddress}
          onConfirm={onConfirm}
          resolvingLabel={resolvingLabel}
        />
      </PlacePickerInfoSheet>
    </PlacePickerModalShell>
  );
};
