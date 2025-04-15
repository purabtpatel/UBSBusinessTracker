import React, { useEffect, useRef } from 'react';
import tt from '@tomtom-international/web-sdk-maps';
import '@tomtom-international/web-sdk-maps/dist/maps.css';


const TomTomMap = ({ center, onMapClick }) => {
  const mapRef = useRef();

  useEffect(() => {
    if (!tt) {
      console.error('TomTom SDK not loaded. Make sure you included the script in index.html.');
      return;
    }

    const map = tt.map({
      key: import.meta.env.VITE_TOMTOM_API_KEY,
      container: mapRef.current,
      center,
      zoom: 12,
    });

    map.addControl(new tt.NavigationControl());

    map.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      onMapClick({ lat, lon: lng });
    });

    return () => map.remove();
  }, [center]);

  return <div ref={mapRef} className="tomtom-map" />;
};

export default TomTomMap;
