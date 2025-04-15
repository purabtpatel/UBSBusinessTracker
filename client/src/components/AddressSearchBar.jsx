import React, { useState } from 'react';

const AddressSearchBar = ({ onSearch }) => {
  const [address, setAddress] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (address) onSearch(address);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        placeholder="Enter address..."
        value={address}
        onChange={e => setAddress(e.target.value)}
        className="border px-3 py-2 rounded w-full"
      />
      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Search</button>
    </form>
  );
};

export default AddressSearchBar;
