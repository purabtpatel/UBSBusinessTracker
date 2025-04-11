import { useEffect, useRef } from 'react';
import { Autocomplete } from '@react-google-maps/api';

export default function InputForm({ address, sheetName, onChange }) {
  const autoCompleteRef = useRef(null);
  const inputRef = useRef(null);

  const handlePlaceChanged = () => {
    const place = autoCompleteRef.current.getPlace();
    if (place && place.formatted_address) {
      onChange({ address: place.formatted_address, sheetName });
    }
  };

  return (
    <form className="p-4 space-y-2">
      <Autocomplete
        onLoad={(autocomplete) => (autoCompleteRef.current = autocomplete)}
        onPlaceChanged={handlePlaceChanged}
      >
        <input
          ref={inputRef}
          type="text"
          placeholder="Enter Address"
          value={address}
          onChange={(e) => onChange({ address: e.target.value, sheetName })}
          className="border p-2 w-full"
        />
      </Autocomplete>
      <input
        type="text"
        placeholder="Google Sheet Name"
        value={sheetName}
        onChange={(e) => onChange({ address, sheetName: e.target.value })}
        className="border p-2 w-full"
      />
    </form>
  );
}
