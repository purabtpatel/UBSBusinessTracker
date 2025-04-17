import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { google } from 'googleapis';
import fetch from 'node-fetch';
import fs from 'fs';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const TOMTOM_API_KEY = process.env.TOMTOM_API_KEY;

const auth = new google.auth.GoogleAuth({
  keyFile: 'credentials.json', // Path to your service account credentials file
  scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive'],
});

const sheets = google.sheets({ version: 'v4', auth });
const drive = google.drive({ version: 'v3', auth });


app.post('/api/places', async (req, res) => {
  const { lat, lon, radius, category } = req.body;

  const url = `https://api.tomtom.com/search/2/poiSearch/${encodeURIComponent(category)}.json?key=${TOMTOM_API_KEY}&lat=${lat}&lon=${lon}&radius=${radius}&countrySet=US`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    const results = filterUSResults(data.results || []);
    //write to ./Sample.json
    fs.writeFileSync('./Sample.json', JSON.stringify(results, null, 2), 'utf-8');
    res.json(results);
  } catch (error) {
    console.error('Error fetching places:', error);
    res.status(500).json({ error: 'Failed to fetch places' });
  }
});


const filterUSResults = results =>
  results.filter(place => place.address?.countryCodeISO3 === 'USA');


app.post('/api/places-nearby', async (req, res) => {
  const { lat, lon, radius } = req.body;
  console.log('Received request for nearby places:', { lat, lon, radius });
  const apiUrl = `https://api.tomtom.com/search/2/nearbySearch/.json?key=${TOMTOM_API_KEY}&lat=${lat}&lon=${lon}&radius=${radius}`;
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      const errorBody = await response.text(); // Get error details from TomTom if available
      console.error(`TomTom API Error: ${response.status} ${response.statusText}`, errorBody);
      throw new Error(`TomTom API request failed with status ${response.status}`);
    }
    const data = await response.json();
    const results = filterUSResults(data.results || []);
    fs.writeFileSync('./Sample.json', JSON.stringify(results, null, 2), 'utf-8');
    res.json(data);
  } catch (error) {
    console.error('Error in /api/places-nearby handler:', error);
    res.status(500).json({ error: 'Failed to fetch nearby places' });
  }
});

app.post('/api/categories', async (req, res) => {
  try{
    const apiUrl = `https://api.tomtom.com/search/2/poiCategories.json?key=${TOMTOM_API_KEY}`;
    const response = await fetch(apiUrl);
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`TomTom API Error: ${response.status} ${response.statusText}`, errorBody);
      throw new Error(`TomTom API request failed with status ${response.status}`);
    }
    const data = await response.json(); 
    console.log('TomTom API Response:', data); 

    const simplifiedCategories = data.poiCategories.map(category => {
      return {
        id: category.id,
        name: category.name
      };
    });
  
    res.json(simplifiedCategories);
  } catch (error) {
      console.error('Error in /api/places-categories handler:', error);
      res.status(500).json({ error: 'Failed to fetch places categories' });
    }
});


app.post('/api/geocode', async (req, res) => {
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

app.post('/api/reverse-geocode', async (req, res) => {
  const { lat, lon } = req.body;

  const url = `https://api.tomtom.com/search/2/reverseGeocode/${lat},${lon}.json?key=${TOMTOM_API_KEY}`;

  try {
    const response = await fetch(url);
    console.log('Reverse geocode URL:', response); // Log the URL for debugging
    const data = await response.json();

    const address = data.addresses[0]?.address?.freeformAddress || 'Unknown';
    res.json({ address });
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    res.status(500).json({ error: 'Failed to reverse geocode' });
  }
});

app.post('/api/export-to-sheet', async (req, res) => {
  const { sheetId, pois } = req.body;

  if (!Array.isArray(pois) || pois.length === 0) {
    return res.status(400).json({ error: 'No POIs provided' });
  }

  const rows = pois.map(poi => [
    poi.poi?.name || '',
    poi.address?.freeformAddress || '',
    poi.poi?.phone || '',
    poi.poi?.url || '',
    poi.poi?.categories?.join(', ') || '',
    poi.position?.lat || '',
    poi.position?.lon || '',
  ]);

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'Sheet1!A1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [
          ['Name', 'Address', 'Phone', 'Website', 'Search Categories', 'Latitude', 'Longitude',],
          ...rows
        ],
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error writing to sheet:', error);
    res.status(500).json({ error: 'Failed to write to Google Sheet' });
  }
});

// Add this alongside your other Express routes
app.post('/api/check-sheet', async (req, res) => {
  const { sheetId } = req.body;

  if (!sheetId) {
    return res.status(400).json({ error: 'Missing sheet ID' });
  }

  try {
    const metadata = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
    });

    if (metadata) {
      res.json({ valid: true });
    } else {
      res.status(404).json({ error: 'Sheet not found' });
    }
  } catch (err) {
    console.error('Sheet check failed:', err);
    res.status(500).json({ error: 'Could not access Google Sheet' });
  }
});



// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
