import { useEffect } from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { PlacePickerStoreDependencies } from '../../model/placePickerModel';
import { PlacePickerStoreProvider } from '../../store/placePickerStoreContext';
import { usePlacePickerController } from '../usePlacePickerController';

const TOKYO_STATION = {
  latitude: 35.6812,
  longitude: 139.7671
};

const SHIBUYA = {
  latitude: 35.658,
  longitude: 139.7016
};

type ControllerSnapshot = ReturnType<typeof usePlacePickerController>;

type HarnessParams = {
  visible: boolean;
  initialCoordinates: typeof TOKYO_STATION;
  initialPlaceSelection?: {
    latitude: number;
    longitude: number;
    cityArea: string;
    addressLine?: string;
    suggestedStoreName?: string;
  };
  showPlaceInfoInitially?: boolean;
};

const createDependencies = (
  overrides: Partial<PlacePickerStoreDependencies> = {}
): PlacePickerStoreDependencies => {
  return {
    captureCurrentLocation: async () => ({ status: 'denied', message: 'denied' }),
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

const flushPromises = async () => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
};

const renderController = (
  params: HarnessParams,
  dependencies: PlacePickerStoreDependencies
) => {
  let latestValue: ControllerSnapshot | null = null;

  const Probe = () => {
    const controller = usePlacePickerController({
      ...params,
      notSelectedLabel: 'Not selected',
      onClose: () => {},
      onConfirm: () => {}
    });

    useEffect(() => {
      latestValue = controller;
    }, [controller]);

    return null;
  };

  let renderer: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(
      <PlacePickerStoreProvider dependencies={dependencies}>
        <Probe />
      </PlacePickerStoreProvider>
    );
  });

  const getValue = () => {
    if (!latestValue) {
      throw new Error('Controller snapshot is not ready yet.');
    }

    return latestValue;
  };

  return {
    getValue,
    unmount: () => {
      act(() => {
        renderer.unmount();
      });
    }
  };
};

describe('usePlacePickerController', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('debounces place search calls by 350ms', async () => {
    const searchPlaces = jest.fn(async () => []);
    const harness = renderController(
      {
        visible: true,
        initialCoordinates: TOKYO_STATION
      },
      createDependencies({ searchPlaces })
    );

    await flushPromises();

    act(() => {
      harness.getValue().setSearchQuery('tokyo coffee');
    });

    act(() => {
      jest.advanceTimersByTime(349);
    });
    expect(searchPlaces).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1);
    });
    await flushPromises();

    expect(searchPlaces).toHaveBeenCalledTimes(1);

    harness.unmount();
  });

  it('skips search requests when API mode is pin-only', async () => {
    const searchPlaces = jest.fn(async () => []);
    const harness = renderController(
      {
        visible: true,
        initialCoordinates: TOKYO_STATION
      },
      createDependencies({
        searchPlaces,
        getInitialPlacesApiStatus: () => ({ mode: 'pin-only', reason: 'missing-key' })
      })
    );

    await flushPromises();

    act(() => {
      harness.getValue().setSearchQuery('tokyo coffee');
      jest.advanceTimersByTime(400);
    });

    await flushPromises();

    expect(searchPlaces).not.toHaveBeenCalled();

    harness.unmount();
  });

  it('hydrates from top suggestion only once when initial place info is shown', async () => {
    const searchPlaces = jest.fn(async () => [
      {
        placeId: 'place-1',
        primaryText: 'Hydrated Place'
      }
    ]);
    const getPlaceDetails = jest.fn(async (placeId: string) => ({
      placeId,
      name: 'Hydrated Place',
      address: 'Hydrated Address',
      latitude: SHIBUYA.latitude,
      longitude: SHIBUYA.longitude,
      websiteUri: 'https://example.com'
    }));

    const harness = renderController(
      {
        visible: true,
        initialCoordinates: TOKYO_STATION,
        initialPlaceSelection: {
          latitude: TOKYO_STATION.latitude,
          longitude: TOKYO_STATION.longitude,
          cityArea: 'Tokyo',
          addressLine: 'Tokyo Station',
          suggestedStoreName: 'Hydrated Place'
        },
        showPlaceInfoInitially: true
      },
      createDependencies({ searchPlaces, getPlaceDetails })
    );

    await flushPromises();

    act(() => {
      jest.advanceTimersByTime(350);
    });
    await flushPromises();

    expect(getPlaceDetails).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(700);
    });
    await flushPromises();

    expect(getPlaceDetails).toHaveBeenCalledTimes(1);

    harness.unmount();
  });

  it('updates current-location state for success and denied flows', async () => {
    const captureCurrentLocation = jest
      .fn()
      .mockResolvedValueOnce({ status: 'denied', message: 'init denied' })
      .mockResolvedValueOnce({
        status: 'granted',
        coordinates: SHIBUYA,
        cityArea: 'Shibuya',
        addressLine: 'Shibuya Crossing'
      })
      .mockResolvedValueOnce({ status: 'denied', message: 'action denied' });

    const harness = renderController(
      {
        visible: true,
        initialCoordinates: TOKYO_STATION
      },
      createDependencies({ captureCurrentLocation })
    );

    await flushPromises();

    await act(async () => {
      await harness.getValue().handleUseCurrentLocation();
    });

    expect(harness.getValue().currentLocationCoordinates).toEqual(SHIBUYA);
    expect(harness.getValue().locationStatusMessage).toBeNull();

    await act(async () => {
      await harness.getValue().handleUseCurrentLocation();
    });

    expect(harness.getValue().locationStatusMessage).toBe('action denied');

    harness.unmount();
  });
});
