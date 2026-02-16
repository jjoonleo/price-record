import {
  mapPlacesStatusToReason,
  searchPlaces
} from '../placesService';

describe('mapPlacesStatusToReason', () => {
  it('maps quota statuses to quota-exceeded', () => {
    expect(mapPlacesStatusToReason('OVER_QUERY_LIMIT')).toBe('quota-exceeded');
    expect(mapPlacesStatusToReason('RESOURCE_EXHAUSTED')).toBe('quota-exceeded');
  });

  it('maps denied status to request-denied', () => {
    expect(mapPlacesStatusToReason('REQUEST_DENIED')).toBe('request-denied');
  });

  it('maps other statuses to request-failed', () => {
    expect(mapPlacesStatusToReason('INVALID_REQUEST')).toBe('request-failed');
  });
});

describe('searchPlaces', () => {
  it('returns empty array for blank query', async () => {
    await expect(searchPlaces('')).resolves.toEqual([]);
  });
});
