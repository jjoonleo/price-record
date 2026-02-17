import { CSSProperties, useEffect, useRef } from 'react';
import { loadGoogleMapsApi } from '../../services/googleMapsWebLoader';
import { Coordinates } from '../../types/domain';

type PlacePickerMapSurfaceProps = {
  visible: boolean;
  initialCoordinates: Coordinates;
  coordinates: Coordinates;
  currentLocationCoordinates: Coordinates | null;
  hasPlaceInfo: boolean;
  isPlaceInfoVisible: boolean;
  onMapPress: () => void;
  onMarkerPress: () => void;
  onMapError: (message: string | null) => void;
  recenterRequestId: number;
  recenterCoordinates: Coordinates | null;
};

const toLatLng = (coordinates: Coordinates) => ({
  lat: coordinates.latitude,
  lng: coordinates.longitude
});

export const PlacePickerMapSurface = ({
  visible,
  initialCoordinates,
  coordinates,
  currentLocationCoordinates,
  hasPlaceInfo,
  isPlaceInfoVisible,
  onMapPress,
  onMarkerPress,
  onMapError,
  recenterRequestId,
  recenterCoordinates
}: PlacePickerMapSurfaceProps) => {
  const mapNodeRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any | null>(null);
  const selectedMarkerRef = useRef<any | null>(null);
  const currentLocationMarkerRef = useRef<any | null>(null);
  const mapsApiRef = useRef<any | null>(null);
  const mapTapStateRef = useRef({ isVisible: false, hasPlaceInfo: false });
  const onMapPressRef = useRef(onMapPress);
  const onMarkerPressRef = useRef(onMarkerPress);
  const currentLocationCoordinatesRef = useRef<Coordinates | null>(currentLocationCoordinates);

  currentLocationCoordinatesRef.current = currentLocationCoordinates;

  const syncCurrentLocationMarker = () => {
    const maps = mapsApiRef.current;
    const map = mapRef.current;

    if (!maps || !map) {
      return;
    }

    const nextCoordinates = currentLocationCoordinatesRef.current;

    if (!nextCoordinates) {
      if (currentLocationMarkerRef.current) {
        currentLocationMarkerRef.current.setMap(null);
        currentLocationMarkerRef.current = null;
      }
      return;
    }

    const nextPosition = toLatLng(nextCoordinates);

    if (currentLocationMarkerRef.current) {
      currentLocationMarkerRef.current.setPosition(nextPosition);
      return;
    }

    currentLocationMarkerRef.current = new maps.Marker({
      map,
      position: nextPosition,
      clickable: false,
      icon: {
        path: maps.SymbolPath.CIRCLE,
        fillColor: '#1D4ED8',
        fillOpacity: 1,
        scale: 6,
        strokeColor: '#FFFFFF',
        strokeWeight: 2
      }
    });
  };

  useEffect(() => {
    onMapPressRef.current = onMapPress;
    onMarkerPressRef.current = onMarkerPress;
  }, [onMapPress, onMarkerPress]);

  useEffect(() => {
    mapTapStateRef.current = {
      isVisible: isPlaceInfoVisible,
      hasPlaceInfo
    };
  }, [hasPlaceInfo, isPlaceInfoVisible]);

  useEffect(() => {
    if (!visible || !mapNodeRef.current || typeof window === 'undefined') {
      return;
    }

    let disposed = false;

    const initMap = async () => {
      try {
        const maps = await loadGoogleMapsApi();

        if (disposed || !mapNodeRef.current) {
          return;
        }

        const center = toLatLng(initialCoordinates);
        const map = new maps.Map(mapNodeRef.current, {
          center,
          zoom: 15,
          mapTypeId: 'roadmap',
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false
        });

        const selectedMarker = new maps.Marker({
          map,
          position: center,
          visible: hasPlaceInfo
        });

        selectedMarker.addListener('click', () => {
          if (!mapTapStateRef.current.hasPlaceInfo) {
            return;
          }

          onMarkerPressRef.current();
        });

        map.addListener('click', () => {
          onMapPressRef.current();
        });

        mapRef.current = map;
        selectedMarkerRef.current = selectedMarker;
        mapsApiRef.current = maps;
        syncCurrentLocationMarker();

        onMapError(null);
      } catch (error) {
        if (disposed) {
          return;
        }

        onMapError(error instanceof Error ? error.message : 'Map failed to load');
      }
    };

    void initMap();

    return () => {
      disposed = true;

      if (currentLocationMarkerRef.current) {
        currentLocationMarkerRef.current.setMap(null);
        currentLocationMarkerRef.current = null;
      }

      if (selectedMarkerRef.current) {
        selectedMarkerRef.current.setMap(null);
        selectedMarkerRef.current = null;
      }

      if (mapRef.current && mapsApiRef.current?.event) {
        mapsApiRef.current.event.clearInstanceListeners(mapRef.current);
      }

      mapRef.current = null;
      mapsApiRef.current = null;

      if (mapNodeRef.current) {
        mapNodeRef.current.innerHTML = '';
      }
    };
  }, [initialCoordinates.latitude, initialCoordinates.longitude, onMapError, visible]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const map = mapRef.current;
    const marker = selectedMarkerRef.current;

    if (!map || !marker) {
      return;
    }

    const nextPosition = toLatLng(coordinates);
    marker.setPosition(nextPosition);
    marker.setVisible(hasPlaceInfo);
    map.setCenter(nextPosition);
  }, [coordinates, hasPlaceInfo, visible]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    syncCurrentLocationMarker();
  }, [currentLocationCoordinates, visible]);

  useEffect(() => {
    if (!visible || recenterRequestId === 0 || !recenterCoordinates) {
      return;
    }

    const map = mapRef.current;
    if (!map) {
      return;
    }

    map.panTo(toLatLng(recenterCoordinates));
  }, [recenterCoordinates, recenterRequestId, visible]);

  return <div ref={mapNodeRef} style={mapStyle} />;
};

const mapStyle: CSSProperties = {
  bottom: 0,
  height: '100%',
  left: 0,
  position: 'absolute',
  right: 0,
  top: 0,
  width: '100%',
  zIndex: 0
};
