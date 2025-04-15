import { useState } from 'react';
import categories from '../data/tomtomCategories.json';

const radiusOptions = [
  { value: 1000, label: '1 km' },
  { value: 3000, label: '3 km' },
  { value: 5000, label: '5 km' },
  { value: 10000, label: '10 km' },
  { value: 20000, label: '20 km' },
];

const SearchFilters = ({ onSearch }) => {
  const [radius, setRadius] = useState(5000);
  const [placeType, setPlaceType] = useState(categories[0]?.id || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch({ radius, categorySet: placeType });
  };

  return (
    <form onSubmit={handleSubmit} className="search-filters">
      <div className="filters-header">
        <h2>Search Filters</h2>
      </div>

      <div className="filter-group">
        <label>Place Type</label>
        <select value={placeType} onChange={(e) => setPlaceType(e.target.value)}>
          {categories.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label>Search Radius</label>
        <select value={radius} onChange={(e) => setRadius(Number(e.target.value))}>
          {radiusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <button type="submit">Search POIs</button>
    </form>
  );
};

export default SearchFilters;
