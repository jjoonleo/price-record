import { useEffect, useMemo, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { PlacePickerModalContentWeb } from './placePicker/PlacePickerModalContent.web';
import { usePlacePickerSearchUiState } from './placePicker/hooks/usePlacePickerSearchUiState';
import { usePlacePickerSheetController } from './placePicker/hooks/usePlacePickerSheetController';
import { usePlacePickerController } from '../features/placePicker/hooks/usePlacePickerController';
import {
  buildFallbackMessage,
  formatWebsiteLabel
} from '../features/placePicker/model/placePickerModel';
import { PlacePickerStoreProvider } from '../features/placePicker/store/placePickerStoreContext';
import { useI18n } from '../i18n/useI18n';
import { Coordinates, PlaceSelection } from '../types/domain';

type PlacePickerModalProps = {
  visible: boolean;
  initialCoordinates: Coordinates;
  initialPlaceSelection?: PlaceSelection;
  showPlaceInfoInitially?: boolean;
  onClose: () => void;
  onConfirm: (selection: PlaceSelection) => void;
};

const PlacePickerModalBody = ({
  visible,
  initialCoordinates,
  initialPlaceSelection,
  showPlaceInfoInitially = false,
  onClose,
  onConfirm
}: PlacePickerModalProps) => {
  const { t } = useI18n();
  const notSelectedLabel = t('not_selected');
  const hasOpenedRef = useRef(false);
  const suppressMapTapUntilRef = useRef(0);
  const [recenterRequestId, setRecenterRequestId] = useState(0);
  const [recenterCoordinates, setRecenterCoordinates] = useState<Coordinates | null>(null);

  const {
    handleSearchBlur,
    handleSearchClear,
    handleSearchFocus,
    handleSearchSubmit,
    handleSuggestionPressIn,
    hideSearchUi,
    isSearchFocused,
    keepSuggestionPanelVisible,
    resetSearchUiForSession
  } = usePlacePickerSearchUiState();

  const {
    controlsTranslateY,
    handleSheetLayout,
    hidePlaceInfoSheet,
    isPlaceInfoVisible,
    resetSheetForSession,
    sheetPanHandlers,
    sheetTranslateY,
    showPlaceInfoSheet
  } = usePlacePickerSheetController({
    initialHiddenOffset: 420,
    useNativeDriver: false
  });

  const {
    apiStatus,
    searchQuery,
    suggestions,
    isSearchLoading,
    searchErrorMessage,
    selectedSuggestionId,
    coordinates,
    cityArea,
    addressLine,
    suggestedStoreName,
    websiteUri,
    currentLocationCoordinates,
    isInitializingLocation,
    isLocatingCurrent,
    isResolvingAddress,
    locationStatusMessage,
    mapError,
    setSearchQuery,
    clearSearchQuery,
    handleSuggestionSelect,
    handleUseCurrentLocation,
    handleConfirmSelection,
    setMapError
  } = usePlacePickerController({
    visible,
    initialCoordinates,
    initialPlaceSelection,
    showPlaceInfoInitially,
    notSelectedLabel,
    onClose,
    onConfirm,
    onSuggestionApplied: showPlaceInfoSheet
  });

  const cityAreaLabel = cityArea ?? notSelectedLabel;
  const hasPlaceInfo = useMemo(
    () =>
      Boolean(suggestedStoreName) ||
      Boolean(addressLine) ||
      Boolean(cityAreaLabel && cityAreaLabel !== notSelectedLabel),
    [addressLine, cityAreaLabel, notSelectedLabel, suggestedStoreName]
  );
  const fallbackMessage = useMemo(() => buildFallbackMessage(apiStatus, (key) => t(key)), [apiStatus, t]);

  useEffect(() => {
    if (!visible) {
      hasOpenedRef.current = false;
      return;
    }

    if (hasOpenedRef.current) {
      return;
    }

    hasOpenedRef.current = true;
    resetSearchUiForSession();
    resetSheetForSession(showPlaceInfoInitially);
  }, [resetSearchUiForSession, resetSheetForSession, showPlaceInfoInitially, visible]);

  const handleMapPress = () => {
    if (Date.now() < suppressMapTapUntilRef.current) {
      return;
    }

    if (isPlaceInfoVisible) {
      hidePlaceInfoSheet();
    }

    hideSearchUi();
  };

  const handleMarkerPress = () => {
    if (!hasPlaceInfo) {
      return;
    }

    hideSearchUi();
    showPlaceInfoSheet();
  };

  const handleUseCurrentLocationPress = async () => {
    const { currentLocationCoordinates: nextCoordinates, locationStatusMessage: nextLocationError } =
      await handleUseCurrentLocation();

    if (!nextCoordinates || nextLocationError) {
      return;
    }

    setRecenterCoordinates(nextCoordinates);
    setRecenterRequestId((prev) => prev + 1);
  };

  const isSearchPanelVisible =
    apiStatus.mode === 'search-enabled' && (isSearchFocused || keepSuggestionPanelVisible);

  return (
    <PlacePickerModalContentWeb
      addressLine={addressLine}
      cityAreaLabel={cityAreaLabel}
      clearAccessibilityLabel="Clear search"
      confirmLabel={t('confirm_location')}
      controlsTranslateY={controlsTranslateY}
      coordinates={coordinates}
      currentLocationCoordinates={currentLocationCoordinates}
      fallbackMessage={fallbackMessage}
      hasPlaceInfo={hasPlaceInfo}
      initialCoordinates={initialCoordinates}
      isInitializingLocation={isInitializingLocation}
      isLocatingCurrent={isLocatingCurrent}
      isPlaceInfoVisible={isPlaceInfoVisible}
      isResolvingAddress={isResolvingAddress}
      isSearchEnabled={apiStatus.mode === 'search-enabled'}
      isSearchFocused={isSearchFocused}
      isSearchLoading={isSearchLoading}
      isSearchPanelVisible={isSearchPanelVisible}
      locationStatusMessage={locationStatusMessage}
      mapCenteringLabel={t('map_centering')}
      mapError={mapError}
      noAddressLabel={t('no_address')}
      onBackPress={onClose}
      onConfirm={handleConfirmSelection}
      onHidePlaceInfo={() => hidePlaceInfoSheet()}
      onMapError={setMapError}
      onMapPress={handleMapPress}
      onMarkerPress={handleMarkerPress}
      onSearchBlur={handleSearchBlur}
      onSearchChange={setSearchQuery}
      onSearchClear={() => {
        clearSearchQuery();
        handleSearchClear();
      }}
      onSearchFocus={handleSearchFocus}
      onSearchSubmit={() => {
        hidePlaceInfoSheet();
        handleSearchSubmit();
      }}
      onSheetLayout={handleSheetLayout}
      onSuggestionPress={(suggestion) => {
        suppressMapTapUntilRef.current = Date.now() + 300;
        hideSearchUi();
        void handleSuggestionSelect(suggestion);
      }}
      onSuggestionPressIn={() => {
        suppressMapTapUntilRef.current = Date.now() + 300;
        handleSuggestionPressIn();
      }}
      onUseCurrentLocation={() => {
        void handleUseCurrentLocationPress();
      }}
      recenterCoordinates={recenterCoordinates}
      recenterRequestId={recenterRequestId}
      resolvingLabel={t('resolving_address')}
      searchErrorMessage={searchErrorMessage}
      searchPlaceholder={t('search_placeholder_short')}
      searchQuery={searchQuery}
      searchingPlacesLabel={t('searching_places')}
      selectedPlaceTitle={suggestedStoreName || t('selected_place')}
      selectedSuggestionId={selectedSuggestionId}
      sheetPanHandlers={sheetPanHandlers}
      sheetTranslateY={sheetTranslateY}
      suggestionApplyingLabel={t('applying')}
      suggestions={suggestions}
      visible={visible}
      websiteLabel={formatWebsiteLabel(websiteUri)}
      websiteUri={websiteUri}
    />
  );
};

export const PlacePickerModal = (props: PlacePickerModalProps) => {
  return (
    <PlacePickerStoreProvider>
      <PlacePickerModalBody {...props} />
    </PlacePickerStoreProvider>
  );
};
