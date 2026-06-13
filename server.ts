/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

const BUDGET_FILE = path.join(process.cwd(), 'api_usage_budget.json');
const BUDGET_LIMIT_USD = 1.00;

// Stable cost monitoring counters
let budgetState = {
  totalCostUsd: 0.0,
  requestCount: 0,
};

function loadBudget() {
  try {
    if (fs.existsSync(BUDGET_FILE)) {
      const data = fs.readFileSync(BUDGET_FILE, 'utf8');
      const parsed = JSON.parse(data);
      if (typeof parsed.totalCostUsd === 'number') {
        budgetState.totalCostUsd = parsed.totalCostUsd;
      }
      if (typeof parsed.requestCount === 'number') {
        budgetState.requestCount = parsed.requestCount;
      }
    }
  } catch (err) {
    console.warn('[Budget Warning] Failed to parse budget ledger file, using default trackers:', err);
  }
}

function saveBudget() {
  try {
    fs.writeFileSync(BUDGET_FILE, JSON.stringify(budgetState, null, 2), 'utf8');
  } catch (err) {
    console.warn('[Budget Warning] Ledger save failed:', err);
  }
}

// Bind state on startup
loadBudget();

function addUsage(promptTokens: number, candidateTokens: number) {
  // Input: $0.075 per 1M tokens ($0.000000075)
  // Output: $0.30 per 1M tokens ($0.000000300)
  const inputCost = promptTokens * 0.000000075;
  const outputCost = candidateTokens * 0.000000300;
  const totalCost = inputCost + outputCost;

  budgetState.totalCostUsd += totalCost;
  budgetState.requestCount += 1;
  saveBudget();
  console.log(`[EcoTrace Quota Manager] Prompt tokens: ${promptTokens}, Response tokens: ${candidateTokens}. Cost: $${totalCost.toFixed(6)}. Cumulative state: $${budgetState.totalCostUsd.toFixed(6)} / $${BUDGET_LIMIT_USD.toFixed(2)}`);
}

function getBudgetResponse() {
  return {
    totalCostUsd: Number(budgetState.totalCostUsd.toFixed(6)),
    limitUsd: BUDGET_LIMIT_USD,
    requestCount: budgetState.requestCount,
    isLimitReached: budgetState.totalCostUsd >= BUDGET_LIMIT_USD
  };
}

// IP rate limiter tracking record
const rateLimits: Record<string, { timestamps: number[] }> = {};

function rateLimitMiddleware(req: any, res: any, next: any) {
  const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 min window
  const limit = 30; // 30 calls maximum

  if (!rateLimits[ip]) {
    rateLimits[ip] = { timestamps: [] };
  }

  rateLimits[ip].timestamps = rateLimits[ip].timestamps.filter(t => now - t < windowMs);

  if (rateLimits[ip].timestamps.length >= limit) {
    return res.status(429).json({ 
      error: 'Security alert: IP rate limit exceeded. Requests are capped at 30 per 15 minutes.' 
    });
  }

  rateLimits[ip].timestamps.push(now);
  next();
}

// Inputs parser validator to prevent Prompt Injection attempts
function sanitizeInput(text: any): string {
  if (typeof text !== 'string') return '';
  let sanitized = text;
  
  const suspiciousKeywords = [
    /ignore previous/gi,
    /system instruction/gi,
    /ignore instructions/gi,
    /ignore all/gi,
    /bypass rules/gi,
    /override rules/gi,
    /api key/gi,
    /process\.env/gi
  ];
  
  for (const regex of suspiciousKeywords) {
    sanitized = sanitized.replace(regex, '[CLEANED]');
  }
  
  return sanitized.substring(0, 150).trim();
}

// Error logger that redacts any credential string leaks
function safeErrorLog(message: string, error: any) {
  let errStr = String(error?.stack || error?.message || error);
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey.length > 5) {
    errStr = errStr.replaceAll(apiKey, '[REDACTED_API_KEY]');
  }
  console.error(`${message}:`, errStr);
}

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
  const q = {
    homeSize: quiz?.homeSize || 'medium-house',
    homeEnergy: quiz?.homeEnergy || 'grid-electric',
    commuteMode: quiz?.commuteMode || 'car',
    weeklyMileage: typeof quiz?.weeklyMileage === 'number' ? quiz.weeklyMileage : (Number(quiz?.weeklyMileage) || 35),
    flightsPerYear: typeof quiz?.flightsPerYear === 'number' ? quiz.flightsPerYear : (Number(quiz?.flightsPerYear) || 1),
    diet: quiz?.diet || 'balanced',
    shoppingHabits: quiz?.shoppingHabits || 'average'
  };

  let home = 2.0; // Apartment default
  if (q.homeSize === 'medium-house') home = 3.5;
  if (q.homeSize === 'large-house') home = 5.2;

  if (q.homeEnergy === 'electric-solar') home *= 0.15; // Solar offset
  if (q.homeEnergy === 'grid-electric') home *= 0.8;

  let travel = 0.5; // low travel
  if (q.commuteMode === 'car') {
    travel += (q.weeklyMileage * 52 * 0.404) / 1000; // 0.404 kg per mile
  } else if (q.commuteMode === 'electric-car') {
    travel += (q.weeklyMileage * 52 * 0.12) / 1000;
  } else if (q.commuteMode === 'public-transit') {
    travel += (q.weeklyMileage * 52 * 0.14) / 1000;
  } else {
    travel += 0.05; // walk/cycle minor emissions
  }

  // flights: approx 0.8 Tons per average domestic/medium flight
  travel += q.flightsPerYear * 0.8;

  let food = 1.5; // balanced
  if (q.diet === 'vegan') food = 0.5;
  if (q.diet === 'vegetarian') food = 0.9;
  if (q.diet === 'high-meat') food = 2.8;

  let shopping = 1.0;
  if (q.shoppingHabits === 'minimalist') shopping = 0.3;
  if (q.shoppingHabits === 'frequent-buyer') shopping = 2.4;

  const total = Math.round((home + travel + food + shopping) * 10) / 10;

  return {
    baselineScore: isNaN(total) ? 12.0 : total,
    baselineBreakdown: {
      home: isNaN(home) ? 3.5 : Math.round(home * 10) / 10,
      travel: isNaN(travel) ? 4.2 : Math.round(travel * 10) / 10,
      food: isNaN(food) ? 1.5 : Math.round(food * 10) / 10,
      shopping: isNaN(shopping) ? 1.8 : Math.round(shopping * 10) / 10,
    },
  };
}

// REST route: POST /api/onboarding/profile
app.post('/api/onboarding/profile', rateLimitMiddleware, async (req, res) => {
  let quiz = req.body || {};
  try {
    // Sanitize user inputs to shield against command injections
    quiz.diet = sanitizeInput(quiz.diet) || 'balanced';
    quiz.commuteMode = sanitizeInput(quiz.commuteMode) || 'car';
    quiz.homeEnergy = sanitizeInput(quiz.homeEnergy) || 'grid-electric';
    quiz.homeSize = sanitizeInput(quiz.homeSize) || 'medium-house';
    quiz.shoppingHabits = sanitizeInput(quiz.shoppingHabits) || 'average';

    const localStats = calculateLocalBaseline(quiz);
    const ai = getGenAIClient();
    const budgetReached = budgetState.totalCostUsd >= BUDGET_LIMIT_USD;

    if (!ai || budgetReached) {
      const personaName = quiz.commuteMode === 'walk-cycle' ? 'Active Eco-Explorer' :
                          quiz.diet === 'vegan' ? 'Green Plate Pioneer' : 'Mindful Consumer';

      return res.json({
        profile: {
          name: personaName,
          baselineScore: localStats.baselineScore,
          baselineBreakdown: localStats.baselineBreakdown,
          targetScore: Math.round((localStats.baselineScore * 0.75) * 10) / 10, // 25% reduction target
          personalizedWelcome: `Welcome to EcoTrace! Based on your 2-minute onboarding profile, your primary impact area comes from **${localStats.baselineBreakdown.home > localStats.baselineBreakdown.travel ? 'Home Energy' : 'Travel & Commutes'}**. Fortunately, simple micro-habits like switching to energy savers can reduce your carbon footprint by up to 25%! (Calculator running locally ${budgetReached ? 'due to safety spending caps' : 'due to key settings'}).`,
          initialHabits: [
            quiz.commuteMode === 'car' ? 'Walk or bike for short trips under 1.5 miles' : 'Turn down home thermostat by 1°C',
            quiz.diet === 'high-meat' ? 'Introduce Meatless Mondays into your weekly meal planning' : 'Unplug your home electronics and game consoles before bed',
            'Repurpose or repair one old clothing item instead of buying new'
          ],
        },
        isFallbackActive: true,
        apiBudget: getBudgetResponse()
      });
    }

    // Try to call Gemini, with immediate fallback on any API error or 503 overload
    try {
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

      // Track exact or estimated budget cost
      const usage = response.usageMetadata;
      if (usage) {
        addUsage(usage.promptTokenCount || 0, usage.candidatesTokenCount || 0);
      } else {
        addUsage(1500, 300);
      }

      const parsed = JSON.parse(response.text || '{}');
      
      // Ensure numeric alignments with safe nullish values falling back to localStats
      const parsedScore = typeof parsed?.baselineScore === 'number' && !isNaN(parsed.baselineScore) ? parsed.baselineScore : localStats.baselineScore;
      const total = Math.round(parsedScore * 10) / 10;
      
      const parsedHome = typeof parsed?.baselineBreakdown?.home === 'number' && !isNaN(parsed.baselineBreakdown.home) ? parsed.baselineBreakdown.home : localStats.baselineBreakdown.home;
      const home = Math.round(parsedHome * 10) / 10;
      
      const parsedTravel = typeof parsed?.baselineBreakdown?.travel === 'number' && !isNaN(parsed.baselineBreakdown.travel) ? parsed.baselineBreakdown.travel : localStats.baselineBreakdown.travel;
      const travel = Math.round(parsedTravel * 10) / 10;
      
      const parsedFood = typeof parsed?.baselineBreakdown?.food === 'number' && !isNaN(parsed.baselineBreakdown.food) ? parsed.baselineBreakdown.food : localStats.baselineBreakdown.food;
      const food = Math.round(parsedFood * 10) / 10;
      
      const parsedShopping = typeof parsed?.baselineBreakdown?.shopping === 'number' && !isNaN(parsed.baselineBreakdown.shopping) ? parsed.baselineBreakdown.shopping : localStats.baselineBreakdown.shopping;
      const shopping = Math.round(parsedShopping * 10) / 10;

      res.json({
        profile: {
          name: parsed.name || 'Eco Advocate',
          baselineScore: total,
          baselineBreakdown: { home, travel, food, shopping },
          targetScore: Math.round((total * 0.75) * 10) / 10,
          personalizedWelcome: parsed.personalizedWelcome || `Welcome to EcoTrace! Based on your onboarding profile, your primary impact area comes from **${home > travel ? 'Home Energy' : 'Travel & Commutes'}**. Fortunately, simple micro-habits can lower this significantly!`,
          initialHabits: parsed.initialHabits && parsed.initialHabits.length ? parsed.initialHabits.slice(0, 3) : [
            quiz.commuteMode === 'car' ? 'Walk or bike for short trips under 1.5 miles' : 'Turn down home thermostat by 1°C',
            quiz.diet === 'high-meat' ? 'Introduce Meatless Mondays into your meal planning' : 'Unplug home electronics and consoles before bed',
            'Repurpose or repair one old clothing item instead of buying new'
          ],
        },
        isFallbackActive: false,
        apiBudget: getBudgetResponse()
      });
    } catch (aiError: any) {
      safeErrorLog('[EcoTrace Onboarding Warning] Gemini blocked or overloaded. Falling back to local calculator', aiError);
      const personaName = quiz.commuteMode === 'walk-cycle' ? 'Active Eco-Explorer' :
                          quiz.diet === 'vegan' ? 'Green Plate Pioneer' : 'Mindful Consumer';

      res.json({
        profile: {
          name: personaName,
          baselineScore: localStats.baselineScore,
          baselineBreakdown: localStats.baselineBreakdown,
          targetScore: Math.round((localStats.baselineScore * 0.75) * 10) / 10,
          personalizedWelcome: `Welcome to EcoTrace! Based on your onboarding details, your primary impact area is **${localStats.baselineBreakdown.home > localStats.baselineBreakdown.travel ? 'Home Energy' : 'Travel & Commutes'}**. Fortunately, basic habits like solar/electric swaps can lower this significantly!`,
          initialHabits: [
            quiz.commuteMode === 'car' ? 'Walk or bike for short trips under 1.5 miles' : 'Turn down home thermostat by 1°C',
            quiz.diet === 'high-meat' ? 'Introduce Meatless Mondays into your weekly meal planning' : 'Unplug your home electronics and game consoles before bed',
            'Repurpose or repair one old clothing item instead of buying new'
          ],
        },
        isFallbackActive: true,
        apiBudget: getBudgetResponse()
      });
    }
  } catch (error: any) {
    safeErrorLog('[EcoTrace AI Baseline Error] Resiliency bypass activated', error);
    const localStats = calculateLocalBaseline(quiz);
    const personaName = quiz?.commuteMode === 'walk-cycle' ? 'Active Eco-Explorer' :
                        quiz?.diet === 'vegan' ? 'Green Plate Pioneer' : 'Mindful Consumer';
    res.json({
      profile: {
        name: personaName,
        baselineScore: localStats.baselineScore,
        baselineBreakdown: localStats.baselineBreakdown,
        targetScore: Math.round((localStats.baselineScore * 0.75) * 10) / 10,
        personalizedWelcome: `Welcome to EcoTrace! Based on your onboarding details, your primary impact is **Home Utilities & Travel**. Fortunately, basic habits like solar swaps can lower this! (Continuous Resiliency Active).`,
        initialHabits: [
          'Walk or bike for short trips under 1.5 miles',
          'Introduce Meatless Mondays into your meal planning',
          'Repurpose or repair one old clothing item instead of buying new'
        ],
      },
      isFallbackActive: true,
      apiBudget: getBudgetResponse()
    });
  }
});// REST route: POST /api/insights/generate
app.post('/api/insights/generate', rateLimitMiddleware, async (req, res) => {
  try {
    const { 
      profile, 
      ecoPoints, 
      streakCount, 
      habits = [], 
      manualLogs, 
      utilityConnected = false, 
      bankingConnected = false, 
      fitnessConnected = false, 
      transactions = [], 
      bills = [], 
      commutes = [],
      isPremiumActive = false,
      premiumOffsets = [],
      smartPlugsCount = 0,
      totalSmartSavesKg = 0
    } = req.body;

    if (!profile) {
      return res.status(400).json({ error: 'Profile is needed for AI feedback' });
    }

    const ai = getGenAIClient();
    const budgetReached = budgetState.totalCostUsd >= BUDGET_LIMIT_USD;

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

      if (isPremiumActive && premiumOffsets.length > 0) {
        insightsList.push({
          id: 'insight-premium-offset',
          type: 'insight',
          title: 'Platinum Air Capture & Blue Carbon Active',
          text: `Your ${premiumOffsets.length} active continuous offset subscriptions are working. High-tech Air Capture and Mangrove protection are keeping your net emissions optimized!`,
          impactValue: `-${(premiumOffsets.length * 3.8).toFixed(1)}kg Offset/day`,
          color: 'green'
        });
      }

      if (isPremiumActive && smartPlugsCount > 0) {
        insightsList.push({
          id: 'insight-premium-iot',
          type: 'insight',
          title: 'IoT Standby Shutter Seals',
          text: `Your ${smartPlugsCount} synchronized standby adapters have shuttered phantom vampire voltage drain in key electronics successfully.`,
          impactValue: `-${totalSmartSavesKg}kg stand-by saved`,
          color: 'green'
        });
      }

      // Add a dynamic alert if they have gas bills or driving fuel transactions
      if (utilityConnected && bills && bills.length > 0) {
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
        isFallbackActive: true,
        apiBudget: getBudgetResponse()
      };
    };

    if (!ai || budgetReached) {
      return res.json(generateLocalInsights());
    }

    // Call Gemini with rich real-time context
    const completedHabits = habits.filter((h: any) => h.completed).map((h: any) => sanitizeInput(h.text)).join(', ');
    const activeIntegrations = [
      utilityConnected ? 'Utility Provider API' : '',
      bankingConnected ? 'Open Banking' : '',
      fitnessConnected ? 'GPS Fitness/Smartphone Health' : ''
    ].filter(Boolean).join(', ') || 'No automation integrations connected yet';

    const recentTransactions = transactions.slice(0, 5).map((t: any) => `${sanitizeInput(t.merchant)} (${sanitizeInput(t.category)}): ${t.carbonImpactKg}kg CO2`).join('\n');
    const recentCommutes = commutes.slice(0, 3).map((c: any) => `${sanitizeInput(c.mode)} for ${c.distanceMiles} miles: ${c.carbonImpactKg}kg CO2`).join('\n');

    const premiumStatusString = isPremiumActive 
      ? `ACTIVE PLATINUM PREMIUM CLIENT. Active carbon offset programs subscribed: ${premiumOffsets.join(', ')}. Sync'd home standby smart plugs count: ${smartPlugsCount} (which prevents standby draft carbon).` 
      : `INACTIVE STANDARD TIER (Does not have continuous direct air capture or standby adapters enabled)`;

    const prompt = `Analyze this live eco tracker state and provide:
      1. Exactly 3 assessable insights with types ('insight' | 'anomaly' | 'forecast'). Frame them constructively with positive reinforcement. Format with visual urgency color ('green', 'yellow', or 'red'). If premium status is active, dedicate 1 insight directly highlighting the contribution and efficiency of their high-tech continuous Direct Air Capture or blue-carbon Mangrove subscriptions!
      2. A year-end predictive carbon emissions projection (2 sentences) comparing their baseline (${profile.baselineScore} Tons) and target (${profile.targetScore} Tons) to current activity savings.
      3. Exactly 2 custom actionable habit stack ideas based on their profile and connected automated integrations (Integrations: ${activeIntegrations}). Include VIP advice for optimization of their smart adapters or offset portfolios since they are premium!

      Current Stats:
      - Premium Status: ${premiumStatusString}
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

      // Account spending
      const usage = response.usageMetadata;
      if (usage) {
        addUsage(usage.promptTokenCount || 0, usage.candidatesTokenCount || 0);
      } else {
        addUsage(1800, 450);
      }

      const parsed = JSON.parse(response.text || '{}');
      res.json({
        ...parsed,
        isFallbackActive: false,
        apiBudget: getBudgetResponse()
      });
    } catch (aiError: any) {
      safeErrorLog('[EcoTrace Insights Warning] Gemini unavailable or experiencing overload. Falling back to local formula insights', aiError);
      res.json(generateLocalInsights());
    }

  } catch (error: any) {
    safeErrorLog('[EcoTrace AI Insights Error]', error);
    res.status(500).json({ error: 'Server evaluation error: ' + error.message });
  }
});

// REST route: GET /api/budget
app.get('/api/budget', (req, res) => {
  res.json(getBudgetResponse());
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
