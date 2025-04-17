import React, { useEffect, useRef } from 'react';
import tt from '@tomtom-international/web-sdk-maps';
import '@tomtom-international/web-sdk-maps/dist/maps.css';
import * as turf from '@turf/turf';

const TomTomMap = ({ center, radius, onMapClick }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  // Init map
  useEffect(() => {
    mapInstance.current = tt.map({
      key: import.meta.env.VITE_TOMTOM_API_KEY,
      container: mapRef.current,
      center,
      zoom: 12,
    });

    mapInstance.current.addControl(new tt.NavigationControl());

    mapInstance.current.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      onMapClick({ lat, lon: lng });
    });

    return () => {
      mapInstance.current?.remove();
    };
  }, []);

  // Update map center
  useEffect(() => {
    if (mapInstance.current && center) {
      mapInstance.current.setCenter(center);
    }
  }, [center]);

  // Draw/Update radius circle
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
            'fill-color': '#1D4ED8',
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

  return <div ref={mapRef} style={{ width: '60vw', height: '80vh' }} />;
};

export default TomTomMap;
