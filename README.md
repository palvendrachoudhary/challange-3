# EcoTrace: Gamified Carbon Tracking & Habits Stack

EcoTrace is a full-stack web and mobile application designed to gamify carbon footprint reduction. By automating tracks via simulated integrations, calculating personal carbon matrices using secure Google Gemini 3.5 AI APIs, and applying behavioral science templates, it empowers users to sustain long-term eco-centric habits.

---

## 🎯 Chosen Vertical & Persona Theme
Our solution targets **climate-conscious digital consumers, corporate wellness programs, and urban populations**. Rather than emphasizing climate guilt, EcoTrace employs **Positive Framing**—championing habits completed and carbon reduced. 

Visual design is paired around a **Modern Slate and Mint Crisp Theme**, utilizing generous negative space, crisp layout rhythms, high visual scannability, and rich interactive feedback loops.

---

## 🌟 Solution Highlights & Features

1. **2-Minute Carbon Footprint Quiz**
   - Estimates initial carbon profile baseline sectors (Home Energy, Travel, Food, Goods) using mathematically accurate default equations or targeted Gemini AI evaluations.
   
2. **Sleek Interactive Progress Wheel**
   - Displays real-time dynamic scores, active goals, and net avoided CO₂ in tons/year. Reacts instantly to completed habits and automated integration ingestion.

3. **Smart Integration Simulators**
   - **Utility Provider API**: Automates electricity and natural gas bill therm calculations.
   - **Open Banking Ledger**: Detects card transactions, evaluating emissions (e.g. Fuel purchase spikes vs Organic sustainable partner purchases).
   - **GPS Commute Tracker**: Integrates fitness steps (Strava/Fitbit API) to auto-log fuel-saving biking and walking.

4. **Google Gemini Personalized Alerts**
   - Integrates server-side with Gemini 3.5 Flash using strict, validated type schemas to deliver:
     - Anomaly detection (spikes in utilities).
     - Year-End predictive trend forecasting.
     - Custom "Habit Stacking" guidelines structured for user profiles.

5. **Gamified Quests & Rewards Marketplace**
   - Earn eco-points, keep fire streaks active, and redeem custom generated codes for genuine offsets and sustainable merchant discounts.

---

## 🛠️ Technology Stack & Integrity
- **Frontend**: React (v19) with modern hooks, TypeScript (type declarations in structural `src/types.ts`), and Lucide React vectors.
- **Backend**: Express.js server administering secure proxy endpoints—safeguarding API keys entirely of client browser exposure.
- **Styling**: Tailwind CSS (v4) with customized cubic-bezier transitions.
- **AI Integration**: Official `@google/genai` TypeScript SDK deploying the lightning fast, highly accurate `gemini-3.5-flash` model.

---

## 🔒 Safe Fallback Architecture & Operations
If the key `GEMINI_API_KEY` is not filled within the runtime environment, the backend gracefully activates our **Math-based Formula Calculation Engine**. It returns realistic carbon matrices and prompts a user-safe helper toast, ensuring zero runtime applet crashes.
