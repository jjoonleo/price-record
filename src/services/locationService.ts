import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { detectLanguage } from '../i18n/translations';
import { Coordinates } from '../types/domain';

export type LocationCaptureResult =
  | {
      status: 'granted';
      coordinates: Coordinates;
      cityArea: string;
      addressLine?: string;
    }
  | {
      status: 'denied';
      message: string;
    }
  | {
      status: 'error';
      message: string;
    };

const pickCityArea = (place: Location.LocationGeocodedAddress): string => {
  return (
    place.district ||
    place.subregion ||
    place.city ||
    place.region ||
    'Unknown area'
  );
};

const buildAddressLine = (place: Location.LocationGeocodedAddress): string | undefined => {
  const parts = [place.street, place.name].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : undefined;
};

const toStringIfDefined = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const pickCityAreaFromNominatim = (address: unknown): string | undefined => {
  if (!address || typeof address !== 'object' || address === null) {
    return undefined;
  }

  const typedAddress = address as Record<string, unknown>;
  return (
    toStringIfDefined(typedAddress.neighbourhood) ||
    toStringIfDefined(typedAddress.suburb) ||
    toStringIfDefined(typedAddress.city) ||
    toStringIfDefined(typedAddress.town) ||
    toStringIfDefined(typedAddress.village) ||
    toStringIfDefined(typedAddress.hamlet) ||
    toStringIfDefined(typedAddress.city_district) ||
    toStringIfDefined(typedAddress.county) ||
    toStringIfDefined(typedAddress.state) ||
    'Unknown area'
  );
};

const reverseGeocodeFallback = async (
  coordinates: Coordinates
): Promise<{ cityArea: string; addressLine?: string }> => {
  const query = new URLSearchParams({
    format: 'jsonv2',
    lat: String(coordinates.latitude),
    lon: String(coordinates.longitude),
    zoom: '18',
    addressdetails: '1'
  });

  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${query.toString()}`, {
    headers: {
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    return {
      cityArea: 'Unknown area'
    };
  }

  const body = await response.json();
  const cityArea = pickCityAreaFromNominatim(body?.address);

  return {
    cityArea,
    addressLine: body?.display_name ? toStringIfDefined(body.display_name) : undefined
  };
};

const buildGrantedResult = async (coordinates: Coordinates): Promise<LocationCaptureResult> => {
  try {
    const reverse = await reverseGeocodeToArea(coordinates);
    return {
      status: 'granted',
      coordinates,
      cityArea: reverse.cityArea,
      addressLine: reverse.addressLine
    };
  } catch {
    return {
      status: 'granted',
      coordinates,
      cityArea: 'Unknown area'
    };
  }
};

const tryBrowserGeolocation = async (): Promise<LocationCaptureResult | null> => {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return null;
  }

  const coordinates = await new Promise<Coordinates>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }),
      (error) => reject(error),
      {
        enableHighAccuracy: false,
        timeout: 12000,
        maximumAge: 60000
      }
    );
  });

  return buildGrantedResult(coordinates);
};

export const reverseGeocodeToArea = async (
  coordinates: Coordinates
): Promise<{ cityArea: string; addressLine?: string }> => {
  if (Platform.OS === 'web') {
    try {
      return await reverseGeocodeFallback(coordinates);
    } catch {
      return {
        cityArea: 'Unknown area'
      };
    }
  }

  const geocode = await Location.reverseGeocodeAsync(coordinates);
  const firstPlace = geocode[0];

  if (!firstPlace) {
    return {
      cityArea: 'Unknown area'
    };
  }

  return {
    cityArea: pickCityArea(firstPlace),
    addressLine: buildAddressLine(firstPlace)
  };
};

export const captureCurrentLocation = async (): Promise<LocationCaptureResult> => {
  const isKorean = detectLanguage() === 'ko';
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== 'granted') {
      try {
        const browserFallback = await tryBrowserGeolocation();
        if (browserFallback) {
          return browserFallback;
        }
      } catch {
        // fall through to denied message
      }

      return {
        status: 'denied',
        message: isKorean
          ? '위치 권한이 거부되었어요. 위치를 직접 선택해 주세요.'
          : 'Location permission denied. Please select location manually.'
      };
    }

    const current = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced
    });

    const coordinates = {
      latitude: current.coords.latitude,
      longitude: current.coords.longitude
    };
    return buildGrantedResult(coordinates);
  } catch (error) {
    try {
      const browserFallback = await tryBrowserGeolocation();
      if (browserFallback) {
        return browserFallback;
      }
    } catch {
      // keep original error message below
    }

    return {
      status: 'error',
      message: error instanceof Error ? error.message : isKorean ? '위치를 불러오지 못했어요.' : 'Failed to fetch location.'
    };
  }
};
