/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Simple memory cache for global emissions
let emissionsCache = {
  data: { annualTons: 37400000000, source: 'EcoTrace Data Estimation', year: 2026 },
  lastFetched: 0,
};

// Gemini API endpoint for fetching real-time global CO2 emissions rate
app.post('/api/gemini/global-emissions', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const now = Date.now();

    // Return cached data if fetched within the last hour to save quota
    if (now - emissionsCache.lastFetched < 3600000 && emissionsCache.lastFetched !== 0) {
      return res.json(emissionsCache.data);
    }

    if (!apiKey) {
      return res.json(emissionsCache.data);
    }

    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: { 'User-Agent': 'aistudio-build' }
      }
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: "Find the latest available estimate for the total global CO2 emissions per year in metric tons, specifically focusing on data or projections for the year 2026. Use Google Search to find this information. Return ONLY a JSON object with 'annualTons' (number), 'source' (string), and 'year' (number). Ensure 'annualTons' is the raw number (e.g. 40000000000).",
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    let jsonStr = response.text?.trim() || '';
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
    }
    
    // Fallback if parsing fails
    let data;
    try {
      data = JSON.parse(jsonStr);
      emissionsCache = { data, lastFetched: now };
    } catch(e) {
      data = emissionsCache.data;
    }

    res.json(data);
  } catch (error: any) {
    // Pass 429 along to let the client handle retry/processing state
    if (error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('Quota')) {
      return res.status(429).json({ error: 'Rate limit exceeded', processing: true });
    }
    
    // For other errors, we can log briefly
    console.error('Gemini API fetch error:', error.message);
    res.status(500).json({ error: 'Failed to fetch' });
  }
});

// Serve API routes first, then Vite assets / SPA HTML

app.post('/api/gemini/parse-bill', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(403).json({ error: 'Gemini API key is not configured.' });
    }

    const { base64Pdf, mimeType } = req.body;
    if (!base64Pdf) {
      return res.status(400).json({ error: 'No document provided' });
    }

    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });

    const contents = [
      {
        text: `Extract the utility consumption data from this bill.
        Return ONLY a JSON object with the following optional numeric keys:
        - 'electricityKwh' (number): The electricity usage in kWh.
        - 'gasTherms' (number): The natural gas usage in therms.
        - 'heatingOilGallons' (number): Heating oil usage in gallons.
        If an amount is not found, leave it out or set it to 0. Do not use markdown blocks.`
      },
      {
        inlineData: {
          mimeType: mimeType || 'application/pdf',
          data: base64Pdf
        }
      }
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
    });

    let jsonStr = response.text?.trim() || '{}';
    if (jsonStr.startsWith('```json')) jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
    if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace(/```/g, '').trim();

    let data = {};
    try {
      data = JSON.parse(jsonStr);
    } catch(e) {
      console.error('Failed to parse Gemini output:', jsonStr);
      return res.status(500).json({ error: 'Failed to parse AI response' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error parsing bill:', error);
    res.status(500).json({ error: 'Error calling AI models' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[EcoTrace Server] listening live on http://localhost:${PORT}`);
  });
}

startServer();
