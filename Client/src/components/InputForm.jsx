import { useRef } from 'react';
import { Autocomplete } from '@react-google-maps/api';

export default function InputForm({ address, sheetId, onChange }) {
  const autoCompleteRef = useRef(null);
  const inputRef = useRef(null);

  const handlePlaceChanged = () => {
    const place = autoCompleteRef.current.getPlace();
    if (place && place.formatted_address) {
      onChange({ address: place.formatted_address, sheetId });
    }
  };

  const extractSheetId = (link) => {
    const match = link.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : '';
  };

  const handleSheetInputChange = (e) => {
    const link = e.target.value;
    const id = extractSheetId(link);
    onChange({ address, sheetId: id });

    if (!id) {
      alert('Please paste a valid Google Sheets link (e.g. https://docs.google.com/spreadsheets/d/...)');
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
          onChange={(e) => onChange({ address: e.target.value, sheetId })}
          className="border p-2 w-full"
        />
      </Autocomplete>
      <input
        type="text"
        placeholder="Paste Google Sheets Share Link"
        onChange={handleSheetInputChange}
        className="border p-2 w-full"
      />
      {sheetId && (
        <p className="text-sm text-green-700">
          Sheet ID detected: <span className="font-mono">{sheetId}</span><br />
          Make sure to share this sheet with <span className="font-mono text-blue-700">apptracker@applicationtracker-456501.iam.gserviceaccount.com</span>
        </p>
      )}
    </form>
  );
}
