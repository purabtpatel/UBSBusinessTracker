import React, { useEffect, useRef } from 'react';
import tt from '@tomtom-international/web-sdk-maps';
import '@tomtom-international/web-sdk-maps/dist/maps.css';
import * as turf from '@turf/turf';

const TomTomMap = ({ center, radius, onMapClick, pois = [] }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);

  // Initialize the map
  useEffect(() => {
    if (!mapRef.current) return; // Early exit if ref is not set

    mapInstance.current = tt.map({
      key: import.meta.env.VITE_TOMTOM_API_KEY,
      container: mapRef.current,
      center,
      zoom: 12,
    });

    mapInstance.current.addControl(new tt.NavigationControl());

    // Wait for the map style to load before proceeding
    mapInstance.current.on('load', () => {
      console.log('Map style loaded');

      // Add event listener for map clicks
      mapInstance.current.on('click', (e) => {
        const { lng, lat } = e.lngLat;
        onMapClick({ lat, lon: lng });
      });

    });

    return () => {
      mapInstance.current?.remove();
    };
  }, []);

  // Update map center
  useEffect(() => {
    if (mapInstance.current) {
      console.log('Updating center to:', center);
      mapInstance.current.setCenter(center);
    }
  }, [center]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !center || !radius) return;

    const drawCircle = () => {
      const circle = turf.circle(center, radius / 1000, {
        steps: 64,
        units: 'kilometers',
      });

      if (map.getLayer('radius-circle')) {
        map.getSource('radius-circle').setData(circle);
      } else {
        map.addSource('radius-circle', {
          type: 'geojson',
          data: circle,
        });

        map.addLayer({
          id: 'radius-circle',
          type: 'fill',
          source: 'radius-circle',
          paint: {
            'fill-color': '#1D4ED7',
            'fill-opacity': 0.2,
          },
        });
      }
    };

    if (map.isStyleLoaded()) {
      drawCircle();
    } else {
      map.once('load', drawCircle);
    }
  }, [center, radius]);

  // Add POI markers
  useEffect(() => {
    const map = mapInstance.current;

    // Remove existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    pois.forEach((poi) => {
      const { position, address, poi: poiInfo } = poi;
      if (!position) return;

      const marker = new tt.Marker()
        .setLngLat([position.lon, position.lat])
        .addTo(map);

      const encodedAddress = encodeURIComponent(address?.freeformAddress || poiInfo?.name || '');
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;

      marker.getElement().style.cursor = 'pointer';
      marker.getElement().addEventListener('click', () => {
        window.open(mapsUrl, '_blank');
      });

      markersRef.current.push(marker);
    });
  }, [pois]);

  return (
    <div
      ref={mapRef}
      className="tomtom-map"
      style={{ height: '84vh', width: '60vw' }}
    />
  );
};

export default TomTomMap;
