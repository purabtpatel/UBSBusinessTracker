import { useState } from 'react';
import AddressSearchBar from './components/AddressSearchBar';
import TomTomMap from './components/TomTomMap';
import SearchFilters from './components/SearchFilters';
import PoiList from './components/PoiList';

const App = () => {
  const [center, setCenter] = useState({ lat: 37.7749, lon: -122.4194 }); // Default: San Francisco
  const [pois, setPois] = useState([]);
  const [radius, setRadius] = useState(5000);
  const [categorySet, setCategorySet] = useState('');

  const handleAddressSearch = async (address) => {
    try {
      const res = await fetch('http://localhost:3001/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address })
      });
      const coords = await res.json();
      setCenter(coords);
    } catch (err) {
      console.error('Geocoding error:', err);
    }
  };

  const handleMapClick = (coords) => {
    setCenter(coords);
  };

  const handleFilterSearch = async ({ radius, categorySet }) => {
    setRadius(radius);
    setCategorySet(categorySet);

    try {
      const res = await fetch('http://localhost:3001/api/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: center.lat,
          lon: center.lon,
          radius,
          categorySet
        })
      });
      const data = await res.json();
      setPois(data);
    } catch (err) {
      console.error('Place search error:', err);
    }
  };

  return (
    <div >
      <h1>Place Finder</h1>

      <AddressSearchBar onSearch={handleAddressSearch} />

      {/* <TomTomMap center={[center.lon, center.lat]} onMapClick={handleMapClick} /> */}

      <SearchFilters onSearch={handleFilterSearch} />

      <PoiList results={pois} />
    </div>
  );
};

export default App;
