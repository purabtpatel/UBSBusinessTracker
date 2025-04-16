import { useState } from 'react';
import AddressSearchBar from './components/AddressSearchBar';
import TomTomMap from './components/TomTomMap';
import SearchFilters from './components/SearchFilters';
import PoiList from './components/PoiList';

const App = () => {
  const [center, setCenter] = useState({ lat: 37.7749, lon: -122.4194 }); // Default SF
  const [pois, setPois] = useState([]);
  const [radius, setRadius] = useState(5000);
  const [categorySet, setCategorySet] = useState('');

  console.log("pois", pois);

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
    console.log('Filter search:', { radius, categorySet, center });
    setRadius(radius);
    setCategorySet(categorySet);

    try {
      if(!categorySet){
        console.log('No category set, using nearby search');
        const res = await fetch('http://localhost:3001/api/places-nearby', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lat: center.lat,
            lon: center.lon,
            radius
          })
        });
        const data = await res.json();
        console.log('Places search results:', data);
        setPois(data);
      }else{
        console.log('Category set:', categorySet);
        const res = await fetch('http://localhost:3001/api/places', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lat: center.lat,
            lon: center.lon,
            radius,
            category: categorySet
          })
        });
        const data = await res.json();
        console.log('Places search results:', data);
        setPois(data.results);
      }
      } catch (err) {
        console.error('Place search error:', err);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1rem' }}>
      <h1 style={{ textAlign: 'center' }}>POI Explorer</h1>
      <AddressSearchBar onSearch={handleAddressSearch} />
      <TomTomMap center={[center.lon, center.lat]} radius={radius} onMapClick={handleMapClick} />
      <SearchFilters
        radius={radius}
        setRadius={setRadius}
        categorySet={categorySet}
        setCategorySet={setCategorySet}
        onSearch={handleFilterSearch}
      />
      <PoiList results={pois} />
    </div>
  );
};

export default App;
