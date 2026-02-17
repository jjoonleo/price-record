const mockOpenURL = jest.fn<Promise<void>, [string]>();
let mockPlatformOs: 'android' | 'ios' | 'web' = 'android';

jest.mock('react-native', () => ({
  Linking: {
    openURL: (url: string) => mockOpenURL(url)
  },
  Platform: {
    get OS() {
      return mockPlatformOs;
    }
  }
}));

import { buildExternalRouteUris, openExternalRoute } from '../externalMapNavigation';

describe('buildExternalRouteUris', () => {
  beforeEach(() => {
    mockOpenURL.mockReset();
    mockPlatformOs = 'android';
  });

  it('builds Android intent URI first with transit mode', () => {
    const uris = buildExternalRouteUris(
      {
        latitude: 35.658,
        longitude: 139.7016
      },
      'android'
    );

    expect(uris[0]).toContain('intent://maps.google.com/maps?');
    expect(uris[0]).toContain('directionsmode=transit');
    expect(uris[1]).toContain('https://www.google.com/maps/dir/?');
    expect(uris[1]).toContain('travelmode=transit');
  });

  it('builds iOS Apple Maps URI with transit flag and Google fallback', () => {
    const uris = buildExternalRouteUris(
      {
        latitude: 35.658,
        longitude: 139.7016,
        mode: 'transit'
      },
      'ios'
    );

    expect(uris[0]).toContain('http://maps.apple.com/?');
    expect(uris[0]).toContain('dirflg=r');
    expect(uris[1]).toContain('https://www.google.com/maps/dir/?');
    expect(uris[1]).toContain('travelmode=transit');
  });

  it('builds universal Google directions URI for web', () => {
    const uris = buildExternalRouteUris(
      {
        latitude: 35.658,
        longitude: 139.7016,
        mode: 'transit'
      },
      'web'
    );

    expect(uris).toHaveLength(1);
    expect(uris[0]).toContain('https://www.google.com/maps/dir/?');
    expect(uris[0]).toContain('travelmode=transit');
  });

  it('returns empty list for invalid coordinates', () => {
    expect(
      buildExternalRouteUris(
        {
          latitude: Number.NaN,
          longitude: 139.7016,
          mode: 'transit'
        },
        'android'
      )
    ).toEqual([]);
  });
});

describe('openExternalRoute', () => {
  beforeEach(() => {
    mockOpenURL.mockReset();
    mockPlatformOs = 'android';
  });

  it('falls back to next URI when the first open fails', async () => {
    mockOpenURL.mockRejectedValueOnce(new Error('intent-failed')).mockResolvedValueOnce(undefined);

    await expect(
      openExternalRoute({
        latitude: 35.658,
        longitude: 139.7016
      })
    ).resolves.toBe(true);

    expect(mockOpenURL).toHaveBeenCalledTimes(2);
    expect(mockOpenURL.mock.calls[0]?.[0]).toContain('intent://maps.google.com/maps?');
    expect(mockOpenURL.mock.calls[1]?.[0]).toContain('https://www.google.com/maps/dir/?');
  });

  it('returns false when all open attempts fail', async () => {
    mockOpenURL.mockRejectedValue(new Error('all-failed'));

    await expect(
      openExternalRoute({
        latitude: 35.658,
        longitude: 139.7016
      })
    ).resolves.toBe(false);

    expect(mockOpenURL).toHaveBeenCalledTimes(2);
  });

  it('returns false and skips Linking when coordinates are invalid', async () => {
    await expect(
      openExternalRoute({
        latitude: Number.POSITIVE_INFINITY,
        longitude: 139.7016
      })
    ).resolves.toBe(false);

    expect(mockOpenURL).not.toHaveBeenCalled();
  });
});
