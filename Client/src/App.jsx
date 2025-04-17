import { useState, useEffect } from 'react';
import AddressSearchBar from './components/AddressSearchBar';
import TomTomMap from './components/TomTomMap';
import SearchFilters from './components/SearchFilters';
import PoiList from './components/PoiList';
import { Grow } from '@mui/material';
import './App.css';
import GoogleSheetExport from './components/GoogleSheetExport';

const App = () => {
  const [center, setCenter] = useState({ lat: 37.7749, lon: -122.4194 }); // Default SF
  const [pois, setPois] = useState([]);
  const [radius, setRadius] = useState(5000);
  const [categorySet, setCategorySet] = useState('');
  const [address, setAddress] = useState('');


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

  const handleMapClick = async (coords) => {
    setCenter(coords);

    try{
      const res = await fetch('http://localhost:3001/api/reverse-geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(coords)
      });
      const data = await res.json();

      setAddress(data.address); // Assuming the API returns a display name
      console.log('Reverse geocode data:', data);

    }catch (err) {
      console.error('Reverse geocoding error:', err);
    }
  };

  const handleFilterSearch = async ({ radius, categorySet }) => {
    setRadius(radius);
    setCategorySet(categorySet);

    try {
      if (!categorySet) {
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


      <AddressSearchBar onSearch={handleAddressSearch} address={address} setAddress={setAddress} />


      <div className="map-filter-container">
        <TomTomMap
          center={[center.lon, center.lat]}
          radius={radius}
          onMapClick={handleMapClick}
          pois={pois}
        />

        <div className="side-container">
          <SearchFilters
            radius={radius}
            setRadius={setRadius}
            categorySet={categorySet}
            setCategorySet={setCategorySet}
            onSearch={handleFilterSearch}
          />
          <GoogleSheetExport pois={pois} />
          <PoiList key={JSON.stringify(center)} results={pois} center={center} />
        </div>
      </div>

      {/* <PoiList results={pois} /> */}
    </div>
  );
};

export default App;
