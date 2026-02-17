import { Linking, Platform } from 'react-native';

export type ExternalRouteMode = 'transit' | 'driving' | 'walking';

export type ExternalRouteInput = {
  latitude: number;
  longitude: number;
  label?: string;
  mode?: ExternalRouteMode;
};

const GOOGLE_TRAVEL_MODE: Record<ExternalRouteMode, string> = {
  transit: 'transit',
  driving: 'driving',
  walking: 'walking'
};

const APPLE_DIR_FLAG: Record<ExternalRouteMode, string> = {
  transit: 'r',
  driving: 'd',
  walking: 'w'
};

const isValidCoordinate = (value: number): boolean => Number.isFinite(value) && !Number.isNaN(value);

const toDestination = (latitude: number, longitude: number): string => `${latitude},${longitude}`;

const buildGoogleDirectionsUri = (destination: string, mode: ExternalRouteMode): string => {
  const params = new URLSearchParams({
    api: '1',
    destination,
    travelmode: GOOGLE_TRAVEL_MODE[mode]
  });

  return `https://www.google.com/maps/dir/?${params.toString()}`;
};

const buildAppleMapsUri = (destination: string, mode: ExternalRouteMode): string => {
  const params = new URLSearchParams({
    daddr: destination,
    dirflg: APPLE_DIR_FLAG[mode]
  });

  return `http://maps.apple.com/?${params.toString()}`;
};

const buildAndroidIntentUri = (destination: string, mode: ExternalRouteMode): string => {
  const params = new URLSearchParams({
    daddr: destination,
    directionsmode: GOOGLE_TRAVEL_MODE[mode]
  });

  return `intent://maps.google.com/maps?${params.toString()}#Intent;scheme=https;package=com.google.android.apps.maps;end`;
};

export const buildExternalRouteUris = (
  input: ExternalRouteInput,
  platformOverride?: 'android' | 'ios' | 'web'
): string[] => {
  const { latitude, longitude, mode = 'transit' } = input;
  if (!isValidCoordinate(latitude) || !isValidCoordinate(longitude)) {
    return [];
  }

  const destination = toDestination(latitude, longitude);
  const universalGoogleDirections = buildGoogleDirectionsUri(destination, mode);
  const platform = platformOverride ?? Platform?.OS ?? 'web';

  if (platform === 'android') {
    return [buildAndroidIntentUri(destination, mode), universalGoogleDirections];
  }

  if (platform === 'ios') {
    return [buildAppleMapsUri(destination, mode), universalGoogleDirections];
  }

  return [universalGoogleDirections];
};

export const openExternalRoute = async (input: ExternalRouteInput): Promise<boolean> => {
  const uris = buildExternalRouteUris(input);

  for (const uri of uris) {
    try {
      await Linking.openURL(uri);
      return true;
    } catch {
      // Try next candidate URI.
    }
  }

  return false;
};
