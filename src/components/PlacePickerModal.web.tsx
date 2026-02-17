import { useMemo, useState } from 'react';
import { PlacePickerModalContentWeb } from './placePicker/PlacePickerModalContent.web';
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
  const [recenterRequestId, setRecenterRequestId] = useState(0);
  const [recenterCoordinates, setRecenterCoordinates] = useState<Coordinates | null>(null);

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
    isPlaceInfoVisible,
    isSearchFocused,
    isSuggestionPanelRequested,
    setSearchQuery,
    clearSearchQuery,
    handleSuggestionSelect,
    handleUseCurrentLocation,
    handleConfirmSelection,
    setMapError,
    showPlaceInfoSheet,
    hidePlaceInfoSheet,
    focusSearch,
    blurSearch,
    submitSearch,
    clearSearchOverlay,
    hideSearchUi,
    armSuggestionInteractionGuard,
    shouldIgnoreMapTap
  } = usePlacePickerController({
    visible,
    initialCoordinates,
    initialPlaceSelection,
    showPlaceInfoInitially,
    notSelectedLabel,
    onClose,
    onConfirm
  });

  const {
    controlsTranslateY,
    handleSheetLayout,
    sheetPanHandlers,
    sheetTranslateY
  } = usePlacePickerSheetController({
    initialHiddenOffset: 420,
    useNativeDriver: false,
    isPlaceInfoVisible,
    showPlaceInfoSheet,
    hidePlaceInfoSheet
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

  const handleMapPress = () => {
    if (shouldIgnoreMapTap(Date.now())) {
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
      isSearchPanelVisible={isSuggestionPanelRequested}
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
      onSearchBlur={blurSearch}
      onSearchChange={setSearchQuery}
      onSearchClear={() => {
        clearSearchQuery();
        clearSearchOverlay();
      }}
      onSearchFocus={focusSearch}
      onSearchSubmit={() => {
        hidePlaceInfoSheet();
        submitSearch();
      }}
      onSheetLayout={handleSheetLayout}
      onSuggestionPress={(suggestion) => {
        hideSearchUi();
        void handleSuggestionSelect(suggestion);
      }}
      onSuggestionPressIn={() => {
        armSuggestionInteractionGuard(Date.now());
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
