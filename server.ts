/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialization helper for GoogleGenAI
function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    console.log('[EcoTrace Backend] GEMINI_API_KEY not found or default. Operating in calculation solver mode.');
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// 1. Math-based fallback calculator (reproduced industry baselines like EPA & DEFRA)
function calculateLocalBaseline(quiz: any) {
  let home = 2.0; // Apartment default
  if (quiz.homeSize === 'medium-house') home = 3.5;
  if (quiz.homeSize === 'large-house') home = 5.2;

  if (quiz.homeEnergy === 'electric-solar') home *= 0.15; // Solar offset
  if (quiz.homeEnergy === 'grid-electric') home *= 0.8;

  let travel = 0.5; // low travel
  if (quiz.commuteMode === 'car') {
    travel += (quiz.weeklyMileage * 52 * 0.404) / 1000; // 0.404 kg per mile
  } else if (quiz.commuteMode === 'electric-car') {
    travel += (quiz.weeklyMileage * 52 * 0.12) / 1000;
  } else if (quiz.commuteMode === 'public-transit') {
    travel += (quiz.weeklyMileage * 52 * 0.14) / 1000;
  } else {
    travel += 0.05; // walk/cycle minor emissions
  }

  // flights: approx 0.8 Tons per average domestic/medium flight
  travel += quiz.flightsPerYear * 0.8;

  let food = 1.5; // balanced
  if (quiz.diet === 'vegan') food = 0.5;
  if (quiz.diet === 'vegetarian') food = 0.9;
  if (quiz.diet === 'high-meat') food = 2.8;

  let shopping = 1.0;
  if (quiz.shoppingHabits === 'minimalist') shopping = 0.3;
  if (quiz.shoppingHabits === 'frequent-buyer') shopping = 2.4;

  const total = Math.round((home + travel + food + shopping) * 10) / 10;

  return {
    baselineScore: total,
    baselineBreakdown: {
      home: Math.round(home * 10) / 10,
      travel: Math.round(travel * 10) / 10,
      food: Math.round(food * 10) / 10,
      shopping: Math.round(shopping * 10) / 10,
    },
  };
}

// REST route: POST /api/onboarding/profile
app.post('/api/onboarding/profile', async (req, res) => {
  try {
    const quiz = req.body;
    if (!quiz) {
      return res.status(400).json({ error: 'Quiz payload is required' });
    }

    const localStats = calculateLocalBaseline(quiz);
    const ai = getGenAIClient();

    if (!ai) {
      // Return beautiful, accurate simulated onboarding response
      const personaName = quiz.commuteMode === 'walk-cycle' ? 'Active Eco-Explorer' :
                          quiz.diet === 'vegan' ? 'Green Plate Pioneer' : 'Mindful Consumer';

      return res.json({
        profile: {
          name: personaName,
          baselineScore: localStats.baselineScore,
          baselineBreakdown: localStats.baselineBreakdown,
          targetScore: Math.round((localStats.baselineScore * 0.75) * 10) / 10, // 25% reduction target
          personalizedWelcome: `Welcome to EcoTrace! Based on your 2-minute onboarding profile, your primary impact area comes from **${localStats.baselineBreakdown.home > localStats.baselineBreakdown.travel ? 'Home Energy' : 'Travel & Commutes'}**. Fortunately, simple micro-habits like switching to energy savers and habit stacking can reduce your carbon footprint by up to 25%!`,
          initialHabits: [
            quiz.commuteMode === 'car' ? 'Walk or bike for short trips under 1.5 miles' : 'Turn down home thermostat by 1°C',
            quiz.diet === 'high-meat' ? 'Introduce Meatless Mondays into your weekly meal planning' : 'Unplug your home electronics and game consoles before bed',
            'Repurpose or repair one old clothing item instead of buying new'
          ],
        },
        isFallbackActive: true,
      });
    }

    // Try to call Gemini, with immediate fallback on any API error or 503 overload
    try {
      // Call Gemini for custom creative insights & persona categorization
      const prompt = `Based on this carbon onboarding profile, calculate a personalized person scope:
        Diet: ${quiz.diet}
        Commute: ${quiz.commuteMode} (${quiz.weeklyMileage} miles/week)
        Flights/year: ${quiz.flightsPerYear}
        Home energy heating source: ${quiz.homeEnergy}
        Home size: ${quiz.homeSize}
        Shopping consumption level: ${quiz.shoppingHabits}

        Calculate carbon score strictly in metric Tons of CO2 per year. Use these estimates as anchor guidelines (Vegan/Transit car-free starts on average at 1.8 Tons, Heavy meat/flying/large home starts at 12 Tons).
        Provide:
        1. A custom creative environmental persona tier Name (e.g., "Solar Sentinel", "Eco-Minimalist", "Transit Champion").
        2. The total baselineScore in Tons (accurate to 1 decimal place).
        3. The category breakdown (home, travel, food, shopping) that perfectly match the sum of baselineScore.
        4. A personalized, positive-framed, inspiring 3-sentence welcome text emphasizing positive reinforcement for their current habits, and noting their highest category.
        5. Exactly 3 tailored micro-actions (max 10 words each) for daily checkboxes.

        Requirements: Return JSON format strictly.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: 'Creative persona name' },
              baselineScore: { type: Type.NUMBER, description: 'Total metric Tons/year' },
              baselineBreakdown: {
                type: Type.OBJECT,
                properties: {
                  home: { type: Type.NUMBER },
                  travel: { type: Type.NUMBER },
                  food: { type: Type.NUMBER },
                  shopping: { type: Type.NUMBER },
                },
                required: ['home', 'travel', 'food', 'shopping'],
              },
              personalizedWelcome: { type: Type.STRING, description: 'Positive framed welcomer' },
              initialHabits: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Exactly 3 short tailored daily habits'
              },
            },
            required: ['name', 'baselineScore', 'baselineBreakdown', 'personalizedWelcome', 'initialHabits'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      // Ensure numeric alignments
      const total = Math.round(parsed.baselineScore * 10) / 10;
      const home = Math.round(parsed.baselineBreakdown.home * 10) / 10;
      const travel = Math.round(parsed.baselineBreakdown.travel * 10) / 10;
      const food = Math.round(parsed.baselineBreakdown.food * 10) / 10;
      const shopping = Math.round(parsed.baselineBreakdown.shopping * 10) / 10;

      res.json({
        profile: {
          name: parsed.name || 'Eco Advocate',
          baselineScore: total || localStats.baselineScore,
          baselineBreakdown: { home, travel, food, shopping },
          targetScore: Math.round((total * 0.75) * 10) / 10,
          personalizedWelcome: parsed.personalizedWelcome,
          initialHabits: parsed.initialHabits && parsed.initialHabits.length ? parsed.initialHabits : [
            quiz.commuteMode === 'car' ? 'Walk or bike for short trips under 1.5 miles' : 'Turn down home thermostat by 1°C',
            quiz.diet === 'high-meat' ? 'Introduce Meatless Mondays into your meal planning' : 'Unplug home electronics and consoles before bed',
            'Repurpose or repair one old clothing item instead of buying new'
          ],
        },
        isFallbackActive: false,
      });
    } catch (aiError: any) {
      console.warn('[EcoTrace Onboarding Warning] Gemini unavailable or experiencing 503 overload. Falling back to local calculator engine.', aiError);
      const personaName = quiz.commuteMode === 'walk-cycle' ? 'Active Eco-Explorer' :
                          quiz.diet === 'vegan' ? 'Green Plate Pioneer' : 'Mindful Consumer';

      res.json({
        profile: {
          name: personaName,
          baselineScore: localStats.baselineScore,
          baselineBreakdown: localStats.baselineBreakdown,
          targetScore: Math.round((localStats.baselineScore * 0.75) * 10) / 10,
          personalizedWelcome: `Welcome to EcoTrace! Based on your 2-minute onboarding profile, your primary impact area comes from **${localStats.baselineBreakdown.home > localStats.baselineBreakdown.travel ? 'Home Energy' : 'Travel & Commutes'}**. Fortunately, simple micro-habits like switching to energy savers and habit stacking can reduce your carbon footprint by up to 25%!`,
          initialHabits: [
            quiz.commuteMode === 'car' ? 'Walk or bike for short trips under 1.5 miles' : 'Turn down home thermostat by 1°C',
            quiz.diet === 'high-meat' ? 'Introduce Meatless Mondays into your meal planning' : 'Unplug home electronics and consoles before bed',
            'Repurpose or repair one old clothing item instead of buying new'
          ],
        },
        isFallbackActive: true,
      });
    }
  } catch (error: any) {
    console.error('[EcoTrace AI Baseline Error]:', error);
    res.status(500).json({ error: 'Server computation error: ' + error.message });
  }
});

// REST route: POST /api/insights/generate
app.post('/api/insights/generate', async (req, res) => {
  try {
    const { profile, ecoPoints, streakCount, habits, manualLogs, integrations, transactions, bills, commutes } = req.body;

    if (!profile) {
      return res.status(400).json({ error: 'Profile is needed for AI feedback' });
    }

    const ai = getGenAIClient();

    // Default mock data solver
    const generateLocalInsights = (): any => {
      const insightsList = [
        {
          id: 'insight-1',
          type: 'insight',
          title: 'Phantom Power Inroads',
          text: 'Unplugging electronics before bed has avoided 1.8 kg of continuous passive carbon drain.',
          impactValue: '-2.4 kg CO₂ saved',
          color: 'green'
        },
        {
          id: 'insight-2',
          type: 'insight',
          title: 'Commute Pattern Progress',
          text: 'Ingested logs show a 10% decrease in driving miles. Keep walking for errands!',
          impactValue: '-8.5 kg CO₂ saved',
          color: 'green'
        }
      ];

      // Add a dynamic alert if they have gas bills or driving fuel transactions
      if (integrations.utilityConnected && bills && bills.length > 0) {
        insightsList.push({
          id: 'insight-3',
          type: 'anomaly',
          title: 'Heating Energy Spike',
          text: 'Your electricity/gas billing period reflects a 12% increase compared to baseline. Check for drafts!',
          impactValue: '+15.2 kg CO₂ spike',
          color: 'yellow'
        });
      } else {
        insightsList.push({
          id: 'insight-4',
          type: 'forecast',
          title: 'Year-End Carbon Path',
          text: 'If you maintain your streak of habits, your projected carbon footprint will fall from your baseline of ' + profile.baselineScore + ' Tons to ' + Math.round(profile.baselineScore * 0.8 * 10) / 10 + ' Tons by December.',
          impactValue: '20% average drop',
          color: 'green'
        });
      }

      return {
        insights: insightsList.slice(0, 3),
        predictiveForecast: `Based on your steady ${streakCount}-day habit streak, you are on target to lower your annual net emissions trajectory to ${Math.round(profile.baselineScore * 0.81 * 10) / 10} Tons, beating your target of ${profile.targetScore} Tons! Keep stacking habits weekly.`,
        habitStackSuggestions: [
          'Stack: When returning home in a car, log short-distance driving instantly and plan to cluster shopping runs.',
          'Stack: If starting to prep steak, match it with 1 completely meat-and-dairy-free lunch.'
        ],
        isFallbackActive: true
      };
    };

    if (!ai) {
      return res.json(generateLocalInsights());
    }

    // Call Gemini with rich real-time context
    const completedHabits = habits.filter((h: any) => h.completed).map((h: any) => h.text).join(', ');
    const activeIntegrations = [
      integrations.utilityConnected ? 'Utility Provider API' : '',
      integrations.bankingConnected ? 'Open Banking' : '',
      integrations.fitnessConnected ? 'GPS Fitness/Smartphone Health' : ''
    ].filter(Boolean).join(', ') || 'No automation integrations connected yet';

    const recentTransactions = transactions.slice(0, 5).map((t: any) => `${t.merchant} (${t.category}): ${t.carbonImpactKg}kg CO2`).join('\n');
    const recentCommutes = commutes.slice(0, 3).map((c: any) => `${c.mode} for ${c.distanceMiles} miles: ${c.carbonImpactKg}kg CO2`).join('\n');

    const prompt = `Analyze this live eco tracker state and provide:
      1. Exactly 3 assessable insights with types ('insight' | 'anomaly' | 'forecast'). Frame them constructively with positive reinforcement. Format with visual urgency color ('green', 'yellow', or 'red').
      2. A year-end predictive carbon emissions projection (2 sentences) comparing their baseline (${profile.baselineScore} Tons) and target (${profile.targetScore} Tons) to current activity savings.
      3. Exactly 2 custom actionable habit stack ideas based on their profile and connected automated integrations (Integrations: ${activeIntegrations}).

      Current Stats:
      - Baseline Carbon: ${profile.baselineScore} Tons/year
      - Target Carbon: ${profile.targetScore} Tons/year
      - Active Habit Streaks: ${streakCount} days
      - Habits completed today: ${completedHabits || 'None yet'}
      - Active automated integrations connected: ${activeIntegrations}
      - Ingested mock transaction entries:\n${recentTransactions || 'None'}
      - Commute tracking history:\n${recentCommutes || 'None'}

      Provide your findings in JSON format strictly corresponding to the following schema.`;

    // Try to call Gemini, with immediate fallback on any API error or 503 overload
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              insights: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    type: { type: Type.STRING, description: 'insight, anomaly, or forecast' },
                    title: { type: Type.STRING },
                    text: { type: Type.STRING },
                    impactValue: { type: Type.STRING, description: 'e.g., -12kg avoided, +15% spike, or etc.' },
                    color: { type: Type.STRING, description: 'green, yellow, or red' },
                  },
                  required: ['id', 'type', 'title', 'text', 'impactValue', 'color'],
                },
              },
              predictiveForecast: { type: Type.STRING, description: 'Trajectorial forecast' },
              habitStackSuggestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Exactly 2 stack recommendations'
              },
            },
            required: ['insights', 'predictiveForecast', 'habitStackSuggestions'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      res.json({
        ...parsed,
        isFallbackActive: false
      });
    } catch (aiError: any) {
      console.warn('[EcoTrace Insights Warning] Gemini unavailable or experiencing 503 overload. Falling back to local formula insights.', aiError);
      res.json(generateLocalInsights());
    }

  } catch (error: any) {
    console.error('[EcoTrace AI Insights Error]:', error);
    res.status(500).json({ error: 'Server evaluation error: ' + error.message });
  }
});

// Serve API routes first, then Vite assets / SPA HTML
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
