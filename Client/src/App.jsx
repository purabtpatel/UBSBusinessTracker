import { useState, useEffect } from 'react';
import AddressSearchBar from './components/AddressSearchBar';
import TomTomMap from './components/TomTomMap';
import SearchFilters from './components/SearchFilters';
import PoiList from './components/PoiList';
import { Grow } from '@mui/material';
import './App.css';

const App = () => {
  const [center, setCenter] = useState({ lat: 37.7749, lon: -122.4194 }); // Default SF
  const [pois, setPois] = useState([]);
  const [radius, setRadius] = useState(5000);
  const [categorySet, setCategorySet] = useState('');

  useEffect(() => {
    console.log('Pois updated:', pois);
  }, [pois]);

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
      if (!categorySet) {
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
        setPois(data.results); // ✅ This works because "places-nearby" returns { results: [...] }
      } else {
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
        setPois(data); // ✅ FIXED: data is already an array here
      }
    } catch (err) {
      console.error('Place search error:', err);
    }
  };

  return (
    <div className="app-container">

      <h3 className="app-title">Business Finder</h3>


      <AddressSearchBar onSearch={handleAddressSearch} />


      <div className="map-filter-container">
        <TomTomMap
          center={[center.lon, center.lat]}
          radius={radius}
          onMapClick={handleMapClick}
        />
        <div className="side-container">
          <SearchFilters
            radius={radius}
            setRadius={setRadius}
            categorySet={categorySet}
            setCategorySet={setCategorySet}
            onSearch={handleFilterSearch}
          />
          <PoiList key={JSON.stringify(center)} results={pois} center={center} />
        </div>
      </div>

      {/* <PoiList results={pois} /> */}
    </div>
  );
};

export default App;
