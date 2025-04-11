import { useLoadScript } from '@react-google-maps/api';
import { useState } from 'react';
import InputForm from './components/InputForm';
import MapDisplay from './components/MapDisplay';

function App() {
  const [formData, setFormData] = useState({ address: '', sheetUrl: '' });

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ['places'],
    version: 'weekly',
  });

  if (!isLoaded) return <div>Loading Google Maps...</div>;

  // Extract Spreadsheet ID from Google Sheets share link
  const extractSheetId = (url) => {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  };

  // Geocode address to get lat/lng
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
      const sheetId = extractSheetId(formData.sheetUrl);

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

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Address + Google Sheet App</h1>
      <InputForm
        address={formData.address}
        sheetUrl={formData.sheetUrl}
        onChange={setFormData}
      />
      <MapDisplay
        address={formData.address}
        onAddressChange={(addr) =>
          setFormData((prev) => ({ ...prev, address: addr }))
        }
      />
      <button
        onClick={handleFetchBusinesses}
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
      >
        Fetch Businesses and Write to Sheet
      </button>
    </div>
  );
}

export default App;
