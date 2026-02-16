import { useEffect, useMemo, useRef } from 'react';
import { Dimensions, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PlacePickerModalContentNative } from './placePicker/PlacePickerModalContent.native';
import { usePlacePickerNativeMapUiState } from './placePicker/hooks/usePlacePickerNativeMapUiState';
import { usePlacePickerSearchUiState } from './placePicker/hooks/usePlacePickerSearchUiState';
import { usePlacePickerSheetController } from './placePicker/hooks/usePlacePickerSheetController';
import { usePlacePickerController } from '../features/placePicker/hooks/usePlacePickerController';
import {
  buildFallbackMessage,
  formatWebsiteLabel
} from '../features/placePicker/model/placePickerModel';
import { PlacePickerStoreProvider } from '../features/placePicker/store/placePickerStoreContext';
import { useI18n } from '../i18n/useI18n';
import { spacing } from '../theme/tokens';
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
  const insets = useSafeAreaInsets();
  const notSelectedLabel = t('not_selected');
  const hasOpenedRef = useRef(false);

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
    initialHiddenOffset: Dimensions.get('window').height,
    useNativeDriver: true
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
    setSearchQuery,
    clearSearchQuery,
    handleSuggestionSelect,
    handleUseCurrentLocation,
    handleConfirmSelection
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

  const fallbackMessage = useMemo(() => buildFallbackMessage(apiStatus, (key) => t(key)), [apiStatus, t]);
  const cityAreaLabel = cityArea ?? notSelectedLabel;
  const hasPlaceInfo = useMemo(
    () =>
      Boolean(suggestedStoreName) ||
      Boolean(addressLine) ||
      Boolean(cityAreaLabel && cityAreaLabel !== notSelectedLabel),
    [addressLine, cityAreaLabel, notSelectedLabel, suggestedStoreName]
  );

  const {
    clearTrackingMode,
    handleMapPress,
    handleMarkerPress,
    handleRecenter,
    handleUseCurrentLocationPress,
    mapRegion,
    resetMapUiForSession,
    setMapRegion,
    userTrackingMode
  } = usePlacePickerNativeMapUiState({
    coordinates,
    handleUseCurrentLocation,
    hasPlaceInfo,
    hidePlaceInfoSheet,
    hideSearchUi,
    initialCoordinates,
    isPlaceInfoVisible,
    showPlaceInfoSheet,
    visible
  });

  const controlsBottomOffset = useMemo(() => Math.max(spacing.md, insets.bottom + spacing.md), [insets.bottom]);
  const sheetBodyPaddingBottom = useMemo(() => Math.max(spacing.xl, insets.bottom + spacing.md), [insets.bottom]);

  useEffect(() => {
    if (!visible) {
      hasOpenedRef.current = false;
      return;
    }

    if (hasOpenedRef.current) {
      return;
    }

    hasOpenedRef.current = true;
    resetMapUiForSession(initialCoordinates);
    resetSearchUiForSession();
    resetSheetForSession(showPlaceInfoInitially);
  }, [
    initialCoordinates,
    resetMapUiForSession,
    resetSearchUiForSession,
    resetSheetForSession,
    showPlaceInfoInitially,
    visible
  ]);

  const isSearchPanelVisible =
    apiStatus.mode === 'search-enabled' && (isSearchFocused || keepSuggestionPanelVisible);

  return (
    <PlacePickerModalContentNative
      addressLine={addressLine}
      cityAreaLabel={cityAreaLabel}
      clearAccessibilityLabel="Clear search"
      confirmLabel={t('confirm_location')}
      controlsBottomOffset={controlsBottomOffset}
      controlsTranslateY={controlsTranslateY}
      coordinates={coordinates}
      currentLocationCoordinates={currentLocationCoordinates}
      fallbackMessage={fallbackMessage}
      hasPlaceInfo={hasPlaceInfo}
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
      mapRegion={mapRegion}
      noAddressLabel={t('no_address')}
      onBackPress={onClose}
      onConfirm={handleConfirmSelection}
      onHidePlaceInfo={() => hidePlaceInfoSheet()}
      onMapPanDrag={clearTrackingMode}
      onMapPress={handleMapPress}
      onMarkerPress={handleMarkerPress}
      onRecenter={handleRecenter}
      onRegionChangeComplete={setMapRegion}
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
        hideSearchUi();
        Keyboard.dismiss();
        void handleSuggestionSelect(suggestion);
      }}
      onSuggestionPressIn={handleSuggestionPressIn}
      onUseCurrentLocation={() => {
        void handleUseCurrentLocationPress();
      }}
      resolvingLabel={t('resolving_address')}
      searchErrorMessage={searchErrorMessage}
      searchOverlayTop={Math.max(insets.top + spacing.xs, spacing.md)}
      searchPlaceholder={t('search_placeholder_short')}
      searchQuery={searchQuery}
      searchingPlacesLabel={t('searching_places')}
      selectedPlaceTitle={suggestedStoreName || t('selected_place')}
      selectedSuggestionId={selectedSuggestionId}
      sheetBodyPaddingBottom={sheetBodyPaddingBottom}
      sheetPanHandlers={sheetPanHandlers}
      sheetTranslateY={sheetTranslateY}
      suggestionApplyingLabel={t('applying')}
      suggestions={suggestions}
      userTrackingMode={userTrackingMode}
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
