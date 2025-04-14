import { useState, useEffect, useRef } from 'react';
import {
  Autocomplete,
  GoogleMap,
  Marker,
  useLoadScript,
} from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '400px',
};

const defaultCenter = {
  lat: 37.7749,
  lng: -122.4194, // SF
};

export default function App() {
  const [formData, setFormData] = useState({ address: '', sheetId: '' });
  const [position, setPosition] = useState(defaultCenter);
  const mapRef = useRef(null);
  const inputRef = useRef(null);
  const autoCompleteRef = useRef(null);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ['places'],
    version: 'weekly',
  });

  useEffect(() => {
    if (!formData.address) return;

    const geocode = async () => {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          formData.address
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
  }, [formData.address]);

  const handleMarkerDragEnd = async (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();

    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
    );
    const data = await res.json();
    if (data.results && data.results[0]) {
      const formatted = data.results[0].formatted_address;
      setFormData((prev) => ({ ...prev, address: formatted }));
      setPosition({ lat, lng });
    }
  };

  const extractSheetId = (link) => {
    const match = link.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : '';
  };

  const handlePlaceChanged = () => {
    const place = autoCompleteRef.current.getPlace();
    if (place && place.formatted_address) {
      setFormData((prev) => ({ ...prev, address: place.formatted_address }));
    }
  };

  const handleSheetInputChange = (e) => {
    const link = e.target.value;
    const id = extractSheetId(link);
    setFormData((prev) => ({ ...prev, sheetId: id }));

    if (!id) {
      alert('Please paste a valid Google Sheets link (e.g. https://docs.google.com/spreadsheets/d/...)');
    }
  };

  const geocodeAddress = async (address) => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&key=${apiKey}`
    );
    const data = await response.json();
    if (data.status === 'OK') {
      const { lat, lng } = data.results[0].geometry.location;
      return { lat, lng };
    } else {
      throw new Error('Unable to geocode address.');
    }
  };

  const handleFetchBusinesses = async () => {
    try {
      const { lat, lng } = await geocodeAddress(formData.address);
      const sheetId = formData.sheetId;

      if (!sheetId) {
        alert('Invalid Google Sheets link.');
        return;
      }

      const res = await fetch('http://localhost:3001/api/save-businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng, sheetId }),
      });

      const result = await res.json();
      alert(result.message || 'Finished fetching businesses.');
    } catch (err) {
      console.error(err);
      alert('Failed to fetch businesses. Check console for details.');
    }
  };

  if (!isLoaded) return <div>Loading Google Maps...</div>;

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Address + Google Sheet App</h1>

      {/* Input Form */}
      <form className="p-4 space-y-2">
        <Autocomplete
          onLoad={(autocomplete) => (autoCompleteRef.current = autocomplete)}
          onPlaceChanged={handlePlaceChanged}
        >
          <input
            ref={inputRef}
            type="text"
            placeholder="Enter Address"
            value={formData.address}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, address: e.target.value }))
            }
            className="border p-2 w-full"
          />
        </Autocomplete>
        <input
          type="text"
          placeholder="Paste Google Sheets Share Link"
          onChange={handleSheetInputChange}
          className="border p-2 w-full"
        />
        {formData.sheetId && (
          <p className="text-sm text-green-700">
            Sheet ID detected:{' '}
            <span className="font-mono">{formData.sheetId}</span>
            <br />
            Make sure to share this sheet with:{' '}
            <span className="font-mono text-blue-700">
              apptracker@applicationtracker-456501.iam.gserviceaccount.com
            </span>
          </p>
        )}
      </form>

      {/* Map */}
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

      {/* Action Button */}
      <button
        onClick={handleFetchBusinesses}
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
      >
        Fetch Businesses and Write to Sheet
      </button>
    </div>
  );
}
