import { useLoadScript } from '@react-google-maps/api';
import { useState } from 'react';
import InputForm from './components/InputForm';
import MapDisplay from './components/MapDisplay';

function App() {
  const [formData, setFormData] = useState({ address: '', sheetName: '' });

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ['places'],
    version: 'weekly', // or 'beta'
  });
  
  if (!isLoaded) return <div>Loading Google Maps...</div>;

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Address + Google Sheet App</h1>
      <InputForm
        address={formData.address}
        sheetName={formData.sheetName}
        onChange={setFormData}
      />
      <MapDisplay
        address={formData.address}
        onAddressChange={(addr) =>
          setFormData((prev) => ({ ...prev, address: addr }))
        }
      />
    </div>
  );
}

export default App;
