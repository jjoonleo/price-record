export const env = {
  googlePlacesApiKey: process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY?.trim() || ''
};

export const hasGooglePlacesApiKey = (): boolean => env.googlePlacesApiKey.length > 0;
