import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { google } from 'googleapis';
import fetch from 'node-fetch';
import fs from 'fs';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const auth = new google.auth.GoogleAuth({
  keyFile: 'credentials.json', // Path to your service account credentials file
  scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive'],
});

const sheets = google.sheets({ version: 'v4', auth });
const drive = google.drive({ version: 'v3', auth });

/**
 * Ensure that the service account has permission to edit the Google Sheet.
 */
async function ensureSheetShared(sheetId) {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL; // Email of your service account

  try {
    await drive.permissions.create({
      fileId: sheetId,
      requestBody: {
        type: 'user',
        role: 'writer',
        emailAddress: email,
      },
      fields: 'id',
    });
    console.log('Permission added for service account');
  } catch (err) {
    if (err.errors?.[0]?.reason === 'duplicate') {
      console.log('Service account already has permission');
    } else {
      throw err;
    }
  }
}

/**
 * Fetch businesses from Google Places API within a radius of a specific location.
 */
async function fetchNearbyBusinesses(lat, lng) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY; // Ensure the Google Maps API key is in your .env file

  // Fetch nearby places
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=500&includedTypes=store&key=${apiKey}`
  );
  const data = await response.json();

  if (data.status !== 'OK') {
    throw new Error('Failed to fetch nearby businesses');
  }

  //write a copy of the data to ./Sample.json
  fs.writeFileSync('./Sample.json', JSON.stringify(data, null, 2), 'utf-8');

  return data.results.map((business) => ({
    name: business.name,
    address: business.vicinity,
  }));
}

/**
 * API endpoint to fetch businesses based on lat/lng and save them to a Google Sheet.
 */
app.post('/api/save-businesses', async (req, res) => {
  const { lat, lng, sheetId } = req.body;
  console.log('Received request:', { lat, lng, sheetId });

  if (!lat || !lng || !sheetId) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    console.log('Ensuring sheet is shared...');
    await ensureSheetShared(sheetId);

    console.log('Fetching businesses...');
    const businesses = await fetchNearbyBusinesses(lat, lng);
    console.log('Fetched businesses:', businesses.length);

    console.log('Writing to sheet...');
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'Sheet1!A1',
      valueInputOption: 'RAW',
      requestBody: {
        values: businesses.map((b) => [b.name, b.address]),
      },
    });

    res.status(200).json({ message: 'Businesses saved to Google Sheet' });
  } catch (err) {
    console.error('Error saving to sheet:', err.response?.data || err.message || err);
    res.status(500).json({ error: err.message });
  }
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
