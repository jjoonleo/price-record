import { env, hasGoogleMapsWebApiKey } from '../config/env';

export type GoogleMapsApi = {
  Map: new (node: Element, options?: object) => any;
  Marker: new (options?: object) => any;
  SymbolPath: {
    CIRCLE: unknown;
  };
  event: {
    clearInstanceListeners: (instance: object) => void;
  };
};

declare global {
  interface Window {
    google?: {
      maps?: GoogleMapsApi;
    };
  }
}

const GOOGLE_MAPS_SCRIPT_ID = 'google-maps-web-sdk';

let loadPromise: Promise<GoogleMapsApi> | null = null;

const buildGoogleMapsScriptUrl = (apiKey: string): string => {
  const params = new URLSearchParams({
    key: apiKey,
    v: 'weekly'
  });

  return `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
};

const getLoadedGoogleMaps = (): GoogleMapsApi | null => {
  const maps = window.google?.maps;
  return maps ?? null;
};

export const loadGoogleMapsApi = async (): Promise<GoogleMapsApi> => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('Google Maps is only available in a browser environment.');
  }

  const alreadyLoaded = getLoadedGoogleMaps();
  if (alreadyLoaded) {
    return alreadyLoaded;
  }

  if (!hasGoogleMapsWebApiKey()) {
    throw new Error('Google Maps web API key is missing. Set EXPO_PUBLIC_GOOGLE_MAPS_WEB_API_KEY.');
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise<GoogleMapsApi>((resolve, reject) => {
    const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID) as HTMLScriptElement | null;

    const handleLoad = () => {
      if (existingScript) {
        existingScript.setAttribute('data-gmaps-loaded', 'true');
      }

      const maps = getLoadedGoogleMaps();
      if (!maps) {
        loadPromise = null;
        reject(new Error('Google Maps loaded but window.google.maps is unavailable.'));
        return;
      }

      resolve(maps);
    };

    const handleError = () => {
      if (existingScript) {
        existingScript.setAttribute('data-gmaps-failed', 'true');
      }

      loadPromise = null;
      reject(new Error('Failed to load Google Maps JavaScript API.'));
    };

    if (existingScript) {
      if (existingScript.getAttribute('data-gmaps-failed') === 'true') {
        loadPromise = null;
        reject(new Error('Google Maps JavaScript API failed to load in a previous attempt.'));
        return;
      }

      if (existingScript.getAttribute('data-gmaps-loaded') === 'true') {
        handleLoad();
        return;
      }

      existingScript.addEventListener('load', handleLoad, { once: true });
      existingScript.addEventListener('error', handleError, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src = buildGoogleMapsScriptUrl(env.googleMapsWebApiKey);
    script.addEventListener(
      'load',
      () => {
        script.setAttribute('data-gmaps-loaded', 'true');
        handleLoad();
      },
      { once: true }
    );
    script.addEventListener(
      'error',
      () => {
        script.setAttribute('data-gmaps-failed', 'true');
        handleError();
      },
      { once: true }
    );
    document.head.appendChild(script);
  });

  return loadPromise;
};
