export const Accuracy = {
  Balanced: 3,
};

export const requestForegroundPermissionsAsync = async () => {
  return { status: 'denied' as const };
};

export const getCurrentPositionAsync = async () => {
  return {
    coords: {
      latitude: 35.6812,
      longitude: 139.7671,
    },
  };
};

export const reverseGeocodeAsync = async () => {
  return [];
};
