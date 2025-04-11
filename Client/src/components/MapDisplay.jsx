import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api';
import { useEffect, useRef, useState } from 'react';

const containerStyle = {
  width: '100%',
  height: '400px',
};

const defaultCenter = {
  lat: 37.7749,
  lng: -122.4194, // SF
};

export default function MapDisplay({ address, onAddressChange }) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const [position, setPosition] = useState(defaultCenter);
  const mapRef = useRef(null);

  // Geocode from address
  useEffect(() => {
    if (!address) return;

    const geocode = async () => {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          address
        )}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
      );
      const data = await res.json();
      if (data.results && data.results[0]) {
        const location = data.results[0].geometry.location;
        setPosition(location);
        mapRef.current?.panTo(location);
      }
    };

    geocode();
  }, [address]);

  const handleMarkerDragEnd = async (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();

    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
    );
    const data = await res.json();
    if (data.results && data.results[0]) {
      const formatted = data.results[0].formatted_address;
      onAddressChange(formatted);
      setPosition({ lat, lng });
    }
  };

  if (!isLoaded) return <div>Loading map...</div>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={position}
      zoom={14}
      onLoad={(map) => (mapRef.current = map)}
    >
      <Marker
        position={position}
        draggable={true}
        onDragEnd={handleMarkerDragEnd}
      />
    </GoogleMap>
  );
}
