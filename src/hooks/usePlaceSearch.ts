import { useEffect, useState } from 'react';
import {
  PlaceSuggestion,
  PlacesApiError,
  PlacesApiStatus,
  searchPlaces
} from '../services/placesService';

type UsePlaceSearchResult = {
  suggestions: PlaceSuggestion[];
  isLoading: boolean;
  errorMessage: string | null;
};

export const usePlaceSearch = (
  query: string,
  apiStatus: PlacesApiStatus,
  onSearchFailure: (reason: 'request-failed' | 'quota-exceeded' | 'request-denied') => void
): UsePlaceSearchResult => {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (apiStatus.mode !== 'search-enabled') {
      setSuggestions([]);
      setIsLoading(false);
      setErrorMessage(null);
      return;
    }

    const trimmed = query.trim();
    if (!trimmed) {
      setSuggestions([]);
      setErrorMessage(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const nextSuggestions = await searchPlaces(trimmed);
        if (cancelled) {
          return;
        }

        setSuggestions(nextSuggestions);
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof PlacesApiError) {
          console.warn('[PlacesSearch] API error', {
            reason: error.reason,
            message: error.message,
            query: trimmed
          });
          onSearchFailure(error.reason);
          setErrorMessage(error.message);
        } else {
          console.warn('[PlacesSearch] Unknown search error', {
            query: trimmed,
            error
          });
          onSearchFailure('request-failed');
          setErrorMessage('Search is temporarily unavailable.');
        }

        setSuggestions([]);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [apiStatus.mode, onSearchFailure, query]);

  return {
    suggestions,
    isLoading,
    errorMessage
  };
};
