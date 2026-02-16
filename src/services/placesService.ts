import { env, hasGooglePlacesApiKey } from '../config/env';

export type PlacesPinOnlyReason = 'missing-key' | 'request-failed' | 'quota-exceeded' | 'request-denied';

export type PlacesApiStatus =
  | { mode: 'search-enabled' }
  | { mode: 'pin-only'; reason: PlacesPinOnlyReason };

export type PlaceSuggestion = {
  placeId: string;
  primaryText: string;
  secondaryText?: string;
};

export type PlaceDetails = {
  placeId: string;
  name?: string;
  address?: string;
  websiteUri?: string;
  latitude: number;
  longitude: number;
};

type AutocompletePrediction = {
  placeId?: string;
  text?: {
    text?: string;
  };
  structuredFormat?: {
    mainText?: {
      text?: string;
    };
    secondaryText?: {
      text?: string;
    };
  };
  place_id?: string;
  description?: string;
  structured_formatting?: {
    main_text?: string;
    secondary_text?: string;
  };
};

type PlacesErrorReason = Exclude<PlacesPinOnlyReason, 'missing-key'>;

export class PlacesApiError extends Error {
  reason: PlacesErrorReason;

  constructor(reason: PlacesErrorReason, message: string) {
    super(message);
    this.reason = reason;
  }
}

export const getInitialPlacesApiStatus = (): PlacesApiStatus => {
  return hasGooglePlacesApiKey() ? { mode: 'search-enabled' } : { mode: 'pin-only', reason: 'missing-key' };
};

export const mapPlacesStatusToReason = (status: string): PlacesErrorReason => {
  if (status === 'OVER_QUERY_LIMIT' || status === 'RESOURCE_EXHAUSTED') {
    return 'quota-exceeded';
  }
  if (status === 'REQUEST_DENIED') {
    return 'request-denied';
  }

  return 'request-failed';
};

const createSearchUrl = (query: string): string => {
  void query;
  return 'https://places.googleapis.com/v1/places:autocomplete';
};

const createDetailsUrl = (placeId: string): string => {
  const params = new URLSearchParams({
    languageCode: 'en'
  });
  return `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?${params.toString()}`;
};

const inferFailureReason = (statusCode: number, message?: string): PlacesErrorReason => {
  if (statusCode === 403) {
    return 'request-denied';
  }
  if (statusCode === 429) {
    return 'quota-exceeded';
  }
  if (message?.toLowerCase().includes('quota')) {
    return 'quota-exceeded';
  }
  return 'request-failed';
};

export const searchPlaces = async (query: string): Promise<PlaceSuggestion[]> => {
  const cleaned = query.trim();
  if (!cleaned) {
    return [];
  }

  if (!hasGooglePlacesApiKey()) {
    return [];
  }

  let response: Response;

  try {
    response = await fetch(createSearchUrl(cleaned), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': env.googlePlacesApiKey,
        'X-Goog-FieldMask':
          'suggestions.placePrediction.placeId,suggestions.placePrediction.text.text,suggestions.placePrediction.structuredFormat.mainText.text,suggestions.placePrediction.structuredFormat.secondaryText.text'
      },
      body: JSON.stringify({
        input: cleaned,
        languageCode: 'en',
        regionCode: 'JP'
      })
    });
  } catch (error) {
    throw new PlacesApiError('request-failed', error instanceof Error ? error.message : 'Network error');
  }

  if (!response.ok) {
    let message: string | undefined;
    try {
      const errorBody = await response.json();
      message = errorBody?.error?.message;
    } catch {
      message = undefined;
    }
    throw new PlacesApiError(
      inferFailureReason(response.status, message),
      message ?? `Search request failed (${response.status})`
    );
  }

  const body = await response.json();
  const predictions: AutocompletePrediction[] = Array.isArray(body?.suggestions)
    ? body.suggestions
        .map((item: { placePrediction?: AutocompletePrediction }) => item.placePrediction)
        .filter(Boolean)
    : [];

  return predictions
    .map((item) => ({
      placeId: String(item.placeId ?? item.place_id ?? ''),
      primaryText: String(
        item?.structuredFormat?.mainText?.text ??
          item?.text?.text ??
          item?.structured_formatting?.main_text ??
          item?.description ??
          ''
      ),
      secondaryText: item?.structuredFormat?.secondaryText?.text
        ? String(item.structuredFormat.secondaryText.text)
        : item?.structured_formatting?.secondary_text
          ? String(item.structured_formatting.secondary_text)
          : undefined
    }))
    .filter((item) => item.placeId && item.primaryText);
};

export const getPlaceDetails = async (placeId: string): Promise<PlaceDetails> => {
  if (!hasGooglePlacesApiKey()) {
    throw new PlacesApiError('request-failed', 'Places API key missing');
  }

  let response: Response;

  try {
    response = await fetch(createDetailsUrl(placeId), {
      method: 'GET',
      headers: {
        'X-Goog-Api-Key': env.googlePlacesApiKey,
        'X-Goog-FieldMask': 'id,displayName.text,formattedAddress,location,websiteUri'
      }
    });
  } catch (error) {
    throw new PlacesApiError('request-failed', error instanceof Error ? error.message : 'Network error');
  }

  if (!response.ok) {
    let message: string | undefined;
    try {
      const errorBody = await response.json();
      message = errorBody?.error?.message;
    } catch {
      message = undefined;
    }
    throw new PlacesApiError(
      inferFailureReason(response.status, message),
      message ?? `Details request failed (${response.status})`
    );
  }

  const body = await response.json();
  const latitude = Number(body?.location?.latitude);
  const longitude = Number(body?.location?.longitude);

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    throw new PlacesApiError('request-failed', 'Place details missing coordinates');
  }

  return {
    placeId,
    name: body?.displayName?.text ? String(body.displayName.text) : undefined,
    address: body?.formattedAddress ? String(body.formattedAddress) : undefined,
    websiteUri: body?.websiteUri ? String(body.websiteUri) : undefined,
    latitude,
    longitude
  };
};
