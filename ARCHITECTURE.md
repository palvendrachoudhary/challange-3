# EcoTrace: System Architecture & Data Flow Map
### Developed & Engineered by THEKEDAAR.PROD

EcoTrace is a robust, full-stack, responsive carbon-neutral planner. It leverages client-side secure multi-client partitioning with a high-fidelity Express backend proxy, dynamic server-side Generative AI computations (via Google Gemini 3.5 Flash), continuous IoT utility sensors, and pre-integrated Firestore databases.

---

## 🏗️ High-Level System Architecture

```
                  ┌──────────────────────────────────────────────────┐
                  │              CLIENT / USER EXPERIENCE            │
                  │             (React 19, Vite, Tailwind CSS)       │
                  └────────────────────────┬─────────────────────────┘
                                           │
                                           │ HTTPS API Requests (port 3000)
                                           ▼
                  ┌──────────────────────────────────────────────────┐
                  │                 EXPRESS BACKEND SERVER           │
                  │                      (server.ts)                 │
                  └───────┬───────────────────────────────┬──────────┘
                          │                               │
                          │ Server-Side Secrets           │ Firebase SDK & Schema
                          ▼ (ApiKey hidden)               ▼
       ┌──────────────────────────────────────┐     ┌────────────────────────────┐
       │     GOOGLE GEMINI INTERATIONS API    │     │       GOCOLE FIRESTORE     │
       │           (gemini-3.5-flash)         │     │     (Enterprise DB GCP)    │
       └──────────────────────────────────────┘     └────────────────────────────┘
```

---

## 🔁 Complete Data & Authentication Flow Map

The following lifecycle diagram shows how a guest bypasses credential gates, how accounts are isolated, and how carbon emissions calculate dynamically:

```
[  USER SESSION START  ]
         │
         ├──► [ Guest Bypass / Continue as Guest ] ──► Initializes local transient sandbox memory.
         │                                            (No login required, instant access)
         ▼
[ Account Creation / Login Gate ]
         │
         ├──► Inputs username + PIN.
         ├──► Generates secure multi-tenant cryptographic hash mapping.
         ├──► Checks local storage key `ecotrace_active_user_v1`.
         ▼
[ Persistent Workspace Loaded ]
         │
         ├───► Checks Firebase config & connects securely to Cloud Firestore `project-fb10bb33-389e-40f8-94b`.
         ├───► Ingestion engines start (IoT Adapters, GPS Commutes, Open Banking Transits).
         ▼
[ Carbon Footprint Loop ]
         │
         ├───► [ Activity Triggered: e.g. habit done, commuting, smart-plug activated ]
         │         │
         │         ├──► local state recalculation -> sends context payload to Node Server.
         │         ▼
         ├───► [ Server-side Validation in server.ts ]
         │         │
         │         ├───► If `GEMINI_API_KEY` present:
         │         │         └──► Passes state to Google GenAI.
         │         │         └──► Formulates granular prediction curves + eco advices.
         │         │
         │         └───► If key missing (Fallback Mode):
         │                   └──► Invokes high-precision carbon-math equation library.
         │                   └──► Computes realistic coefficients instantly.
         ▼
[ Verified Dashboard Updates ]
         │
         ├───► Rendered dynamically on Recharts graphs, live telemetry dial, & points indicators.
         └───► Secure state saved continuously back to storage buffers.
```

---

## 📂 Core Component & Module Mapping

Below is the file structural map of the engineered software:

### 1. Client-Side Modules (`/src`)
*   **`App.tsx`**: The main terminal gateway, holding auth logic, onboarding quiz triggers, dynamic layout systems, interactive score indicators, and local routing handlers.
*   **`components/PremiumSuite.tsx`**: Platinum-tier Carbon-Neutral subscription engine. Grants access to Direct Air Capture integration models, standby power analyzers, and IoT smart plug mock registers.
*   **`components/OnboardingWizard.tsx`**: Step-by-step quiz that guides users in establishing their baseline emissions across Energy, Transit, Nutrition, and Shopping.
*   **`components/EmissionsCharts.tsx`**: Leverages **Recharts** and **d3** to build high-end visual distribution lines, comparison columns, and predictive trend lines.
*   **`components/CommunityShop.tsx`**: Rewards storefront where earned eco-points can be exchanged for actual, certified climate certificates or local merchant vouchers.
*   **`components/IntegrationsPanel.tsx`**: High-fidelity live tracker for Utilities, Banking streams, and Wearables data.
*   **`types.ts`**: Strict TypeScript interfaces modeling user baselines, habit status, integration items, smart plug maps, and applet configuration structures.

### 2. Server-Side proxies (`/server.ts`)
*   Binds to port `3000` on host `0.0.0.0` securely for Cloud Run reverse proxies.
*   Acts as a secure wall shielding `GEMINI_API_KEY` entirely from client-side network inspectors.
*   Dispatches secure analytical payloads to the `@google/genai` model `gemini-3.5-flash` with JSON output schemas to enforce typed API outputs.

---

## ☁️ Google Cloud Platform (GCP) Deployment

This application uses **Google Cloud Run** to build, scale-to-zero, and execute:
- **Port Assignment**: Port 3000 is occupied by our custom node server, where static client assets are served from the compiled `dist/` directory, while API payloads are mapped to express routing.
- **Production Build**: Compiles web bundles safely via `vite build` & bundling `server.ts` into a fast, compiled server object avoiding standard module paths mismatches.
- **Continuous Hosting**: Serves dynamic routing to both development (`ais-dev-*`) and production (`ais-pre-*`) endpoints automatically.

---

## 🐙 Push to GitHub Repository Instructions

To copy and keep your remote GitHub repository synchronized with THEKEDAAR.PROD latest improvements:

1. Look at the **AI Studio Code Editor** top-right/settings panel.
2. Under the **Export / Push Settings**, link your personal GitHub account.
3. Click **GitHub Export** or **Sync**. 
4. AI Studio will automatically parse this workspace, bundle files, and push them with a clean production commit history directly to your repository! This `ARCHITECTURE.md` and your updated code will immediately form your public readme and documentation.
