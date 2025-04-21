import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { google } from 'googleapis';
import fetch from 'node-fetch';
import fs from 'fs';
import jwt from 'jsonwebtoken';


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const TOMTOM_API_KEY = process.env.TOMTOM_API_KEY;


// SUPABASE AUTH CONFIG
const supabaseProjectId = process.env.SUPABASE_PROJECT_ID;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;


function authenticateRequest(req, res, next) {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) return res.status(401).json({ error: 'Missing token' });

  jwt.verify(token, process.env.SUPABASE_JWT_SECRET, { algorithms: ['HS256'] }, (err, decoded) => {
    if (err) {
      console.error('JWT verification failed:', err.message);
      return res.status(401).json({ error: 'Invalid token' });
    }
    req.user = decoded;
    next();
  });
}


// Google Sheets Auth
const auth = new google.auth.GoogleAuth({
  keyFile: 'credentials.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive'],
});
const sheets = google.sheets({ version: 'v4', auth });
const drive = google.drive({ version: 'v3', auth });

// Middleware for route protection (apply selectively)
const requireAuth = authenticateRequest;

// All protected routes use this
app.post('/api/places', requireAuth, async (req, res) => {
  const { lat, lon, radius, category } = req.body;
  const url = `https://api.tomtom.com/search/2/poiSearch/${encodeURIComponent(category)}.json?key=${TOMTOM_API_KEY}&lat=${lat}&lon=${lon}&radius=${radius}&countrySet=US`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    const results = filterUSResults(data.results || []);
    res.json(results);
  } catch (error) {
    console.error('Error fetching places:', error);
    res.status(500).json({ error: 'Failed to fetch places' });
  }
});

app.post('/api/places-nearby', requireAuth, async (req, res) => {
  const { lat, lon, radius } = req.body;
  const apiUrl = `https://api.tomtom.com/search/2/nearbySearch/.json?key=${TOMTOM_API_KEY}&lat=${lat}&lon=${lon}&radius=${radius}`;
  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    const results = filterUSResults(data.results || []);
    res.json(data);
  } catch (error) {
    console.error('Error in /api/places-nearby handler:', error);
    res.status(500).json({ error: 'Failed to fetch nearby places' });
  }
});

app.post('/api/categories', requireAuth, async (req, res) => {
  try {
    const apiUrl = `https://api.tomtom.com/search/2/poiCategories.json?key=${TOMTOM_API_KEY}`;
    const response = await fetch(apiUrl);
    const data = await response.json();
    const simplifiedCategories = data.poiCategories.map(category => ({
      id: category.id,
      name: category.name
    }));
    res.json(simplifiedCategories);
  } catch (error) {
    console.error('Error in /api/categories handler:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

app.post('/api/geocode', requireAuth, async (req, res) => {
  const { address } = req.body;
  const url = `https://api.tomtom.com/search/2/geocode/${encodeURIComponent(address)}.json?key=${TOMTOM_API_KEY}&countrySet=US`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    const result = data.results[0];
    res.json(result.position);
  } catch (error) {
    console.error('Error geocoding:', error);
    res.status(500).json({ error: 'Failed to geocode address' });
  }
});

app.post('/api/reverse-geocode', requireAuth, async (req, res) => {
  const { lat, lon } = req.body;
  const url = `https://api.tomtom.com/search/2/reverseGeocode/${lat},${lon}.json?key=${TOMTOM_API_KEY}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    const address = data.addresses[0]?.address?.freeformAddress || 'Unknown';
    res.json({ address });
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    res.status(500).json({ error: 'Failed to reverse geocode' });
  }
});

app.post('/api/export-to-sheet', requireAuth, async (req, res) => {
  const { sheetId, pois } = req.body;

  if (!Array.isArray(pois) || pois.length === 0) {
    return res.status(400).json({ error: 'No POIs provided' });
  }

  const timestamp = new Date().toISOString();
  const headers = [
    'Name', 'Address', 'Phone', 'Website',
    'Search Categories', 'Latitude', 'Longitude',
    'POI ID', 'Timestamp'
  ];

  const newRows = pois.map((poi) => [
    poi.poi?.name || '',
    poi.address?.freeformAddress || '',
    poi.poi?.phone || '',
    poi.poi?.url || '',
    poi.poi?.categories?.join(', ') || '',
    poi.position?.lat || '',
    poi.position?.lon || '',
    poi.id || '',
    timestamp
  ]);

  try {
    const getRes = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Sheet1',
    });

    const values = getRes.data.values || [];
    const existingHeader = values[0] || [];
    const existingData = values.slice(1);
    if (existingHeader.length < headers.length) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: 'Sheet1!A1',
        valueInputOption: 'RAW',
        requestBody: { values: [headers] },
      });
    }

    const poiIdColumnIndex = existingHeader.indexOf('POI ID');
    const existingIds = new Set();
    if (poiIdColumnIndex !== -1) {
      for (let row of existingData) {
        const existingId = row[poiIdColumnIndex];
        if (existingId) existingIds.add(existingId.trim());
      }
    }

    const uniqueRows = newRows.filter((row) => !existingIds.has(row[7]));
    const skipped = newRows.length - uniqueRows.length;

    if (uniqueRows.length > 0) {
      await sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: 'Sheet1',
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: uniqueRows },
      });
    }

    res.json({ success: true, added: uniqueRows.length, skipped, total: newRows.length });
  } catch (error) {
    console.error('Error exporting to sheet:', error.message);
    res.status(500).json({ error: 'Failed to export POIs to Google Sheet' });
  }
});

app.post('/api/check-sheet', requireAuth, async (req, res) => {
  const { sheetId } = req.body;
  if (!sheetId) return res.status(400).json({ error: 'Missing sheet ID' });

  try {
    const metadata = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
    if (metadata) res.json({ valid: true });
    else res.status(404).json({ error: 'Sheet not found' });
  } catch (err) {
    console.error('Sheet check failed:', err);
    res.status(500).json({ error: 'Could not access Google Sheet' });
  }
});

function filterUSResults(results) {
  return results.filter(place => place.address?.countryCodeISO3 === 'USA');
}


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
