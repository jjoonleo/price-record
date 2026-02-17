import { PlacesApiError } from '../../../../services/placesService';
import { Coordinates } from '../../../../types/domain';
import { PlacePickerStoreDependencies } from '../../model/placePickerModel';
import { createPlacePickerStore } from '../createPlacePickerStore';

const TOKYO_STATION: Coordinates = {
  latitude: 35.6812,
  longitude: 139.7671
};

const SHIBUYA: Coordinates = {
  latitude: 35.658,
  longitude: 139.7016
};

const createDependencies = (
  overrides: Partial<PlacePickerStoreDependencies> = {}
): PlacePickerStoreDependencies => {
  return {
    captureCurrentLocation: async () => ({ status: 'denied', message: 'no-permission' }),
    reverseGeocodeToArea: async () => ({ cityArea: 'Shibuya', addressLine: 'Shibuya Crossing' }),
    searchPlaces: async () => [],
    getPlaceDetails: async (placeId: string) => ({
      placeId,
      name: 'Shibuya Store',
      address: 'Shibuya, Tokyo',
      latitude: SHIBUYA.latitude,
      longitude: SHIBUYA.longitude,
      websiteUri: 'https://example.com'
    }),
    getInitialPlacesApiStatus: () => ({ mode: 'search-enabled' }),
    ...overrides
  };
};

describe('createPlacePickerStore', () => {
  it('initializes from initial selection and current location', async () => {
    const deps = createDependencies({
      captureCurrentLocation: async () => ({
        status: 'granted',
        coordinates: SHIBUYA,
        cityArea: 'Shibuya',
        addressLine: 'Shibuya Crossing'
      })
    });

    const store = createPlacePickerStore(deps);

    await store.getState().initializeSession({
      initialCoordinates: TOKYO_STATION,
      initialPlaceSelection: {
        latitude: TOKYO_STATION.latitude,
        longitude: TOKYO_STATION.longitude,
        cityArea: 'Tokyo',
        addressLine: 'Tokyo Station',
        suggestedStoreName: 'Station Store'
      },
      showPlaceInfoInitially: true
    });

    const state = store.getState();

    expect(state.apiStatus).toEqual({ mode: 'search-enabled' });
    expect(state.coordinates).toEqual(TOKYO_STATION);
    expect(state.cityArea).toBe('Tokyo');
    expect(state.addressLine).toBe('Tokyo Station');
    expect(state.suggestedStoreName).toBe('Station Store');
    expect(state.initialSelectionQuery).toContain('Station Store');
    expect(state.currentLocationCoordinates).toEqual(SHIBUYA);
    expect(state.isInitializingLocation).toBe(false);
  });

  it('resets stale state on re-initialization', async () => {
    const store = createPlacePickerStore(createDependencies());

    await store.getState().initializeSession({
      initialCoordinates: TOKYO_STATION,
      initialPlaceSelection: {
        latitude: TOKYO_STATION.latitude,
        longitude: TOKYO_STATION.longitude,
        cityArea: 'Tokyo',
        addressLine: 'Tokyo Station',
        suggestedStoreName: 'Station Store'
      },
      showPlaceInfoInitially: true
    });

    store.getState().setSearchQuery('coffee');
    store.getState().markHydrationAttempted();

    await store.getState().initializeSession({
      initialCoordinates: SHIBUYA,
      showPlaceInfoInitially: false
    });

    const state = store.getState();

    expect(state.coordinates).toEqual(SHIBUYA);
    expect(state.searchQuery).toBe('');
    expect(state.cityArea).toBeNull();
    expect(state.addressLine).toBeUndefined();
    expect(state.suggestedStoreName).toBeUndefined();
    expect(state.didHydrateFromInitialSelection).toBe(false);
  });

  it('applies selected suggestion details and reverse geocode results', async () => {
    const store = createPlacePickerStore(createDependencies());

    await store.getState().initializeSession({
      initialCoordinates: TOKYO_STATION,
      showPlaceInfoInitially: false
    });

    await store.getState().selectSuggestion({
      placeId: 'place-1',
      primaryText: 'Shibuya Store'
    });

    const state = store.getState();

    expect(state.coordinates).toEqual(SHIBUYA);
    expect(state.cityArea).toBe('Shibuya');
    expect(state.addressLine).toBe('Shibuya, Tokyo');
    expect(state.suggestedStoreName).toBe('Shibuya Store');
    expect(state.websiteUri).toBe('https://example.com');
    expect(state.searchQuery).toBe('Shibuya Store');
    expect(state.selectedSuggestionId).toBeNull();
  });

  it('keeps best-effort suggestion data when details request fails', async () => {
    const store = createPlacePickerStore(
      createDependencies({
        getPlaceDetails: async () => {
          throw new Error('details failed');
        }
      })
    );

    await store.getState().initializeSession({
      initialCoordinates: TOKYO_STATION,
      showPlaceInfoInitially: false
    });

    await store.getState().selectSuggestion({
      placeId: 'place-2',
      primaryText: 'Fallback Store'
    });

    const state = store.getState();

    expect(state.suggestedStoreName).toBe('Fallback Store');
    expect(state.websiteUri).toBeUndefined();
    expect(state.searchQuery).toBe('Fallback Store');
    expect(state.selectedSuggestionId).toBeNull();
  });

  it('downgrades API mode on quota failures while searching', async () => {
    const store = createPlacePickerStore(
      createDependencies({
        searchPlaces: async () => {
          throw new PlacesApiError('quota-exceeded', 'quota exceeded');
        }
      })
    );

    await store.getState().initializeSession({
      initialCoordinates: TOKYO_STATION,
      showPlaceInfoInitially: false
    });

    store.getState().setSearchQuery('coffee');
    await store.getState().searchSuggestionsDebounced();

    const state = store.getState();

    expect(state.apiStatus).toEqual({ mode: 'pin-only', reason: 'quota-exceeded' });
    expect(state.searchErrorMessage).toBe('quota exceeded');
    expect(state.suggestions).toEqual([]);
    expect(state.isSearchLoading).toBe(false);
  });

  it('builds confirm payload with a stable city-area fallback', async () => {
    const store = createPlacePickerStore(createDependencies());

    await store.getState().initializeSession({
      initialCoordinates: TOKYO_STATION,
      showPlaceInfoInitially: false
    });

    const selection = store.getState().buildConfirmSelection('Not selected');

    expect(selection).toEqual({
      latitude: TOKYO_STATION.latitude,
      longitude: TOKYO_STATION.longitude,
      cityArea: 'Not selected',
      addressLine: undefined,
      suggestedStoreName: undefined
    });
  });

  it('resets overlay visibility from initialize session flags', async () => {
    const store = createPlacePickerStore(createDependencies());

    await store.getState().initializeSession({
      initialCoordinates: TOKYO_STATION,
      showPlaceInfoInitially: true
    });

    expect(store.getState().isPlaceInfoVisible).toBe(true);
    expect(store.getState().isSearchFocused).toBe(false);
    expect(store.getState().keepSuggestionPanelVisible).toBe(false);

    store.getState().focusSearch();
    store.getState().submitSearch();

    await store.getState().initializeSession({
      initialCoordinates: TOKYO_STATION,
      showPlaceInfoInitially: false
    });

    expect(store.getState().isPlaceInfoVisible).toBe(false);
    expect(store.getState().isSearchFocused).toBe(false);
    expect(store.getState().keepSuggestionPanelVisible).toBe(false);
  });

  it('reopens place info on selecting the same suggestion repeatedly', async () => {
    const store = createPlacePickerStore(createDependencies());

    await store.getState().initializeSession({
      initialCoordinates: TOKYO_STATION,
      showPlaceInfoInitially: false
    });

    const sameSuggestion = {
      placeId: 'place-1',
      primaryText: 'Shibuya Store'
    };

    await store.getState().selectSuggestion(sameSuggestion);
    expect(store.getState().isPlaceInfoVisible).toBe(true);

    store.getState().hidePlaceInfoSheet();
    expect(store.getState().isPlaceInfoVisible).toBe(false);

    await store.getState().selectSuggestion(sameSuggestion);
    expect(store.getState().isPlaceInfoVisible).toBe(true);
  });

  it('handles map tap suppression guard windows', () => {
    const store = createPlacePickerStore(createDependencies());

    store.getState().armSuggestionInteractionGuard(1_000, 350);

    expect(store.getState().shouldIgnoreMapTap(1_300)).toBe(true);
    expect(store.getState().shouldIgnoreMapTap(1_351)).toBe(false);
  });

  it('handles search ui focus/blur/submit/clear/hide transitions', async () => {
    const store = createPlacePickerStore(createDependencies());

    await store.getState().initializeSession({
      initialCoordinates: TOKYO_STATION,
      showPlaceInfoInitially: false
    });

    store.getState().focusSearch();
    expect(store.getState().isSearchFocused).toBe(true);
    expect(store.getState().keepSuggestionPanelVisible).toBe(false);

    store.getState().submitSearch();
    expect(store.getState().keepSuggestionPanelVisible).toBe(true);

    store.getState().clearSearchOverlay();
    expect(store.getState().keepSuggestionPanelVisible).toBe(false);

    store.getState().armSuggestionInteractionGuard(1_000);
    store.getState().blurSearch();
    expect(store.getState().isSearchFocused).toBe(true);
    expect(store.getState().suppressNextSearchBlur).toBe(false);

    store.getState().blurSearch();
    expect(store.getState().isSearchFocused).toBe(false);

    store.getState().focusSearch();
    store.getState().submitSearch();
    store.getState().hideSearchUi();
    expect(store.getState().isSearchFocused).toBe(false);
    expect(store.getState().keepSuggestionPanelVisible).toBe(false);
    expect(store.getState().suppressNextSearchBlur).toBe(false);
  });

  it('forces suggestion panel request false when api mode is pin-only', async () => {
    const store = createPlacePickerStore(
      createDependencies({
        getInitialPlacesApiStatus: () => ({ mode: 'pin-only', reason: 'missing-key' })
      })
    );

    await store.getState().initializeSession({
      initialCoordinates: TOKYO_STATION,
      showPlaceInfoInitially: false
    });

    store.getState().focusSearch();
    store.getState().submitSearch();

    const state = store.getState();
    const isSuggestionPanelRequested =
      state.apiStatus.mode === 'search-enabled' && (state.isSearchFocused || state.keepSuggestionPanelVisible);

    expect(isSuggestionPanelRequested).toBe(false);
  });
});
