import React from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import tomtomCategoriesRaw from '../data/tomtomCategories.json';

const SearchFilters = ({ radius, setRadius, categorySet, setCategorySet, onSearch }) => {
  const radiusOptions = [
    { value: 500, label: '500 m' },
    { value: 1000, label: '1 km' },
    { value: 3000, label: '3 km' },
    { value: 5000, label: '5 km' },
    { value: 10000, label: '10 km' },
  ];

  const categoryOptions = tomtomCategoriesRaw
    .map(cat => ({
      value: cat.id.toString(),
      label: cat.name
    }));

  const handlePlaceTypeChange = (selected) => {
    const values = selected.map(option => option.label);
    setCategorySet(values.join(','));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch({ radius, categorySet });
  };

  return (
    <Box component="form" onSubmit={handleSubmit}  style={{ width: '40vw', paddingLeft: '10px', paddingRight: '10px'}}>
      <Box sx={{ mb: 2 }}>
        <Autocomplete
          multiple
          options={categoryOptions}
          size='small'
          getOptionLabel={(option) => option.label}
          onChange={(e, value) => handlePlaceTypeChange(value)}
          filterSelectedOptions
          renderInput={(params) => (
            <TextField
              {...params}
              label="Place Types"
              placeholder="Select categories"
              variant="outlined"
            />
          )}
        />
      </Box>

      <Box sx={{ mb: .5 }}>
        <TextField
          select
          label="Search Radius"
          size='small'
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
          fullWidth
        >
          {radiusOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      <Button variant="contained" type="submit">
        Search
      </Button>
    </Box>
  );
};

export default SearchFilters;
