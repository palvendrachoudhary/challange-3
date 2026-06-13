# EcoTrace: Smart Dynamic Assistant & Carbon Tracking

EcoTrace is a full-stack smart application designed to serve as a dynamic eco-assistant that tracks and reduces your carbon footprint through logical decision making based on your unique user context.

---

## 1. Chosen Vertical
**Sustainability & Carbon Footprint Tracking**
Our solution targets climate-conscious digital consumers, corporate wellness programs, and urban populations. We focused heavily on achieving practical and real-world usability. Rather than emphasizing climate guilt, EcoTrace employs *Positive Framing*—championing habits completed and carbon reduced.

---

## 2. Approach and Logic (Problem Statement Alignment)

**1. Ability to build a smart, dynamic assistant:**
We developed a real-time `SmartAssistant` component that operates as a dynamic chat companion inside the app. It detects the user's current baseline score, active goals, and habits, delivering context-aware advice instantly. It is fully integrated with the user's dashboard ecosystem.

**2. Logical decision making based on user context:**
The application continuously performs logical decision making based on the user's exact context:
- During the onboarding wizard, the app uses conditional logic based on diet, transit, and housing size to generate a unique carbon target score.
- The `SmartAssistant` logic dynamically adapts its advice depending on whether the user asks about their score, habit tips, or missing goals, securely pulling from the user's `ecoState`.
- The `PremiumSuite` leverages user states to compute exact live standby-power savings based on the connected IoT plug instances.

**3. Practical and real-world usability:**
The interface was crafted strictly adhering to modern HCI (Human-Computer Interaction) guidelines:
- Fully accessible layouts with proper ARIA labels.
- Responsive mobile-first design, usable in everyday scenarios.
- Gamification mechanics, local integrations, and data visualization make tracking sustainable habits realistic rather than overwhelming.

---

## 3. How the Solution Works
1. **Onboarding Quiz (User Context Genesis)**: Users start with a short wizard that collects their specific lifestyle configuration.
2. **Dashboard & Habit Tracking**: The core UI displays a realtime progress wheel, active goals, and net avoided CO₂ in kg.
3. **Smart Assistant**: A floating AI agent provides dynamic coaching tailored to the user's score and lifestyle.
4. **Smart Integration Simulators**: Users can connect simulated "Smart Integrations" (utilities, banking, fitness) mimicking real-world API pulls.
5. **Community Shop & Leaderboards**: Drives engagement using points-based economics and global comparisons.

---

## 4. Assumptions Made
- **Local Simulation**: All backend APIs, LLM generation, and database interactions are simulated or mocked locally to ensure a zero-setup, secure, and standalone responsive demonstration.
- **Impact Metrics**: The carbon conversion formulas used for scoring and insights represent stylized approximations.
- **Security**: Strict encryption protocols assumed for any real OAuth integrations.

---

## 🛠️ Technology Stack & Integrity
- **Frontend**: React (v19), TypeScript (`src/types.ts`), and Lucide React vectors.
- **Build Tooling**: Vite & Vitest.
- **Styling**: Tailwind CSS (v4) with fully responsive layouts.
- **Testing**: Highly covered by component unit tests using `@testing-library/react` and `vitest`. Tested for high structural coverage to ensure production stability.
- **Security & Accessibility**: Built with contrast-safe palettes, semantic HTML arrays, and strict prop-typing to enforce safety.
