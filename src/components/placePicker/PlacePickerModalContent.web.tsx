import { Animated } from 'react-native';
import { PlaceSuggestion } from '../../services/placesService';
import { Coordinates } from '../../types/domain';
import { PlacePickerConfirmAction } from './PlacePickerConfirmAction';
import { PlacePickerFloatingControls as PlacePickerFloatingControlsWeb } from './PlacePickerFloatingControls.web';
import { PlacePickerInfoHeader } from './PlacePickerInfoHeader';
import { PlacePickerInfoSheet } from './PlacePickerInfoSheet';
import { PlacePickerMapErrorBanner } from './PlacePickerMapErrorBanner.web';
import { PlacePickerMapLoadingOverlay } from './PlacePickerMapLoadingOverlay';
import { PlacePickerMapSurface as PlacePickerMapSurfaceWeb } from './PlacePickerMapSurface.web';
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

type PlacePickerModalContentWebProps = {
  visible: boolean;
  coordinates: Coordinates;
  currentLocationCoordinates: Coordinates | null;
  hasPlaceInfo: boolean;
  initialCoordinates: Coordinates;
  isPlaceInfoVisible: boolean;
  onMapError: (message: string | null) => void;
  onMapPress: () => void;
  onMarkerPress: () => void;
  recenterCoordinates: Coordinates | null;
  recenterRequestId: number;
  isInitializingLocation: boolean;
  mapCenteringLabel: string;
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
  isLocatingCurrent: boolean;
  onUseCurrentLocation: () => void;
  controlsTranslateY: Animated.AnimatedInterpolation<number>;
  mapError: string | null;
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

export const PlacePickerModalContentWeb = ({
  visible,
  coordinates,
  currentLocationCoordinates,
  hasPlaceInfo,
  initialCoordinates,
  isPlaceInfoVisible,
  onMapError,
  onMapPress,
  onMarkerPress,
  recenterCoordinates,
  recenterRequestId,
  isInitializingLocation,
  mapCenteringLabel,
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
  isLocatingCurrent,
  onUseCurrentLocation,
  controlsTranslateY,
  mapError,
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
}: PlacePickerModalContentWebProps) => {
  return (
    <PlacePickerModalShell visible={visible} edges={['top', 'left', 'right', 'bottom']}>
      <PlacePickerMapSurfaceWeb
        coordinates={coordinates}
        currentLocationCoordinates={currentLocationCoordinates}
        hasPlaceInfo={hasPlaceInfo}
        initialCoordinates={initialCoordinates}
        isPlaceInfoVisible={isPlaceInfoVisible}
        onMapError={onMapError}
        onMapPress={onMapPress}
        onMarkerPress={onMarkerPress}
        recenterCoordinates={recenterCoordinates}
        recenterRequestId={recenterRequestId}
        visible={visible}
      />

      {isInitializingLocation ? (
        <PlacePickerMapLoadingOverlay absolute label={mapCenteringLabel} translucent />
      ) : null}

      <PlacePickerSearchOverlay>
        <PlacePickerSearchInputRow
          clearAccessibilityLabel={clearAccessibilityLabel}
          editable={isSearchEnabled}
          isFocused={isSearchFocused}
          onBackPress={onBackPress}
          onBlur={onSearchBlur}
          onChangeText={onSearchChange}
          onClear={onSearchClear}
          onFocus={onSearchFocus}
          onSubmitEditing={onSearchSubmit}
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
          isWeb
          loadingLabel={searchingPlacesLabel}
          onSuggestionPress={onSuggestionPress}
          onSuggestionPressIn={onSuggestionPressIn}
          selectedSuggestionId={selectedSuggestionId}
          suggestions={suggestions}
        />
      </PlacePickerSearchOverlay>

      <PlacePickerFloatingControlsWeb
        isLocatingCurrent={isLocatingCurrent}
        onUseCurrentLocation={onUseCurrentLocation}
        translateY={controlsTranslateY}
      />

      <PlacePickerMapErrorBanner message={mapError} />

      <PlacePickerInfoSheet
        isVisible={isPlaceInfoVisible}
        onLayout={onSheetLayout}
        panHandlers={sheetPanHandlers}
        translateY={sheetTranslateY}
        zIndex={1000}
      >
        <PlacePickerInfoHeader meta={cityAreaLabel} onClose={onHidePlaceInfo} title={selectedPlaceTitle} />

        <PlacePickerPlaceDetails
          addressLine={addressLine}
          cityAreaLabel={cityAreaLabel}
          noAddressLabel={noAddressLabel}
          onOpenWebsite={(uri) => {
            if (typeof window !== 'undefined') {
              window.open(uri, '_blank', 'noopener,noreferrer');
            }
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
