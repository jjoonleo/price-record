import { LocationCaptureResult } from '../../../services/locationService';
import {
  PlaceDetails,
  PlaceSuggestion,
  PlacesApiStatus,
  PlacesPinOnlyReason
} from '../../../services/placesService';
import { Coordinates, PlaceSelection } from '../../../types/domain';

export const PLACE_SEARCH_DEBOUNCE_MS = 350;

export type PlacePickerSessionInput = {
  initialCoordinates: Coordinates;
  initialPlaceSelection?: PlaceSelection;
  showPlaceInfoInitially: boolean;
};

export type PlacePickerFeatureState = {
  apiStatus: PlacesApiStatus;
  searchQuery: string;
  suggestions: PlaceSuggestion[];
  isSearchLoading: boolean;
  searchErrorMessage: string | null;
  selectedSuggestionId: string | null;
  coordinates: Coordinates;
  cityArea: string | null;
  addressLine?: string;
  suggestedStoreName?: string;
  websiteUri?: string;
  currentLocationCoordinates: Coordinates | null;
  isInitializingLocation: boolean;
  isLocatingCurrent: boolean;
  isResolvingAddress: boolean;
  locationStatusMessage: string | null;
  mapError: string | null;
  initialSelectionQuery: string;
  didHydrateFromInitialSelection: boolean;
  isPlaceInfoVisible: boolean;
  isSearchFocused: boolean;
  keepSuggestionPanelVisible: boolean;
  suppressNextSearchBlur: boolean;
  suppressMapTapUntilMs: number;
};

export type PlacePickerFeatureActions = {
  initializeSession: (input: PlacePickerSessionInput) => Promise<void>;
  setSearchQuery: (query: string) => void;
  clearSearchQuery: () => void;
  searchSuggestionsDebounced: () => Promise<void>;
  selectSuggestion: (suggestion: PlaceSuggestion) => Promise<void>;
  useCurrentLocation: () => Promise<void>;
  setMapError: (message: string | null) => void;
  markHydrationAttempted: () => void;
  buildConfirmSelection: (notSelectedLabel: string) => PlaceSelection;
  showPlaceInfoSheet: () => void;
  hidePlaceInfoSheet: () => void;
  resetOverlayVisibility: (showPlaceInfoInitially: boolean) => void;
  focusSearch: () => void;
  blurSearch: () => void;
  submitSearch: () => void;
  clearSearchOverlay: () => void;
  hideSearchUi: () => void;
  armSuggestionInteractionGuard: (nowMs: number, durationMs?: number) => void;
  shouldIgnoreMapTap: (nowMs: number) => boolean;
};

export type PlacePickerStoreState = PlacePickerFeatureState & PlacePickerFeatureActions;

export type PlacePickerStoreDependencies = {
  captureCurrentLocation: () => Promise<LocationCaptureResult>;
  reverseGeocodeToArea: (coordinates: Coordinates) => Promise<{ cityArea: string; addressLine?: string }>;
  searchPlaces: (query: string) => Promise<PlaceSuggestion[]>;
  getPlaceDetails: (placeId: string) => Promise<PlaceDetails>;
  getInitialPlacesApiStatus: () => PlacesApiStatus;
};

export const buildInitialSelectionQuery = (initialPlaceSelection?: PlaceSelection): string => {
  return [initialPlaceSelection?.suggestedStoreName, initialPlaceSelection?.addressLine, initialPlaceSelection?.cityArea]
    .filter((value): value is string => Boolean(value))
    .join(', ');
};

export const parseCityAreaFromAddress = (address?: string): string | undefined => {
  if (!address) {
    return undefined;
  }

  const parts = address
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return undefined;
  }

  if (parts.length === 1) {
    return parts[0];
  }

  return parts[parts.length - 2];
};

export const formatWebsiteLabel = (websiteUri?: string): string | null => {
  if (!websiteUri) {
    return null;
  }

  try {
    return new URL(websiteUri).hostname.replace(/^www\./u, '');
  } catch {
    return null;
  }
};

export const buildFallbackMessage = (
  apiStatus: PlacesApiStatus,
  t: (key: 'search_missing_key' | 'search_quota' | 'search_denied' | 'search_unavailable') => string
): string | null => {
  if (apiStatus.mode !== 'pin-only') {
    return null;
  }

  const keyByReason: Record<PlacesPinOnlyReason, 'search_missing_key' | 'search_quota' | 'search_denied' | 'search_unavailable'> = {
    'missing-key': 'search_missing_key',
    'quota-exceeded': 'search_quota',
    'request-denied': 'search_denied',
    'request-failed': 'search_unavailable'
  };

  return t(keyByReason[apiStatus.reason]);
};
