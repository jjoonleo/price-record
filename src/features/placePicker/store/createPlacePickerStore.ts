import { createStore } from 'zustand/vanilla';
import {
  captureCurrentLocation,
  reverseGeocodeToArea
} from '../../../services/locationService';
import {
  getInitialPlacesApiStatus,
  getPlaceDetails,
  PlacesApiError,
  searchPlaces
} from '../../../services/placesService';
import { Coordinates } from '../../../types/domain';
import {
  buildInitialSelectionQuery,
  parseCityAreaFromAddress,
  PlacePickerStoreDependencies,
  PlacePickerStoreState
} from '../model/placePickerModel';

const DEFAULT_COORDINATES: Coordinates = {
  latitude: 35.6812,
  longitude: 139.7671
};

const defaultDependencies: PlacePickerStoreDependencies = {
  captureCurrentLocation,
  reverseGeocodeToArea,
  searchPlaces,
  getPlaceDetails,
  getInitialPlacesApiStatus
};

const createInitialState = (): Omit<
  PlacePickerStoreState,
  | 'initializeSession'
  | 'setSearchQuery'
  | 'clearSearchQuery'
  | 'searchSuggestionsDebounced'
  | 'selectSuggestion'
  | 'useCurrentLocation'
  | 'setMapError'
  | 'markHydrationAttempted'
  | 'buildConfirmSelection'
  | 'showPlaceInfoSheet'
  | 'hidePlaceInfoSheet'
  | 'resetOverlayVisibility'
  | 'focusSearch'
  | 'blurSearch'
  | 'submitSearch'
  | 'clearSearchOverlay'
  | 'hideSearchUi'
  | 'armSuggestionInteractionGuard'
  | 'shouldIgnoreMapTap'
> => ({
  apiStatus: { mode: 'pin-only', reason: 'missing-key' },
  searchQuery: '',
  suggestions: [],
  isSearchLoading: false,
  searchErrorMessage: null,
  selectedSuggestionId: null,
  coordinates: DEFAULT_COORDINATES,
  cityArea: null,
  addressLine: undefined,
  suggestedStoreName: undefined,
  websiteUri: undefined,
  currentLocationCoordinates: null,
  isInitializingLocation: false,
  isLocatingCurrent: false,
  isResolvingAddress: false,
  locationStatusMessage: null,
  mapError: null,
  initialSelectionQuery: '',
  didHydrateFromInitialSelection: false,
  isPlaceInfoVisible: false,
  isSearchFocused: false,
  keepSuggestionPanelVisible: false,
  suppressNextSearchBlur: false,
  suppressMapTapUntilMs: 0
});

export const createPlacePickerStore = (
  dependencies: PlacePickerStoreDependencies = defaultDependencies
) => {
  let initializeRunId = 0;
  let searchRunId = 0;
  let selectRunId = 0;
  let locateRunId = 0;

  return createStore<PlacePickerStoreState>()((set, get) => ({
    ...createInitialState(),

    initializeSession: async (input) => {
      const runId = ++initializeRunId;
      const initialSelectionQuery = buildInitialSelectionQuery(input.initialPlaceSelection);

      set({
        apiStatus: dependencies.getInitialPlacesApiStatus(),
        searchQuery: input.initialPlaceSelection ? initialSelectionQuery : '',
        suggestions: [],
        isSearchLoading: false,
        searchErrorMessage: null,
        selectedSuggestionId: null,
        coordinates: input.initialCoordinates,
        cityArea: input.initialPlaceSelection?.cityArea ?? null,
        addressLine: input.initialPlaceSelection?.addressLine,
        suggestedStoreName: input.initialPlaceSelection?.suggestedStoreName,
        websiteUri: undefined,
        currentLocationCoordinates: null,
        isInitializingLocation: true,
        isLocatingCurrent: false,
        isResolvingAddress: false,
        locationStatusMessage: null,
        mapError: null,
        initialSelectionQuery,
        didHydrateFromInitialSelection: false,
        isPlaceInfoVisible: input.showPlaceInfoInitially,
        isSearchFocused: false,
        keepSuggestionPanelVisible: false,
        suppressNextSearchBlur: false,
        suppressMapTapUntilMs: 0
      });

      try {
        const locationResult = await dependencies.captureCurrentLocation();
        if (runId !== initializeRunId) {
          return;
        }

        if (locationResult.status === 'granted') {
          set({ currentLocationCoordinates: locationResult.coordinates });
        }

        if (!input.initialPlaceSelection) {
          set({
            cityArea: null,
            addressLine: undefined,
            suggestedStoreName: undefined,
            searchQuery: '',
            initialSelectionQuery: ''
          });
          return;
        }

        const missingAddressInfo =
          !input.initialPlaceSelection.addressLine || !input.initialPlaceSelection.cityArea;

        if (!missingAddressInfo) {
          return;
        }

        set({ isResolvingAddress: true });

        try {
          const reverse = await dependencies.reverseGeocodeToArea(input.initialCoordinates);
          if (runId !== initializeRunId) {
            return;
          }

          set({
            cityArea: input.initialPlaceSelection.cityArea ?? reverse.cityArea,
            addressLine: input.initialPlaceSelection.addressLine ?? reverse.addressLine
          });
        } catch {
          if (runId !== initializeRunId) {
            return;
          }

          set({
            cityArea: input.initialPlaceSelection.cityArea ?? null,
            addressLine: input.initialPlaceSelection.addressLine
          });
        } finally {
          if (runId === initializeRunId) {
            set({ isResolvingAddress: false });
          }
        }
      } finally {
        if (runId === initializeRunId) {
          set({ isInitializingLocation: false });
        }
      }
    },

    setSearchQuery: (query) => {
      const nextQuery = query;
      if (!nextQuery.trim()) {
        set({
          searchQuery: nextQuery,
          suggestions: [],
          searchErrorMessage: null,
          isSearchLoading: false
        });
        return;
      }

      set({ searchQuery: nextQuery });
    },

    clearSearchQuery: () => {
      set({
        searchQuery: '',
        suggestions: [],
        searchErrorMessage: null,
        isSearchLoading: false
      });
    },

    searchSuggestionsDebounced: async () => {
      const state = get();
      if (state.apiStatus.mode !== 'search-enabled') {
        set({
          suggestions: [],
          isSearchLoading: false,
          searchErrorMessage: null
        });
        return;
      }

      const trimmed = state.searchQuery.trim();
      if (!trimmed) {
        set({
          suggestions: [],
          isSearchLoading: false,
          searchErrorMessage: null
        });
        return;
      }

      const runId = ++searchRunId;
      set({ isSearchLoading: true, searchErrorMessage: null });

      try {
        const nextSuggestions = await dependencies.searchPlaces(trimmed);
        if (runId !== searchRunId) {
          return;
        }

        set({ suggestions: nextSuggestions });
      } catch (error) {
        if (runId !== searchRunId) {
          return;
        }

        if (error instanceof PlacesApiError) {
          if (error.reason === 'quota-exceeded' || error.reason === 'request-denied') {
            set({ apiStatus: { mode: 'pin-only', reason: error.reason } });
          }

          set({
            searchErrorMessage: error.message,
            suggestions: []
          });
        } else {
          set({
            searchErrorMessage: 'Search is temporarily unavailable.',
            suggestions: []
          });
        }
      } finally {
        if (runId === searchRunId) {
          set({ isSearchLoading: false });
        }
      }
    },

    selectSuggestion: async (suggestion) => {
      const runId = ++selectRunId;

      set({
        selectedSuggestionId: suggestion.placeId,
        searchErrorMessage: null
      });

      try {
        const details = await dependencies.getPlaceDetails(suggestion.placeId);
        if (runId !== selectRunId) {
          return;
        }

        const nextCoordinates = {
          latitude: details.latitude,
          longitude: details.longitude
        };

        set({
          coordinates: nextCoordinates,
          suggestedStoreName: details.name || suggestion.primaryText,
          websiteUri: details.websiteUri,
          isResolvingAddress: true
        });

        let resolvedAddressLine = details.address;
        let resolvedCityArea = parseCityAreaFromAddress(details.address) ?? null;

        try {
          const reverse = await dependencies.reverseGeocodeToArea(nextCoordinates);
          if (runId !== selectRunId) {
            return;
          }

          resolvedCityArea = reverse.cityArea ?? resolvedCityArea;
          resolvedAddressLine = details.address || reverse.addressLine;
        } catch {
          // Keep best-effort values from place details.
        }

        if (runId !== selectRunId) {
          return;
        }

        set({
          cityArea: resolvedCityArea,
          addressLine: resolvedAddressLine,
          searchQuery: suggestion.primaryText,
          isPlaceInfoVisible: true,
          isSearchFocused: false,
          keepSuggestionPanelVisible: false,
          suppressNextSearchBlur: false
        });
      } catch {
        if (runId !== selectRunId) {
          return;
        }

        set({
          suggestedStoreName: suggestion.primaryText,
          websiteUri: undefined,
          searchQuery: suggestion.primaryText,
          isPlaceInfoVisible: true,
          isSearchFocused: false,
          keepSuggestionPanelVisible: false,
          suppressNextSearchBlur: false
        });
      } finally {
        if (runId === selectRunId) {
          set({
            selectedSuggestionId: null,
            isResolvingAddress: false
          });
        }
      }
    },

    useCurrentLocation: async () => {
      const runId = ++locateRunId;

      set({
        isLocatingCurrent: true,
        locationStatusMessage: null
      });

      try {
        const locationResult = await dependencies.captureCurrentLocation();
        if (runId !== locateRunId) {
          return;
        }

        if (locationResult.status === 'granted') {
          set({
            currentLocationCoordinates: locationResult.coordinates,
            locationStatusMessage: null
          });
          return;
        }

        set({ locationStatusMessage: locationResult.message });
      } finally {
        if (runId === locateRunId) {
          set({ isLocatingCurrent: false });
        }
      }
    },

    setMapError: (message) => {
      set({ mapError: message });
    },

    markHydrationAttempted: () => {
      set({ didHydrateFromInitialSelection: true });
    },

    buildConfirmSelection: (notSelectedLabel) => {
      const state = get();
      return {
        latitude: state.coordinates.latitude,
        longitude: state.coordinates.longitude,
        cityArea: state.cityArea && state.cityArea.trim().length > 0 ? state.cityArea : notSelectedLabel,
        addressLine: state.addressLine,
        suggestedStoreName: state.suggestedStoreName
      };
    },

    showPlaceInfoSheet: () => {
      set({ isPlaceInfoVisible: true });
    },

    hidePlaceInfoSheet: () => {
      set({ isPlaceInfoVisible: false });
    },

    resetOverlayVisibility: (showPlaceInfoInitially) => {
      set({
        isPlaceInfoVisible: showPlaceInfoInitially,
        isSearchFocused: false,
        keepSuggestionPanelVisible: false,
        suppressNextSearchBlur: false,
        suppressMapTapUntilMs: 0
      });
    },

    focusSearch: () => {
      const state = get();
      if (state.apiStatus.mode !== 'search-enabled') {
        return;
      }

      set({
        isSearchFocused: true,
        keepSuggestionPanelVisible: false
      });
    },

    blurSearch: () => {
      const state = get();
      if (state.suppressNextSearchBlur) {
        set({ suppressNextSearchBlur: false });
        return;
      }

      set({ isSearchFocused: false });
    },

    submitSearch: () => {
      const state = get();
      if (state.apiStatus.mode !== 'search-enabled') {
        return;
      }

      set({ keepSuggestionPanelVisible: true });
    },

    clearSearchOverlay: () => {
      set({ keepSuggestionPanelVisible: false });
    },

    hideSearchUi: () => {
      set({
        isSearchFocused: false,
        keepSuggestionPanelVisible: false,
        suppressNextSearchBlur: false
      });
    },

    armSuggestionInteractionGuard: (nowMs, durationMs = 350) => {
      set({
        suppressNextSearchBlur: true,
        suppressMapTapUntilMs: nowMs + durationMs
      });
    },

    shouldIgnoreMapTap: (nowMs) => {
      return nowMs < get().suppressMapTapUntilMs;
    }
  }));
};

export type PlacePickerStoreApi = ReturnType<typeof createPlacePickerStore>;
