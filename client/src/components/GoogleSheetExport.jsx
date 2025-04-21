import React, { useState } from 'react';
import { faCheckCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { supabase } from '../supabaseClient';


const GoogleSheetExport = ({ pois }) => {
    const [sheetUrl, setSheetUrl] = useState('');
    const [sheetId, setSheetId] = useState('');
    const [connected, setConnected] = useState(null);
    const [exporting, setExporting] = useState(false);
    const [message, setMessage] = useState('');
    const [exportStats, setExportStats] = useState(null);

    const getAuthHeader = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        return token ? { Authorization: `Bearer ${token}` } : {};
    };
    const host = import.meta.env.VITE_HOST;


    const extractSheetId = (url) => {
        const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
        return match ? match[1] : '';
    };

    const handleConnect = async () => {
        const id = extractSheetId(sheetUrl);
        if (!id) {
            setConnected(false);
            setMessage('Invalid link.');
            return;
        }

        try {
            const headers = {
                'Content-Type': 'application/json',
                ...(await getAuthHeader())
            };
            const res = await fetch(`http://${host}:3001/api/check-sheet`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ sheetId: id }),
            });

            const data = await res.json();
            if (data.valid) {
                setSheetId(id);
                setConnected(true);
                setMessage('Connected!');
            } else {
                setConnected(false);
                setMessage('Sheet not accessible.');
            }
        } catch (err) {
            console.error('Check sheet error:', err);
            setConnected(false);
            setMessage('Error checking sheet.');
        }
    };

    const handleExport = async () => {
        if (!sheetId || pois.length === 0) return;

        setExporting(true);
        setMessage('');
        const headers = {
            'Content-Type': 'application/json',
            ...(await getAuthHeader())
        };
        try {

            const res = await fetch(`http://${host}:3001/api/export-to-sheet`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ sheetId, pois }),
            });

            const data = await res.json();
            if (data.success) {
                setExportStats({ added: data.added, skipped: data.skipped });
                setMessage('Export successful!');
            } else {
                setMessage('Export failed.');
            }

        } catch (err) {
            console.error('Export error:', err);
            setMessage('An error occurred.');
        } finally {
            setExporting(false);
        }
    };

    return (
        <div style={{ padding: '0.5rem', fontSize: '0.8rem' }}>
            <label htmlFor="sheet-url">Google Sheet Link</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input
                    type="text"
                    id="sheet-url"
                    value={sheetUrl}
                    onChange={(e) => setSheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/..."
                    style={{ flex: 1, padding: '6px', fontSize: '0.8rem' }}
                />
                <button onClick={handleConnect} style={{ padding: '6px 10px', fontSize: '0.75rem' }}>
                    Connect
                </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {connected === true && <FontAwesomeIcon icon={faCheckCircle} color="green" />}
                {connected === false && <FontAwesomeIcon icon={faTimesCircle} color="red" />}
                {message && <span>{message}</span>}
                {exportStats && (
                    <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: '#444' }}>
                        <strong>Added:</strong> {exportStats.added} &nbsp;|&nbsp;
                        <strong>Skipped (duplicates):</strong> {exportStats.skipped}
                    </div>
                )}

            </div>

            {connected && (
                <button
                    onClick={handleExport}
                    disabled={exporting || pois.length === 0}
                    style={{
                        marginTop: '0.5rem',
                        padding: '6px 12px',
                        fontSize: '0.75rem',
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
