import React, { useState } from 'react';
import {
  faCheckCircle,
  faTimesCircle,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const GoogleSheetExport = ({ pois }) => {
  const [sheetUrl, setSheetUrl] = useState('');
  const [sheetId, setSheetId] = useState('');
  const [connected, setConnected] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState('');

  const extractSheetId = (url) => {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : '';
  };

  const handleConnect = async () => {
    const id = extractSheetId(sheetUrl);
    if (!id) {
      setConnected(false);
      setMessage('Invalid Google Sheet link.');
      return;
    }

    try {
      const res = await fetch('http://localhost:3001/api/check-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetId: id }),
      });

      const data = await res.json();
      if (data.valid) {
        setSheetId(id);
        setConnected(true);
        setMessage('Connected successfully!');
      } else {
        setConnected(false);
        setMessage('Unable to connect to sheet. Please make sure the sheet is shared with "apptracker@applicationtracker-456501.iam.gserviceaccount.com"');
      }
    } catch (err) {
      console.error('Check sheet error:', err);
      setConnected(false);
      setMessage('An error occurred while checking the sheet.');
    }
  };

  const handleExport = async () => {
    if (!sheetId || pois.length === 0) return;

    setExporting(true);
    setMessage('');

    try {
      const res = await fetch('http://localhost:3001/api/export-to-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetId, pois }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage('Export successful!');
      } else {
        setMessage('Export failed.');
      }
    } catch (err) {
      console.error('Export error:', err);
      setMessage('An error occurred during export.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div style={{ padding: '1rem', maxWidth: '600px' }}>
      <label htmlFor="sheet-url">Google Sheet Share Link</label>
      <div style={{ display: 'flex', marginBottom: '0.5rem', gap: '0.5rem' }}>
        <input
          type="text"
          id="sheet-url"
          value={sheetUrl}
          onChange={(e) => setSheetUrl(e.target.value)}
          placeholder="https://docs.google.com/spreadsheets/d/..."
          style={{ flex: 1, padding: '8px' }}
        />
        <button onClick={handleConnect} style={{ padding: '8px 12px' }}>
          Connect
        </button>
      </div>
    <div style={{ display: 'flex', flexDirection: 'row', gap:'10px', alignItems: 'center' }}>

      {connected === true && (
          <FontAwesomeIcon icon={faCheckCircle} style={{ color: 'green' }} />
        )}
      {connected === false && (
          <FontAwesomeIcon icon={faTimesCircle} style={{ color: 'red' }} />
        )}
      {message && (
          <div style={{  color: '#555' }}>{message}</div>
        )}
    </div>

      {connected && (
        <button
          onClick={handleExport}
          disabled={exporting || pois.length === 0}
          style={{
            marginTop: '1rem',
            padding: '10px 16px',
            backgroundColor: '#1d4ed8',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {exporting ? 'Exporting...' : 'Export to Google Sheet'}
        </button>
      )}
    </div>
  );
};

export default GoogleSheetExport;
