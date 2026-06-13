/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface OnboardingQuiz {
  diet: 'vegan' | 'vegetarian' | 'balanced' | 'high-meat';
  commuteMode: 'walk-cycle' | 'public-transit' | 'car' | 'electric-car';
  weeklyMileage: number;
  flightsPerYear: number;
  homeEnergy: 'heating-gas' | 'electric-solar' | 'grid-electric';
  homeSize: 'apartment' | 'medium-house' | 'large-house';
  shoppingHabits: 'minimalist' | 'average' | 'frequent-buyer';
}

export interface CarbonProfile {
  name: string;
  baselineScore: number; // in Tons of CO2 per year
  baselineBreakdown: {
    home: number;
    travel: number;
    food: number;
    shopping: number;
  };
  targetScore: number; // usually baseline - 20-30%
  personalizedWelcome: string;
  initialHabits: string[];
  quiz?: OnboardingQuiz;
}

export interface HabitTask {
  id: string;
  text: string;
  points: number;
  category: 'home' | 'travel' | 'food' | 'shopping';
  completed: boolean;
  co2SavedKg: number; // CO2 reduced in kg
  history?: number[]; // [0, 100, 100, 0, 100, 100, 100] etc
}

export interface MockTransaction {
  id: string;
  date: string;
  merchant: string;
  amount: number;
  category: 'Fuel' | 'Groceries' | 'Fast Fashion' | 'Electric Bill' | 'Dining Out' | 'Sustainable shop';
  carbonImpactKg: number;
  impactLevel: 'low' | 'moderate' | 'high';
}

export interface MockUtilityBill {
  billingPeriod: string;
  electricityKwh: number;
  gasTherms: number;
  unusualSpikeDetected: boolean;
  carbonImpactKg: number;
}

export interface CommuteLog {
  id: string;
  date: string;
  distanceMiles: number;
  mode: 'walking' | 'cycling' | 'public-transit' | 'driving';
  carbonImpactKg: number;
}

export interface AIInsight {
  id: string;
  type: 'insight' | 'anomaly' | 'forecast';
  title: string;
  text: string;
  impactValue: string; // e.g. "-15% carbon reduction", "+50kg emissions"
  color: 'green' | 'yellow' | 'red';
}

export interface AIInsightsPayload {
  insights: AIInsight[];
  predictiveForecast: string;
  habitStackSuggestions: string[];
  isFallbackActive: boolean;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  targetCategory: 'home' | 'travel' | 'food' | 'shopping';
  targetValue: string;
  pointsReward: number;
  co2SavingsKg: number;
  participantsCount: number;
  joined: boolean;
  progress: number; // 0 to 100
}

export interface UserEcoState {
  profile: CarbonProfile | null;
  habits: HabitTask[];
  loggedActionsCount: number;
  ecoPoints: number;
  streakCount: number;
  lastActiveDate: string | null;
  // Integrations state
  utilityConnected: boolean;
  bankingConnected: boolean;
  fitnessConnected: boolean;
  // Log history
  manualLogs: {
    foodEmissionsKg: number;
    wasteKg: number;
  };
  transactions: MockTransaction[];
  bills: MockUtilityBill[];
  commutes: CommuteLog[];
  challenges: Challenge[];
  // AI Insights caching
  aiInsights: AIInsightsPayload | null;
  aiInsightsLoading: boolean;
  currentEcoFact?: string;
  // Premium membership & smart automation suite integration
  isPremiumActive?: boolean;
  premiumOffsets?: string[];
  smartPlugsCount?: number;
  totalSmartSavesKg?: number;
  dailyCarbonGoalKg?: number;
}
