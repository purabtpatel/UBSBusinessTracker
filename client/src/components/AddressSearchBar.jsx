import React, { useState } from 'react';
import Paper from '@mui/material/Paper';
import InputBase from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';
import SearchIcon from '@mui/icons-material/Search';

const AddressSearchBar = ({ onSearch, address, setAddress }) => {
  

  const handleSubmit = (e) => {
    e.preventDefault();
    if (address.trim()) {
      onSearch(address.trim());
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '20px', marginBottom: '20px' }}>

    <Paper
      component="form"
      onSubmit={handleSubmit}
      sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', flexGrow: 1}}
      >
      <InputBase
        sx={{ ml: 1, flex: 1 }}
        placeholder="Enter address..."
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        inputProps={{ 'aria-label': 'enter address' }}
        />
      <IconButton type="submit" sx={{ p: '10px' }} aria-label="search">
        <SearchIcon />
      </IconButton>
    </Paper>
        </div>
  );
};

export default AddressSearchBar;
