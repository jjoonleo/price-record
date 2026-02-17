import { useCallback, useEffect, useRef } from 'react';
import { shallow } from 'zustand/shallow';
import { PlaceSelection } from '../../../types/domain';
import {
  PLACE_SEARCH_DEBOUNCE_MS,
  PlacePickerSessionInput
} from '../model/placePickerModel';
import { placePickerSelectors } from '../store/placePickerSelectors';
import {
  usePlacePickerStoreApi,
  usePlacePickerStoreWithEquality
} from '../store/placePickerStoreContext';

type UsePlacePickerControllerParams = {
  visible: boolean;
  initialCoordinates: PlacePickerSessionInput['initialCoordinates'];
  initialPlaceSelection?: PlacePickerSessionInput['initialPlaceSelection'];
  showPlaceInfoInitially?: boolean;
  notSelectedLabel: string;
  onClose: () => void;
  onConfirm: (selection: PlaceSelection) => void;
  onSuggestionApplied?: () => void;
};

export const usePlacePickerController = ({
  visible,
  initialCoordinates,
  initialPlaceSelection,
  showPlaceInfoInitially = false,
  notSelectedLabel,
  onClose,
  onConfirm,
  onSuggestionApplied
}: UsePlacePickerControllerParams) => {
  const hasOpenedRef = useRef(false);
  const storeApi = usePlacePickerStoreApi();

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
    initialSelectionQuery,
    didHydrateFromInitialSelection,
    isPlaceInfoVisible,
    isSearchFocused,
    keepSuggestionPanelVisible,
    isSuggestionPanelRequested,
    initializeSession,
    setSearchQuery,
    clearSearchQuery,
    searchSuggestionsDebounced,
    selectSuggestion,
    useCurrentLocation,
    setMapError,
    markHydrationAttempted,
    buildConfirmSelection,
    showPlaceInfoSheet,
    hidePlaceInfoSheet,
    resetOverlayVisibility,
    focusSearch,
    blurSearch,
    submitSearch,
    clearSearchOverlay,
    hideSearchUi,
    armSuggestionInteractionGuard,
    shouldIgnoreMapTap
  } = usePlacePickerStoreWithEquality(
    (state) => ({
      apiStatus: placePickerSelectors.apiStatus(state),
      searchQuery: placePickerSelectors.searchQuery(state),
      suggestions: placePickerSelectors.suggestions(state),
      isSearchLoading: placePickerSelectors.isSearchLoading(state),
      searchErrorMessage: placePickerSelectors.searchErrorMessage(state),
      selectedSuggestionId: placePickerSelectors.selectedSuggestionId(state),
      coordinates: placePickerSelectors.coordinates(state),
      cityArea: placePickerSelectors.cityArea(state),
      addressLine: placePickerSelectors.addressLine(state),
      suggestedStoreName: placePickerSelectors.suggestedStoreName(state),
      websiteUri: placePickerSelectors.websiteUri(state),
      currentLocationCoordinates: placePickerSelectors.currentLocationCoordinates(state),
      isInitializingLocation: placePickerSelectors.isInitializingLocation(state),
      isLocatingCurrent: placePickerSelectors.isLocatingCurrent(state),
      isResolvingAddress: placePickerSelectors.isResolvingAddress(state),
      locationStatusMessage: placePickerSelectors.locationStatusMessage(state),
      mapError: placePickerSelectors.mapError(state),
      initialSelectionQuery: placePickerSelectors.initialSelectionQuery(state),
      didHydrateFromInitialSelection: placePickerSelectors.didHydrateFromInitialSelection(state),
      isPlaceInfoVisible: placePickerSelectors.isPlaceInfoVisible(state),
      isSearchFocused: placePickerSelectors.isSearchFocused(state),
      keepSuggestionPanelVisible: placePickerSelectors.keepSuggestionPanelVisible(state),
      isSuggestionPanelRequested: placePickerSelectors.isSuggestionPanelRequested(state),
      initializeSession: placePickerSelectors.initializeSession(state),
      setSearchQuery: placePickerSelectors.setSearchQuery(state),
      clearSearchQuery: placePickerSelectors.clearSearchQuery(state),
      searchSuggestionsDebounced: placePickerSelectors.searchSuggestionsDebounced(state),
      selectSuggestion: placePickerSelectors.selectSuggestion(state),
      useCurrentLocation: placePickerSelectors.useCurrentLocation(state),
      setMapError: placePickerSelectors.setMapError(state),
      markHydrationAttempted: placePickerSelectors.markHydrationAttempted(state),
      buildConfirmSelection: placePickerSelectors.buildConfirmSelection(state),
      showPlaceInfoSheet: placePickerSelectors.showPlaceInfoSheet(state),
      hidePlaceInfoSheet: placePickerSelectors.hidePlaceInfoSheet(state),
      resetOverlayVisibility: placePickerSelectors.resetOverlayVisibility(state),
      focusSearch: placePickerSelectors.focusSearch(state),
      blurSearch: placePickerSelectors.blurSearch(state),
      submitSearch: placePickerSelectors.submitSearch(state),
      clearSearchOverlay: placePickerSelectors.clearSearchOverlay(state),
      hideSearchUi: placePickerSelectors.hideSearchUi(state),
      armSuggestionInteractionGuard: placePickerSelectors.armSuggestionInteractionGuard(state),
      shouldIgnoreMapTap: placePickerSelectors.shouldIgnoreMapTap(state)
    }),
    shallow
  );

  useEffect(() => {
    if (!visible) {
      hasOpenedRef.current = false;
      resetOverlayVisibility(false);
      return;
    }

    if (hasOpenedRef.current) {
      return;
    }

    hasOpenedRef.current = true;
    void initializeSession({
      initialCoordinates,
      initialPlaceSelection,
      showPlaceInfoInitially
    });
  }, [initializeSession, initialCoordinates, initialPlaceSelection, resetOverlayVisibility, showPlaceInfoInitially, visible]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const timer = setTimeout(() => {
      void searchSuggestionsDebounced();
    }, PLACE_SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [apiStatus.mode, searchQuery, searchSuggestionsDebounced, visible]);

  const handleSuggestionSelect = useCallback(
    async (suggestion: (typeof suggestions)[number]) => {
      await selectSuggestion(suggestion);
      showPlaceInfoSheet();
      onSuggestionApplied?.();
    },
    [onSuggestionApplied, selectSuggestion, showPlaceInfoSheet]
  );

  useEffect(() => {
    if (!visible || !showPlaceInfoInitially || didHydrateFromInitialSelection) {
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

    markHydrationAttempted();
    void handleSuggestionSelect(topSuggestion);
  }, [
    didHydrateFromInitialSelection,
    handleSuggestionSelect,
    initialPlaceSelection,
    initialSelectionQuery,
    isSearchLoading,
    markHydrationAttempted,
    searchQuery,
    showPlaceInfoInitially,
    suggestions,
    visible
  ]);

  const handleUseCurrentLocation = useCallback(async () => {
    await useCurrentLocation();
    const nextState = storeApi.getState();

    return {
      currentLocationCoordinates: nextState.currentLocationCoordinates,
      locationStatusMessage: nextState.locationStatusMessage
    };
  }, [storeApi, useCurrentLocation]);

  const handleConfirmSelection = useCallback(() => {
    const selection = buildConfirmSelection(notSelectedLabel);
    onConfirm(selection);
    onClose();
  }, [buildConfirmSelection, notSelectedLabel, onClose, onConfirm]);

  return {
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
    keepSuggestionPanelVisible,
    isSuggestionPanelRequested,
    setSearchQuery,
    clearSearchQuery,
    handleSuggestionSelect,
    handleUseCurrentLocation,
    handleConfirmSelection,
    setMapError,
    showPlaceInfoSheet,
    hidePlaceInfoSheet,
    resetOverlayVisibility,
    focusSearch,
    blurSearch,
    submitSearch,
    clearSearchOverlay,
    hideSearchUi,
    armSuggestionInteractionGuard,
    shouldIgnoreMapTap
  };
};
