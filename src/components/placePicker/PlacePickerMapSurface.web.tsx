import { CSSProperties, useEffect, useRef } from 'react';
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
  const markerRef = useRef<any | null>(null);
  const currentLocationMarkerRef = useRef<any | null>(null);
  const leafletRef = useRef<any | null>(null);
  const mapTapStateRef = useRef({ isVisible: false, hasPlaceInfo: false });
  const onMapPressRef = useRef(onMapPress);
  const onMarkerPressRef = useRef(onMarkerPress);

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
        const module = await import('leaflet');
        const L = module.default;

        if (disposed || !mapNodeRef.current) {
          return;
        }

        leafletRef.current = L;

        const map = L.map(mapNodeRef.current, {
          zoomControl: false,
          attributionControl: false
        }).setView([initialCoordinates.latitude, initialCoordinates.longitude], 15);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        const marker = L.marker([initialCoordinates.latitude, initialCoordinates.longitude], {
          draggable: false,
          icon: L.divIcon({
            className: 'place-picker-pin',
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            html:
              '<div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:999px;background:#FF3B30;box-shadow:0 8px 16px rgba(0,0,0,0.2)"><span style="width:10px;height:10px;border-radius:999px;background:#fff"></span></div>'
          })
        }).addTo(map);

        marker.setOpacity(hasPlaceInfo ? 1 : 0);

        map.on('click', () => {
          onMapPressRef.current();
        });

        marker.on('click', (event: any) => {
          L.DomEvent.stopPropagation(event);
          if (!mapTapStateRef.current.hasPlaceInfo) {
            return;
          }
          onMarkerPressRef.current();
        });

        mapRef.current = map;
        markerRef.current = marker;

        if (currentLocationCoordinates) {
          currentLocationMarkerRef.current = L.circleMarker(
            [currentLocationCoordinates.latitude, currentLocationCoordinates.longitude],
            {
              radius: 6,
              color: '#1D4ED8',
              weight: 2,
              fillColor: '#1D4ED8',
              fillOpacity: 1
            }
          ).addTo(map);
        }

        window.requestAnimationFrame(() => {
          map.invalidateSize();
        });

        onMapError(null);
      } catch (error) {
        onMapError(error instanceof Error ? error.message : 'Map failed to load');
      }
    };

    void initMap();

    return () => {
      disposed = true;
      markerRef.current = null;
      currentLocationMarkerRef.current = null;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [initialCoordinates.latitude, initialCoordinates.longitude, onMapError, visible]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const map = mapRef.current;
    const marker = markerRef.current;

    if (!map || !marker) {
      return;
    }

    marker.setLatLng([coordinates.latitude, coordinates.longitude]);
    marker.setOpacity(hasPlaceInfo ? 1 : 0);

    map.invalidateSize();
    map.setView([coordinates.latitude, coordinates.longitude], map.getZoom() ?? 15, { animate: false });
  }, [coordinates, hasPlaceInfo, visible]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const map = mapRef.current;
    const L = leafletRef.current;

    if (!map || !L || !currentLocationCoordinates) {
      return;
    }

    if (currentLocationMarkerRef.current) {
      currentLocationMarkerRef.current.setLatLng([
        currentLocationCoordinates.latitude,
        currentLocationCoordinates.longitude
      ]);
      return;
    }

    currentLocationMarkerRef.current = L.circleMarker(
      [currentLocationCoordinates.latitude, currentLocationCoordinates.longitude],
      {
        radius: 6,
        color: '#1D4ED8',
        weight: 2,
        fillColor: '#1D4ED8',
        fillOpacity: 1
      }
    ).addTo(map);
  }, [currentLocationCoordinates, visible]);

  useEffect(() => {
    if (!visible || recenterRequestId === 0 || !recenterCoordinates) {
      return;
    }

    const map = mapRef.current;
    if (!map) {
      return;
    }

    map.setView([recenterCoordinates.latitude, recenterCoordinates.longitude], map.getZoom() ?? 15, {
      animate: true
    });
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
