/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, YAxis } from 'recharts';
import { UserEcoState, CarbonProfile, HabitTask, AIInsightsPayload } from './types';
import OnboardingWizard from './components/OnboardingWizard';
import EmissionsCharts from './components/EmissionsCharts';
import IntegrationsPanel from './components/IntegrationsPanel';
import CommunityLeaderboard from './components/CommunityLeaderboard';
import LocalMap from './components/LocalMap';
import CommunityShop from './components/CommunityShop';
import PremiumSuite from './components/PremiumSuite';
import SmartAssistant from './components/SmartAssistant';
import EcoTipsModal from './components/EcoTipsModal';
import { 
  deriveTenantRowKey, 
  signState, 
  verifyStateIntegrity 
} from './utils/security';
import { 
  Leaf, 
  Flame, 
  Award, 
  Sparkles, 
  Plus, 
  Check, 
  HelpCircle, 
  AlertCircle, 
  Key, 
  MapPin, 
  Activity, 
  RefreshCw,
  LogOut,
  Moon,
  Sun,
  Laptop,
  Shield,
  Lock,
  User,
  UserPlus,
  Users,
  Crown,
  Share2,
  Lightbulb
} from 'lucide-react';

const INITIAL_HABIT_TASKS: HabitTask[] = [
  { id: 'h-1', text: 'Turn off AC and use ceiling fan instead', points: 15, category: 'home', completed: false, co2SavedKg: 1.8, history: [0, 0, 100, 100, 0, 100, 0] },
  { id: 'h-2', text: 'Walk or take a sharing auto for a trip under 2 km', points: 20, category: 'travel', completed: false, co2SavedKg: 3.2, history: [100, 100, 100, 100, 100, 100, 0] },
  { id: 'h-3', text: 'Take your own cloth bag for Sabzi Mandi (grocery) shopping', points: 10, category: 'shopping', completed: false, co2SavedKg: 0.9, history: [0, 100, 0, 100, 0, 100, 0] },
  { id: 'h-4', text: 'Prepare a complete plant-based meal today', points: 15, category: 'food', completed: false, co2SavedKg: 2.4, history: [100, 0, 0, 100, 100, 100, 0] },
];

const INITIAL_CHALLENGES = [
  {
    id: 'ch-1',
    title: 'Meatless Mondays Habit Stack',
    description: 'Sustainably stack meatless menus for lunch and dinner to slash livestock manufacturing impact.',
    targetCategory: 'food' as const,
    targetValue: '1 day',
    pointsReward: 50,
    co2SavingsKg: 15,
    participantsCount: 1421,
    joined: false,
    progress: 0,
  },
  {
    id: 'ch-2',
    title: 'Phantom Power Lockdown',
    description: 'Unplug home consoles, adapters, and appliances when idle to stop vampire energy bleed.',
    targetCategory: 'home' as const,
    targetValue: '7 days',
    pointsReward: 40,
    co2SavingsKg: 8,
    participantsCount: 3950,
    joined: false,
    progress: 0,
  },
  {
    id: 'ch-3',
    title: 'Low Carbon Public Transit Commute',
    description: 'Substitute a 10-mile car drive with train, bus, or monorail public networks.',
    targetCategory: 'travel' as const,
    targetValue: '10 miles',
    pointsReward: 75,
    co2SavingsKg: 35,
    participantsCount: 2005,
    joined: false,
    progress: 0,
  }
];

const getFallbackProfile = (): CarbonProfile => ({
  name: "EcoTrace User",
  baselineScore: 4500,
  targetScore: 3200,
  baselineBreakdown: { home: 1800, travel: 1200, food: 1000, shopping: 500 },
  personalizedWelcome: "Welcome to your Indian EcoTrace Dashboard! Try tracking some eco-friendly actions today to lower your carbon footprint.",
  initialHabits: [],
  quiz: {
    diet: 'balanced',
    commuteMode: 'public-transit',
    weeklyMileage: 30,
    flightsPerYear: 0,
    homeEnergy: 'grid-electric',
    homeSize: 'medium-house',
    shoppingHabits: 'average'
  }
});

const initializeNewTenantState = (): UserEcoState => ({
  profile: getFallbackProfile(),
  habits: INITIAL_HABIT_TASKS,
  loggedActionsCount: 0,
  ecoPoints: 0,
  streakCount: 0,
  lastActiveDate: null,
  utilityConnected: false,
  bankingConnected: false,
  fitnessConnected: false,
  manualLogs: { foodEmissionsKg: 0, wasteKg: 0 },
  transactions: [],
  bills: [],
  commutes: [],
  challenges: INITIAL_CHALLENGES,
  aiInsights: null,
  aiInsightsLoading: false,
});

export default function App() {
  const [activeUser, setActiveUser] = useState<string>(() => {
    return localStorage.getItem('ecotrace_active_user_v1') || 'guest';
  });
  const [activePin, setActivePin] = useState<string>(() => {
    return localStorage.getItem('ecotrace_active_pin_v1') || '0000';
  });
  
  const activeRowKey = deriveTenantRowKey(activeUser, activePin);

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('ecotrace_is_logged_in_v1') === 'true';
  });

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('ecotrace_theme_v1') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('ecotrace_theme_v1', theme);
  }, [theme]);
  
  // Auth Form Panel input states
  const [authTab, setAuthTab] = useState<'signin' | 'signup' | 'guest'>('signin');
  const [authUsername, setAuthUsername] = useState('');
  const [authPin, setAuthPin] = useState('');
  const [authPinConfirm, setAuthPinConfirm] = useState('');
  const [authMessage, setAuthMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  
  const [rlsSecurityAlert, setRlsSecurityAlert] = useState<string | null>(null);

  const [state, setState] = useState<UserEcoState>(() => {
    const saved = localStorage.getItem(activeRowKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.profile) parsed.profile = getFallbackProfile();
        return parsed;
      } catch (e) {
        console.error('State parse error', e);
      }
    }
    return initializeNewTenantState();
  });

  const [apiBudget, setApiBudget] = useState({
    totalCostUsd: 0.0,
    limitUsd: 1.00,
    requestCount: 0,
    isLimitReached: false
  });

  // Manual Quick Logger States
  const [manualFoodSelected, setManualFoodSelected] = useState('veg');
  const [manualMiles, setManualMiles] = useState(5);
  const [customActionText, setCustomActionText] = useState('');
  const [customActionCategory, setCustomActionCategory] = useState<'home' | 'travel' | 'food' | 'shopping'>('home');
  const [habitFilter, setHabitFilter] = useState<'all' | 'home' | 'travel' | 'food' | 'shopping'>('all');
  const [hasCelebratedDailyGoal, setHasCelebratedDailyGoal] = useState(false);
  const [activeDashboardTab, setActiveDashboardTab] = useState<'dashboard' | 'insights' | 'premium' | 'integrations' | 'community' | 'audit'>('dashboard');

  useEffect(() => {
    if (!state.profile) return;
    const savedToday = state.habits.reduce((acc, h) => h.completed ? acc + h.co2SavedKg : acc, 0);
    const target = state.dailyCarbonGoalKg || 5;
    
    if (savedToday >= target && savedToday > 0 && !hasCelebratedDailyGoal) {
      setHasCelebratedDailyGoal(true);
    } else if (savedToday < target && hasCelebratedDailyGoal) {
      setHasCelebratedDailyGoal(false);
    }
  }, [state.habits, state.dailyCarbonGoalKg, hasCelebratedDailyGoal, state.profile]);

  // Load from LocalStorage for persistence on Partition Changes
  useEffect(() => {
    const cached = localStorage.getItem(activeRowKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (verifyStateIntegrity(parsed)) {
          setState(parsed);
          setRlsSecurityAlert(null);
          onQuickSuccessNotification(`Loaded private tenant row: ${activeUser}`);
        } else {
          setRlsSecurityAlert(`CRITICAL ERROR: Integrity checksum failed for cell partition of user [${activeUser}]. Loading safe quarantine state.`);
          setState(initializeNewTenantState());
        }
      } catch (err) {
        console.warn('Corruption found in cached block, reseting...');
        setState(initializeNewTenantState());
      }
    } else {
      setState(initializeNewTenantState());
    }
  }, [activeRowKey]);

  // Pull budget status from server (Disabled for client-only bundle)
  const fetchBudgetStatus = async () => {
    // Return dummy budget since APIs are removed
    setApiBudget({
      totalCostUsd: 0,
      limitUsd: 1.00,
      requestCount: 0,
      isLimitReached: false
    });
  };

  useEffect(() => {
    fetchBudgetStatus();
  }, [activeRowKey]);

  // Sync to outer storage
  const updateState = (updates: Partial<UserEcoState>) => {
    setState((prev) => {
      const next = { ...prev, ...updates };
      const { signature } = signState(next);
      const signedData = { ...next, signature };
      localStorage.setItem(activeRowKey, JSON.stringify(signedData));
      return next;
    });
  };

  const handleOnboardingComplete = (profile: CarbonProfile, isFallback: boolean) => {
    // If the onboarding welcome says they have starter habits, load those if present
    const customHabits: HabitTask[] = (profile.initialHabits && profile.initialHabits.length)
      ? profile.initialHabits.map((h, i) => ({
          id: `onb-h-${i}`,
          text: h,
          points: 15,
          category: i === 0 ? 'travel' : i === 1 ? 'home' : 'shopping',
          completed: false,
          co2SavedKg: i === 0 ? 3.0 : i === 1 ? 1.5 : 0.8
        }))
      : INITIAL_HABIT_TASKS;

    const nextState: UserEcoState = {
      ...state,
      profile,
      habits: customHabits,
      ecoPoints: state.ecoPoints + 20, // onboarding reward points value!
    };

    updateState(nextState);
    setActiveDashboardTab('dashboard');
    triggerAIInsightsUpdate(nextState);
  };

  // Direct computation without API sync
  const triggerAIInsightsUpdate = async (currentState: UserEcoState) => {
    if (!currentState.profile) return;

    setState(prev => ({ ...prev, aiInsightsLoading: true }));
    try {
      // Simulate slight delay before updating insights
      await new Promise(resolve => setTimeout(resolve, 600));

      const ECO_FACTS = [
        "Did you know? Switching to cold water for laundry can save up to 700 kg of CO₂ per year.",
        "Fun fact: Solar rooftops in India can reduce electricity bills by 50% on average.",
        "Did you know? India's local Metro rail systems offset more than 7 lakh tonnes of CO₂ equivalent per year.",
        "Fun fact: Drying your clothes in the sun instead of using a dryer saves significant fossil fuel energy.",
        "Did you know? LED tubelights use up to 90% less energy and last up to 25 times longer than typical incandescent bulbs.",
        "Fact: Replacing heavily packaged deliveries with local Mandi shopping saves huge amounts of packaging waste.",
        "Did you know? Avoiding single-use plastic bags for your groceries heavily reduces toxic landfill waste across Indian cities.",
      ];
      const randomFact = ECO_FACTS[Math.floor(Math.random() * ECO_FACTS.length)];

      const data = {
        insights: [
          {
            id: 'insight-1',
            type: 'insight',
            title: 'Optimal Resource Usage',
            text: 'Your current transit patterns suggest optimal usage compared to baseline averages.',
            impactValue: '-2.4kg CO\u2082 saved',
            color: 'green'
          },
          {
            id: 'insight-2',
            type: 'forecast',
            title: 'Long-term Trajectory',
            text: 'If you maintain current habits, your emission reductions will compound significantly by year-end.',
            impactValue: '15% reduction trend',
            color: 'green'
          }
        ],
        predictiveForecast: `Based on your steady ${currentState.habits.filter(h => h.completed).length}-day habit records, you are on target to lower your annual net emissions trajectory efficiently. Keep stacking habits!`,
        habitStackSuggestions: [
          'Stack: Pair cold water laundry washing with hanging clothes to air dry.',
          'Stack: Unplug unused electronics when leaving the house for the day.'
        ],
        isFallbackActive: true
      };

      setState(prev => {
        const next = { 
          ...prev, 
          aiInsights: data as any, 
          aiInsightsLoading: false,
          currentEcoFact: randomFact
        };
        const { signature } = signState(next);
        localStorage.setItem(activeRowKey, JSON.stringify({ ...next, signature }));
        return next;
      });
    } catch (e) {
      console.warn('Error applying static insights:', e);
      setState(prev => ({ ...prev, aiInsightsLoading: false }));
    }
  };

  // Checkbox interactions
  const handleToggleHabit = (id: string) => {
    const habit = state.habits.find(h => h.id === id);
    if (!habit) return;

    const nextComp = !habit.completed;
    const ptsDiff = nextComp ? habit.points : -habit.points;
    const countDiff = nextComp ? 1 : -1;

    onQuickSuccessNotification(`Logged habit! ${ptsDiff > 0 ? '+' : ''}${ptsDiff} EcoPoints`);

    const nextHabits = state.habits.map((h) => {
      if (h.id === id) {
        const history = h.history ? [...h.history] : [0, 0, 0, 0, 0, 0, 0];
        history[history.length - 1] = nextComp ? 100 : 0;
        return { ...h, completed: nextComp, history };
      }
      return h;
    });

    updateState({
      habits: nextHabits,
      ecoPoints: Math.max(0, state.ecoPoints + ptsDiff),
      loggedActionsCount: Math.max(0, state.loggedActionsCount + countDiff)
    });
  };

  // Web Audio API Success Chime
  const playSuccessSound = () => {
    if (typeof window === 'undefined') return;
    try {
      const AudioContext = (window as Record<string, any>).AudioContext || (window as Record<string, any>).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.1); // C6
      
      gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.warn("Audio play failed:", e);
    }
  };

  // Success message flashes
  const [achievementMsg, setAchievementMsg] = useState<string | null>(null);
  const [isEcoTipsModalOpen, setIsEcoTipsModalOpen] = useState(false);
  const onQuickSuccessNotification = (msg: string) => {
    setAchievementMsg(msg);
    playSuccessSound();
    setTimeout(() => {
      setAchievementMsg(null);
    }, 3000);
  };

  // Log manual selections
  const handleLogManualFood = () => {
    let savedKg = 0;
    let description = '';
    
    if (manualFoodSelected === 'vegan') {
      savedKg = 2.5;
      description = 'Vegan dinner choice';
    } else if (manualFoodSelected === 'veg') {
      savedKg = 1.6;
      description = 'Vegetarian meal option';
    } else {
      savedKg = -0.5;
      description = 'High carbon meat meal';
    }

    const nextPoints = state.ecoPoints + 10;
    
    // Create simulated manual transaction inside history
    const manualTx = {
      id: `manual-f-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      merchant: description,
      amount: 0,
      category: 'Dining Out' as const,
      carbonImpactKg: -savedKg,
      impactLevel: savedKg > 0 ? 'low' as const : 'high' as const
    };

    onQuickSuccessNotification(`Logged dynamic Meal! +10 Pts · Avoided ${savedKg}kg CO₂`);

    updateState({
      ecoPoints: nextPoints,
      transactions: [manualTx, ...state.transactions],
      loggedActionsCount: state.loggedActionsCount + 1
    });

    // Automatically prompt AI to analyze new additions
    setTimeout(() => {
      triggerAIInsightsUpdate({
        ...state,
        ecoPoints: nextPoints,
        transactions: [manualTx, ...state.transactions],
        loggedActionsCount: state.loggedActionsCount + 1
      });
    }, 500);
  };

  const handleLogManualCommute = () => {
    const savedKg = Math.round((manualMiles * 0.404) * 10) / 10; // 0.404 kg saved per mile walk
    
    const manualCommute = {
      id: `manual-c-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      distanceMiles: manualMiles,
      mode: 'walking' as const,
      carbonImpactKg: 0
    };

    const nextPoints = state.ecoPoints + 15;

    onQuickSuccessNotification(`Synced Walk! +15 Pts · Zero tailpipe CO₂ emitted`);

    updateState({
      ecoPoints: nextPoints,
      commutes: [manualCommute, ...state.commutes],
      loggedActionsCount: state.loggedActionsCount + 1
    });

    setTimeout(() => {
      triggerAIInsightsUpdate({
        ...state,
        ecoPoints: nextPoints,
        commutes: [manualCommute, ...state.commutes],
        loggedActionsCount: state.loggedActionsCount + 1
      });
    }, 500);
  };

  const handleAddCustomAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customActionText.trim()) return;

    const newHabit: HabitTask = {
      id: `custom-h-${Date.now()}`,
      text: customActionText,
      points: 20,
      category: customActionCategory,
      completed: false,
      co2SavedKg: customActionCategory === 'home' ? 2.1 : customActionCategory === 'travel' ? 3.5 : 1.2
    };

    const nextHabits = [...state.habits, newHabit];
    onQuickSuccessNotification('Custom impact routine registered!');
    updateState({ habits: nextHabits });
    setCustomActionText('');
  };

  const handleResetProfile = () => {
    if (confirm(`Are you sure you want to purge data for workspace partition [${activeUser}]? This completely wipes the state.`)) {
      localStorage.removeItem(activeRowKey);
      setState(initializeNewTenantState());
      onQuickSuccessNotification('Workspace table wiped.');
    }
  };

  const handleLoginProcess = (usernameInput: string, pinInput: string) => {
    setAuthMessage(null);
    const trimmedUser = usernameInput.trim().toLowerCase();
    const trimmedPin = pinInput.trim();
    if (!trimmedUser || !trimmedPin) {
      setAuthMessage({ type: 'error', text: 'Tenant ID and Access PIN cannot be empty.' });
      return;
    }

    const rowKey = deriveTenantRowKey(trimmedUser, trimmedPin);
    const cached = localStorage.getItem(rowKey);
    if (!cached) {
      setAuthMessage({ 
        type: 'error', 
        text: `Tenant workspace [${trimmedUser}] was not found under this PIN code. Please check your spelling or sign up as a new user!` 
      });
      return;
    }

    try {
      const parsed = JSON.parse(cached);
      if (verifyStateIntegrity(parsed)) {
        localStorage.setItem('ecotrace_active_user_v1', trimmedUser);
        localStorage.setItem('ecotrace_active_pin_v1', trimmedPin);
        localStorage.setItem('ecotrace_is_logged_in_v1', 'true');
        
        setActiveUser(trimmedUser);
        setActivePin(trimmedPin);
        setIsLoggedIn(true);
        setRlsSecurityAlert(null);
        onQuickSuccessNotification(`Loaded private vault partition: ${trimmedUser}`);
      } else {
        setAuthMessage({ 
          type: 'error', 
          text: `RESOURCE INTEGRITY TAMPERED: signature mismatch on cell partition [${trimmedUser}]. Load aborted for security.` 
        });
      }
    } catch (err) {
      setAuthMessage({ type: 'error', text: 'Error parsing cryptographically sealed record block.' });
    }
  };

  const handleRegisterProcess = (usernameInput: string, pinInput: string, pinConfirmInput: string) => {
    setAuthMessage(null);
    const trimmedUser = usernameInput.trim().toLowerCase();
    const trimmedPin = pinInput.trim();
    const trimmedPinConfirm = pinConfirmInput.trim();

    if (!trimmedUser) {
      setAuthMessage({ type: 'error', text: 'Tenant ID is required.' });
      return;
    }
    if (!/^[a-z0-9_]{3,15}$/.test(trimmedUser)) {
      setAuthMessage({ type: 'error', text: 'Tenant ID must be 3-15 lowercase letters, digits, or underscores.' });
      return;
    }
    if (trimmedPin.length < 4) {
      setAuthMessage({ type: 'error', text: 'Access PIN must be at least 4 characters.' });
      return;
    }
    if (trimmedPin !== trimmedPinConfirm) {
      setAuthMessage({ type: 'error', text: 'PIN codes do not match!' });
      return;
    }

    const rowKey = deriveTenantRowKey(trimmedUser, trimmedPin);
    const alreadyExists = localStorage.getItem(rowKey);
    if (alreadyExists) {
      setAuthMessage({ 
        type: 'error', 
        text: `The username [${trimmedUser}] is already provisioned in local storage. Choose a different ID or sign in.` 
      });
      return;
    }

    const freshState = initializeNewTenantState();
    const { signature } = signState(freshState);
    const signedData = { ...freshState, signature };
    localStorage.setItem(rowKey, JSON.stringify(signedData));

    localStorage.setItem('ecotrace_active_user_v1', trimmedUser);
    localStorage.setItem('ecotrace_active_pin_v1', trimmedPin);
    localStorage.setItem('ecotrace_is_logged_in_v1', 'true');

    setActiveUser(trimmedUser);
    setActivePin(trimmedPin);
    setIsLoggedIn(true);
    setRlsSecurityAlert(null);
    onQuickSuccessNotification(`Provisioned and logged into partition: ${trimmedUser}`);
  };

  const handleContinueAsGuest = () => {
    setAuthMessage(null);
    const defaultUser = 'guest';
    const defaultPin = '0000';
    
    localStorage.setItem('ecotrace_active_user_v1', defaultUser);
    localStorage.setItem('ecotrace_active_pin_v1', defaultPin);
    localStorage.setItem('ecotrace_is_logged_in_v1', 'true');

    setActiveUser(defaultUser);
    setActivePin(defaultPin);
    setIsLoggedIn(true);
    setRlsSecurityAlert(null);
    onQuickSuccessNotification('Entered safe sandbox using Guest mode.');
  };

  const handleLogout = () => {
    localStorage.removeItem('ecotrace_is_logged_in_v1');
    localStorage.removeItem('ecotrace_active_user_v1');
    localStorage.removeItem('ecotrace_active_pin_v1');
    
    setIsLoggedIn(false);
    setActiveUser('guest');
    setActivePin('0000');
    setAuthUsername('');
    setAuthPin('');
    setAuthPinConfirm('');
    setAuthMessage(null);
    onQuickSuccessNotification('Successfully logged out of vault partition.');
  };

  const currentScore = useMemo(() => {
    if (!state.profile) return 0;
    
    let baseline = state.profile.baselineScore;
    
    // Ingested reductions from transactions, completed chores, and commutes
    const completedTasks = state.habits.filter(h => h.completed);
    const completedTaskCO2SavedKg = completedTasks.reduce((acc, curr) => acc + curr.co2SavedKg, 0);

    const completedChallenges = state.challenges.filter(c => c.progress === 100);
    const challengeCO2SavedKg = completedChallenges.reduce((acc, curr) => acc + curr.co2SavingsKg, 0);

    // Negative impacts connected
    let integratedAdjustments = 0;
    if (state.bankingConnected) {
      // Ingest transactions. Savings purchases (like Offset buy) are negative
      const netTxs = state.transactions.reduce((acc, curr) => acc + curr.carbonImpactKg, 0);
      // Net transaction values on active logs are in Kg. Translate to annual rate (scaled: e.g. weekly ledger * 52 / 1000)
      integratedAdjustments += (netTxs * 4) / 1000; 
    }

    // Premium offset subscriptions continuous saves (scale: kg daily * 365 days / 1000 for tons)
    let premiumOffsetTons = 0;
    if (state.isPremiumActive && state.premiumOffsets) {
      const activeIds = state.premiumOffsets;
      const rates: Record<string, number> = { 'off-1': 4.5, 'off-2': 3.0, 'off-3': 3.8 };
      const sumDailyKg = activeIds.reduce((sum, id) => sum + (rates[id] || 0), 0);
      premiumOffsetTons = (sumDailyKg * 365) / 1000;
    }

    // IoT Standby saves (scale monthly stand-by * 12)
    let smartSavesTons = 0;
    if (state.isPremiumActive && state.totalSmartSavesKg) {
      smartSavesTons = (state.totalSmartSavesKg * 12) / 1000;
    }

    const totalSavedKg = completedTaskCO2SavedKg + challengeCO2SavedKg;
    const totalReductionTons = Math.min(baseline - 1.0, (totalSavedKg * 12) / 1000 + integratedAdjustments + premiumOffsetTons + smartSavesTons);

    return Math.max(1.0, Math.round((baseline - totalReductionTons) * 10) / 10);
  }, [
    state.profile,
    state.habits,
    state.challenges,
    state.bankingConnected,
    state.transactions,
    state.isPremiumActive,
    state.premiumOffsets,
    state.totalSmartSavesKg
  ]);

  // AUTHENTICATION VISUAL INTERFACE INTERCEPTOR
  if (!isLoggedIn) {
    return (
      <div id="ecotrace-auth-root" className="min-h-screen bg-[url('/eco-bg.jpg')] bg-cover bg-center bg-fixed flex flex-col justify-between text-gray-800 antialiased font-sans relative">
        <div className="absolute inset-0 bg-emerald-900/10 backdrop-blur-[2px] pointer-events-none z-0"></div>
        <div className="relative z-10 flex flex-col min-h-screen justify-between">
        
        {/* Toast Toast Notifications */}
        {achievementMsg && (
          <div id="auth-toast" className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-950 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 border border-emerald-500/30 font-bold text-xs font-mono">
            <Sparkles className="w-5 h-5 text-yellow-400 animate-spin" />
            <span>{achievementMsg}</span>
          </div>
        )}

        {/* Minimal header */}
        <header className="px-6 py-5 border-b border-gray-150 bg-white/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-gradient-to-tr from-emerald-600 to-teal-500 text-white rounded-xl shadow-md">
                <Leaf className="w-5 h-5" />
              </div>
              <div>
                <span className="text-md font-black text-gray-950 tracking-tight leading-none flex items-center gap-1.5 uppercase">
                  ECOTRACE <span className="text-[9px] font-mono uppercase bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-extrabold tracking-wide">SECURE</span>
                </span>
                <p className="text-[9px] font-bold text-emerald-800 uppercase tracking-widest leading-none mt-1 font-extrabold">by PAL</p>
              </div>
            </div>
            <div className="text-[10px] text-gray-450 font-mono tracking-wider flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-emerald-650" /> SECURED END-TO-END ENCRYPTED PORTAL
            </div>
          </div>
        </header>

        {/* Auth card content */}
        <main className="flex-1 flex items-center justify-center p-6 my-8">
          <div className="w-full max-w-sm bg-white/85 backdrop-blur-xl border border-white/50 rounded-3xl p-8 shadow-xl space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 bg-emerald-50 text-emerald-700 rounded-full">
                <Shield className="w-6 h-6" />
              </div>
              <h1 className="text-lg font-bold tracking-tight text-gray-900">Secure Carbon Vault</h1>
              <p className="text-xs text-gray-800 font-medium my-2 max-w-sm mx-auto leading-normal">
                Understand, track, and reduce your carbon footprint through simple actions and personalized insights.
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-normal">
                Sign in or create a private partitioned storage vault to secure your local carbon data.
              </p>
            </div>

            {/* Tabs selector */}
            <div className="flex bg-gray-100/80 p-1 rounded-xl" role="tablist">
              <button
                id="tab-signin-btn"
                role="tab"
                aria-selected={authTab === 'signin'}
                aria-label="Sign In Tab"
                onClick={() => { setAuthTab('signin'); setAuthMessage(null); }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  authTab === 'signin' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-950'
                }`}
              >
                Sign In
              </button>
              <button
                id="tab-signup-btn"
                role="tab"
                aria-selected={authTab === 'signup'}
                aria-label="Sign Up Tab"
                onClick={() => { setAuthTab('signup'); setAuthMessage(null); }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  authTab === 'signup' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-950'
                }`}
              >
                Sign Up
              </button>
              <button
                id="tab-guest-btn"
                role="tab"
                aria-selected={authTab === 'guest'}
                aria-label="Guest Box Tab"
                onClick={() => { setAuthTab('guest'); setAuthMessage(null); }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  authTab === 'guest' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-950'
                }`}
              >
                Guest Box
              </button>
            </div>

            {/* Error or successive status banner */}
            {authMessage && (
              <div 
                id="auth-alert-message" 
                className={`p-3 text-xs rounded-xl border flex items-start gap-2 ${
                  authMessage.type === 'error' 
                    ? 'bg-rose-50 border-rose-100/50 text-rose-850' 
                    : 'bg-emerald-50 border-emerald-100/50 text-emerald-850'
                }`}
              >
                <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${authMessage.type === 'error' ? 'text-rose-600' : 'text-emerald-600'}`} />
                <span className="leading-relaxed font-medium">{authMessage.text}</span>
              </div>
            )}

            {/* Forms body container */}
            {authTab === 'signin' && (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLoginProcess(authUsername, authPin);
                }}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <label htmlFor="auth-username-in" className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block font-mono">Tenant ID / Username</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <input aria-label="Data Input"
                      id="auth-username-in"
                      type="text"
                      required
                      placeholder="e.g. user_alpha"
                      value={authUsername}
                      onChange={(e) => setAuthUsername(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:border-gray-500 focus:outline-none focus:bg-white bg-gray-50/50 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="auth-pin-in" className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block font-mono">Access PIN Code</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <input aria-label="Data Input"
                      id="auth-pin-in"
                      type="password"
                      required
                      placeholder="••••"
                      value={authPin}
                      onChange={(e) => setAuthPin(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:border-gray-500 focus:outline-none focus:bg-white bg-gray-50/50 font-mono"
                    />
                  </div>
                </div>

                <button
                  id="auth-submit-signin-btn"
                  type="submit"
                  className="w-full py-2.5 bg-gray-950 hover:bg-gray-805 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer hover:shadow-sm transition-all text-center flex items-center justify-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" /> Unlock Secure Partition
                </button>
              </form>
            )}

            {authTab === 'signup' && (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRegisterProcess(authUsername, authPin, authPinConfirm);
                }}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <label htmlFor="auth-username-up" className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase block font-mono">Choose Tenant ID</label>
                  <div className="relative">
                    <UserPlus className="absolute left-3 top-2.5 w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <input aria-label="Data Input"
                      id="auth-username-up"
                      type="text"
                      required
                      placeholder="e.g. user_alpha"
                      value={authUsername}
                      onChange={(e) => setAuthUsername(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:border-gray-500 focus:outline-none focus:bg-white bg-gray-50/50 font-mono"
                    />
                  </div>
                  <p className="text-[9px] text-gray-500 dark:text-gray-400 leading-none mt-1">
                    3-15 lowercase letters, digits, or underscores.
                  </p>
                </div>

                <div className="space-y-1">
                  <label htmlFor="auth-pin-up" className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase block font-mono">Access PIN Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <input aria-label="Data Input"
                      id="auth-pin-up"
                      type="password"
                      required
                      placeholder="••••"
                      value={authPin}
                      onChange={(e) => setAuthPin(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:border-gray-500 focus:outline-none focus:bg-white bg-gray-50/50 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="auth-pin-up-confirm" className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase block font-mono">Confirm PIN</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <input aria-label="Data Input"
                      id="auth-pin-up-confirm"
                      type="password"
                      required
                      placeholder="••••"
                      value={authPinConfirm}
                      onChange={(e) => setAuthPinConfirm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:border-gray-500 focus:outline-none focus:bg-white bg-gray-50/50 font-mono"
                    />
                  </div>
                </div>

                <button
                  id="auth-submit-signup-btn"
                  type="submit"
                  className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-650 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer hover:shadow-sm transition-all text-center flex items-center justify-center gap-1.5"
                >
                  <Shield className="w-3.5 h-3.5" /> Initialize Private Database Row
                </button>
              </form>
            )}

            {authTab === 'guest' && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 border border-gray-150 rounded-2xl space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                    <User className="w-4 h-4 text-emerald-600" /> Sandbox Play area
                  </div>
                  <p className="text-[11px] text-gray-500 leading-normal">
                    Guest mode loads an unencrypted workspace partition. Enjoy trying out carbon budgeting features without persistency.
                  </p>
                </div>

                <button
                  id="auth-submit-guest-btn"
                  aria-label="Enter as Guest"
                  onClick={handleContinueAsGuest}
                  className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer hover:shadow-sm transition-all text-center flex items-center justify-center gap-1.5"
                >
                  Enter as Sandbox Guest
                </button>
              </div>
            )}

            {/* Quick Guest Bypass / Skip Login Option */}
            <div className="pt-4 border-t border-gray-100 flex flex-col items-center gap-2">
              <span className="text-[9px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider font-mono">Bypass Login</span>
              <button
                id="quick-skip-to-guest-btn"
                aria-label="Skip to Guest"
                type="button"
                onClick={handleContinueAsGuest}
                className="w-full py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-extrabold text-xs rounded-xl shadow-xs hover:shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 animate-pulse"
              >
                <Crown className="w-4 h-4 text-amber-600 fill-amber-300 stroke-amber-700" /> Skip Login & Continue as Guest
              </button>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="py-8 text-center text-xs text-gray-800 font-medium border-t border-gray-200/50 bg-white/80 backdrop-blur-md">
          <p className="font-extrabold tracking-wide text-gray-900">ECOTRACE • PAL</p>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-1 leading-normal px-2 font-mono">
            Isolated Multi-Tenant Ledger framework designed & hosted by PAL.
          </p>
        </footer>
        </div>
      </div>
    );
  }

  return (
    <div id="ecotrace-app-main-root" className="min-h-screen bg-[url('/eco-bg.jpg')] bg-cover bg-center bg-fixed text-gray-800 dark:text-gray-100 antialiased font-sans relative">
      <div className="absolute inset-0 bg-emerald-950/20 dark:bg-emerald-950/80 backdrop-blur-[2px] pointer-events-none z-0"></div>
      
      <div className="relative z-10 flex flex-col min-h-screen">
      {/* Dynamic Flash Notifications Banner */}
      {achievementMsg && (
        <div id="toast-notif-bar" className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 border border-emerald-500/30 animate-bounce">
          <Sparkles className="w-5 h-5 text-yellow-400" />
          <span className="text-xs font-bold font-mono tracking-wider">{achievementMsg}</span>
        </div>
      )}

      {/* Global Navigation Header */}
      <header id="global-header" className="sticky top-0 z-45 bg-white/85 dark:bg-gray-900/85 backdrop-blur-xl border-b border-white/20 dark:border-gray-700 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-tr from-emerald-600 to-teal-500 text-white rounded-xl shadow-md">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <span className="text-md font-black text-gray-900 dark:text-gray-100 tracking-tight leading-none flex items-center gap-1.5">
                ECOTRACE <span className="text-[10px] font-mono uppercase bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-extrabold tracking-wide">SECURE</span>
              </span>
              <p className="text-[9px] font-bold text-gray-500 dark:text-gray-400 max-w-[200px] sm:max-w-md uppercase tracking-wide leading-tight mt-1">Smart Carbon Reducer — Understand, track, and reduce your carbon footprint through simple actions and personalized insights</p>
            </div>
          </div>

          <div className="flex bg-gray-50/90 dark:bg-gray-800/90 border border-transparent dark:border-gray-700/80 px-2 py-1.5 rounded-2xl items-center gap-3 shadow-sm">
            <button
              aria-label="Toggle Dark Mode"
              onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
              className="p-1 px-2 text-gray-500 dark:text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/50 dark:hover:text-emerald-400 rounded-lg transition-colors cursor-pointer text-xs flex items-center"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            {/* Active Vault Badge */}
            <div className="hidden sm:flex items-center gap-1.5 bg-stone-100 border border-stone-200 text-stone-700 dark:bg-stone-800 dark:border-stone-700 dark:text-stone-300 px-3 py-1.5 rounded-full text-xs font-mono font-bold">
              {state.isPremiumActive ? (
                <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-300 stroke-amber-600 animate-pulse" />
              ) : (
                <Shield className="w-3.5 h-3.5 text-emerald-600 font-bold" />
              )}
              <span>User: <span className="text-stone-900 dark:text-stone-100 font-extrabold">{activeUser}</span>{state.isPremiumActive && <span className="text-amber-700 dark:text-amber-400 font-black text-[10px] uppercase ml-1">PLATINUM</span>}</span>
            </div>

            {state.profile ? (
              <div className="flex items-center gap-3">
                {/* Eco Tips Modal Trigger */}
                <button
                  aria-label="View Eco Tips"
                  onClick={() => setIsEcoTipsModalOpen(true)}
                  className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-400 dark:hover:bg-emerald-800/60 dark:hover:text-emerald-300 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800 text-xs font-bold transition-colors"
                >
                  <Lightbulb className="w-4 h-4" />
                  <span className="hidden sm:inline">Eco-Tips</span>
                </button>

                {/* Point Indicator */}
                <div id="eco-points-badge" className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 px-3.5 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-800 text-xs font-bold font-mono shadow-sm">
                  <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{state.ecoPoints} Pts</span>
                </div>

                {/* Streak Counter */}
                <div id="streak-counter-badge" className="flex items-center gap-1.5 bg-orange-50 dark:bg-orange-900/50 text-orange-850 dark:text-orange-300 px-3.5 py-1.5 rounded-full border border-orange-100 dark:border-orange-800 text-xs font-bold font-mono shadow-sm">
                  <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
                  <span>{state.streakCount} Days</span>
                </div>
              </div>
            ) : (
              <div className="text-[10px] text-gray-500 dark:text-gray-400 font-mono tracking-wider">ONBOARDING PROFILE ACTIVE</div>
            )}

            {/* Lock Session / Logout Action and Workspace Wiping Button side by side */}
            <div className="flex items-center border-l border-gray-150 pl-3 gap-1">
              {state.profile && (
                <button
                  id="purge-profile-nav-btn"
                  aria-label="Wipe Profile"
                  onClick={handleResetProfile}
                  title="Wipe & Reset Profile Data"
                  className="p-1 px-2 text-gray-500 dark:text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer text-xs flex items-center"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                id="lock-partition-session-btn"
                aria-label="Log Out"
                onClick={handleLogout}
                title="Lock & Exit Vault Partition"
                className="p-1 px-2 text-gray-500 dark:text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer text-xs flex items-center"
              >
                <LogOut className="w-3.5 h-3.5" onClick={handleLogout} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container Viewport */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Row-Level Security Warning alert if integrity fails */}
        {rlsSecurityAlert && (
          <div id="rls-integrity-warning" className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-800 font-bold text-xs rounded-2xl flex items-center gap-2.5 animate-pulse">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{rlsSecurityAlert}</span>
          </div>
        )}

        {/* always show dashboard since profile is initialized */}
        <div id="onboarded-workspace" className="space-y-8 animate-fade-in">

            {/* Main Navigation Tabs */}
            <div role="tablist" aria-label="Dashboard views" className="flex bg-white/60 dark:bg-gray-800/60 p-1.5 rounded-2xl w-full mx-auto shadow-sm backdrop-blur-xl border border-gray-200 dark:border-gray-700/50 mb-8 overflow-x-auto hide-scrollbar sticky top-20 z-40">
              <button
                role="tab"
                aria-selected={activeDashboardTab === 'dashboard'}
                onClick={() => setActiveDashboardTab('dashboard')}
                className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center justify-center gap-2 ${
                  activeDashboardTab === 'dashboard' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-emerald-600 dark:hover:text-emerald-400'
                }`}
              >
                <Activity className="w-4 h-4" /> Overview
              </button>
              <button
                role="tab"
                aria-selected={activeDashboardTab === 'insights'}
                onClick={() => setActiveDashboardTab('insights')}
                className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center justify-center gap-2 ${
                  activeDashboardTab === 'insights' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-emerald-600 dark:hover:text-emerald-400'
                }`}
              >
                <Sparkles className="w-4 h-4" /> AI Insights
              </button>
              <button
                role="tab"
                aria-selected={activeDashboardTab === 'premium'}
                onClick={() => setActiveDashboardTab('premium')}
                className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center justify-center gap-2 ${
                  activeDashboardTab === 'premium' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-emerald-600 dark:hover:text-emerald-400'
                }`}
              >
                <Crown className="w-4 h-4" /> Premium IoT
              </button>
              <button
                role="tab"
                aria-selected={activeDashboardTab === 'integrations'}
                onClick={() => setActiveDashboardTab('integrations')}
                className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center justify-center gap-2 ${
                  activeDashboardTab === 'integrations' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-emerald-600 dark:hover:text-emerald-400'
                }`}
              >
                <RefreshCw className="w-4 h-4" /> Webhooks
              </button>
              <button
                role="tab"
                aria-selected={activeDashboardTab === 'community'}
                onClick={() => setActiveDashboardTab('community')}
                className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center justify-center gap-2 ${
                  activeDashboardTab === 'community' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-emerald-600 dark:hover:text-emerald-400'
                }`}
              >
                <Users className="w-4 h-4" /> Community
              </button>
              <button
                role="tab"
                aria-selected={activeDashboardTab === 'audit'}
                onClick={() => setActiveDashboardTab('audit')}
                className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center justify-center gap-2 ${
                  activeDashboardTab === 'audit' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-emerald-600 dark:hover:text-emerald-400'
                }`}
              >
                <Lightbulb className="w-4 h-4" /> Setup Profile
              </button>
            </div>

            {activeDashboardTab === 'audit' && (
              <div id="un-onboarded-workspace" className="space-y-12 py-6">
                <div className="max-w-2xl mx-auto text-center space-y-4">
                  <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full text-xs font-semibold">
                    <Sparkles className="w-3.5 h-3.5" /> Behavior Science Carbon Tracking
                  </div>
                  <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
                    Update your Carbon Baseline
                  </h2>
                  <p className="text-sm text-gray-500 max-w-lg mx-auto leading-relaxed">
                    Take the 2-minute Eco Questionnaire to refine your goals and get personalized Indian climate-habit recommendations.
                  </p>
                </div>
                <OnboardingWizard onOnboardingComplete={handleOnboardingComplete} />
              </div>
            )}

            {activeDashboardTab === 'dashboard' && (
              <div className="space-y-8 animate-fade-in">
                {/* Profile Intro Greeting Badge */}
            <div id="welcome-profile-card" className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-white/40 dark:border-gray-700 rounded-3xl shadow-lg flex flex-col overflow-hidden">
              <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tracking-widest uppercase">Environmental Status: **{state.profile.name}**</span>
                  <h2 className="text-xl font-extrabold text-gray-900 dark:text-gray-100">Your Carbon Footprint Matrix</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-500 dark:text-gray-400 max-w-lg leading-relaxed mt-1">
                    {state.profile.personalizedWelcome.replace(/\*\*/g, '')}
                  </p>
                </div>

                <div className="shrink-0 flex flex-col items-end gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold font-mono">My Persona Badge:</span>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl shadow-sm">
                      🏆 {state.profile.name}
                    </span>
                  </div>
                  <button
                    aria-label="Share Profile"
                    onClick={() => {
                      const getBadges = () => {
                        const b = [];
                        if (state.ecoPoints >= 0) b.push('🌱 Green Sprout');
                        if (state.ecoPoints >= 50) b.push('⚔️ Eco-Warrior');
                        if (state.ecoPoints >= 150) b.push('🦸 Carbon Crusader');
                        if (state.ecoPoints >= 300) b.push('🌍 Earth Guardian');
                        if (state.ecoPoints >= 500) b.push('🏆 Climate Champion');
                        return b.join(', ');
                      };
                      const text = `I've earned ${state.ecoPoints} points and a ${state.streakCount}-day streak on EcoTrace! 🌍\nUnlocked Badges: ${getBadges()}`;
                      navigator.clipboard.writeText(text);
                      onQuickSuccessNotification('Stats copied to clipboard! 🌟');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 rounded-xl text-xs font-bold text-gray-700 hover:text-emerald-700 transition-all shadow-sm group"
                  >
                    <Share2 className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 group-hover:text-emerald-700 dark:text-emerald-400 transition-colors" />
                    Share Achievement
                  </button>
                </div>
              </div>
              
              <div className="bg-gray-50/80 dark:bg-gray-900/80 border-t border-gray-100 dark:border-gray-700 p-4 px-6 flex items-center gap-3">
                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest flex shrink-0 items-center gap-1"><Award className="w-3 h-3"/> Unlocked Badges</span>
                <div className="flex flex-wrap gap-2">
                  {state.ecoPoints >= 0 && (
                    <div className="flex items-center gap-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 px-2.5 py-1 rounded-lg shadow-sm text-[10px] font-bold text-gray-700 dark:text-gray-300" title="Unlocked: Green Sprout (0 Pts)">
                      🌱 Green Sprout
                    </div>
                  )}
                  {state.ecoPoints >= 50 && (
                    <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg shadow-sm text-[10px] font-bold text-emerald-800" title="Unlocked: Eco-Warrior (50 Pts)">
                      ⚔️ Eco-Warrior
                    </div>
                  )}
                  {state.ecoPoints >= 150 && (
                    <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 px-2.5 py-1 rounded-lg shadow-sm text-[10px] font-bold text-amber-800" title="Unlocked: Carbon Crusader (150 Pts)">
                      🦸 Carbon Crusader
                    </div>
                  )}
                  {state.ecoPoints >= 300 && (
                    <div className="flex items-center gap-1.5 bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 px-2.5 py-1 rounded-lg shadow-sm text-[10px] font-bold text-teal-800" title="Unlocked: Earth Guardian (300 Pts)">
                      🌍 Earth Guardian
                    </div>
                  )}
                  {state.ecoPoints >= 500 && (
                    <div className="flex items-center gap-1.5 bg-gradient-to-r from-purple-50 to-fuchsia-50 border border-purple-200 px-2.5 py-1 rounded-lg shadow-sm text-[10px] font-bold text-purple-800 animate-pulse" title="Unlocked: Climate Champion (500 Pts)">
                      🏆 Climate Champion
                    </div>
                  )}
                  {state.ecoPoints < 50 && (
                    <div className="flex items-center gap-1.5 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-lg text-[10px] font-bold text-gray-500 dark:text-gray-400 opacity-60">
                      <Lock className="w-2.5 h-2.5" /> Eco-Warrior (50 Pts)
                    </div>
                  )}
                  {state.ecoPoints < 150 && state.ecoPoints >= 50 && (
                    <div className="flex items-center gap-1.5 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-lg text-[10px] font-bold text-gray-500 dark:text-gray-400 opacity-60">
                      <Lock className="w-2.5 h-2.5" /> Carbon Crusader (150 Pts)
                    </div>
                  )}
                  {state.ecoPoints < 300 && state.ecoPoints >= 150 && (
                    <div className="flex items-center gap-1.5 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-lg text-[10px] font-bold text-gray-500 dark:text-gray-400 opacity-60">
                      <Lock className="w-2.5 h-2.5" /> Earth Guardian (300 Pts)
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Daily Carbon Reduction Goal */}
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-white/40 dark:border-gray-700 rounded-3xl p-6 shadow-lg space-y-4">
              <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wide flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-700 dark:text-emerald-400" /> Daily Reduction Goal
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-500 dark:text-gray-400">Track the carbon you save today through daily habits against your personal target.</p>
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor="daily-goal-input" className="text-[10px] font-bold text-gray-500 dark:text-gray-400 dark:text-gray-500 uppercase tracking-wider font-mono">Target (kg CO₂)</label>
                  <input aria-label="Data Input"
                    id="daily-goal-input"
                    type="number"
                    min="1"
                    max="50"
                    step="1"
                    value={state.dailyCarbonGoalKg || 5}
                    onChange={(e) => updateState({ dailyCarbonGoalKg: parseFloat(e.target.value) || 5 })}
                    className="w-20 px-3 py-1.5 text-sm font-bold text-emerald-900 dark:text-emerald-100 bg-emerald-50 dark:bg-emerald-900 border border-emerald-200 dark:border-emerald-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner text-center"
                  />
                </div>
              </div>
              
              {(() => {
                const savedToday = state.habits.reduce((acc, h) => h.completed ? acc + h.co2SavedKg : acc, 0);
                const target = state.dailyCarbonGoalKg || 5;
                const ratio = savedToday / target;
                const isAlmostDone = ratio >= 0.9 && ratio < 1;
                const pct = Math.min(100, Math.round(ratio * 100));

                return (
                  <div className={`transition-all duration-700 ease-in-out p-1 -m-1 rounded-xl ${isAlmostDone ? 'animate-pulse ring-2 ring-emerald-200 bg-emerald-50/50' : ''}`}>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400 tracking-tight">
                        {savedToday.toFixed(1)} <span className="text-sm text-gray-500 dark:text-gray-500 dark:text-gray-400 font-bold tracking-normal">/ {target} kg saved</span>
                      </span>
                      <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase font-mono tracking-wider">
                        {pct}% COMPLETED
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-4 relative shadow-inner">
                      <div 
                        className="bg-gradient-to-r from-emerald-400 to-teal-500 h-4 rounded-full transition-all duration-1000 ease-out shadow-sm"
                        style={{ width: `${Math.min(100, ratio * 100)}%` }}
                      ></div>
                      {savedToday >= target && savedToday > 0 && (
                        <div className="absolute inset-0 flex items-center justify-around overflow-visible pointer-events-none z-10 -ml-2 -mr-2">
                          <Sparkles className="w-4 h-4 text-amber-400 animate-sparkle-burst" />
                          <Sparkles className="w-5 h-5 text-yellow-300 animate-sparkle-burst" style={{ animationDelay: '0.2s', transform: 'translateY(-8px)' }} />
                          <Sparkles className="w-3 h-3 text-emerald-300 animate-sparkle-burst" style={{ animationDelay: '0.4s', transform: 'translateY(6px)' }} />
                          <Sparkles className="w-6 h-6 text-yellow-400 animate-sparkle-burst" style={{ animationDelay: '0.1s', transform: 'translateY(-4px)' }} />
                          <Sparkles className="w-4 h-4 text-emerald-400 animate-sparkle-burst" style={{ animationDelay: '0.3s', transform: 'translateY(4px)' }} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Main Charts & Wheels Component */}
            <EmissionsCharts profile={state.profile} currentActualScore={currentScore} />
              </div>
            )}

            {/* Premium Gold Carbon-Neutral Planner Suite */}
            {activeDashboardTab === 'premium' && (
              <PremiumSuite 
                ecoState={state} 
                onUpdateState={updateState} 
                onPostNotification={onQuickSuccessNotification} 
                triggerAIUpdate={triggerAIInsightsUpdate}
              />
            )}

            {/* AI Custom Insights panel */}
            {activeDashboardTab === 'insights' && (
              <div id="ai-insights-block" className="bg-gradient-to-br from-gray-900 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
              <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl" />
              <div className="absolute -left-20 -top-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />

              <div className="relative space-y-6">
                <div className="flex justify-between items-center flex-wrap gap-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                      <Sparkles className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-md font-bold tracking-tight">AI Personalized Audit &amp; Forecasts</h3>
                      <p className="text-xs text-emerald-300 mt-0.5">Calculated in real-time by Google Gemini Model</p>
                    </div>
                  </div>

                  <button
                    id="regenerate-ai-insights-btn"
                    aria-label="Analyze with AI"
                    onClick={() => triggerAIInsightsUpdate(state)}
                    disabled={state.aiInsightsLoading}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 text-white font-bold text-xs px-3.5 py-2 rounded-full shadow transition-all cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${state.aiInsightsLoading ? 'animate-spin' : ''}`} />
                    {state.aiInsightsLoading ? 'Consulting Gemini...' : 'Analyze with AI'}
                  </button>
                </div>

                {state.aiInsightsLoading ? (
                  <div className="py-12 flex flex-col items-center text-center space-y-3">
                    <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin" />
                    <p className="text-xs text-slate-400 font-mono">Gemini is auditing connected utility usage and transaction registries...</p>
                  </div>
                ) : state.aiInsights ? (
                  <div className="space-y-6">
                    {/* Daily Eco Fact */}
                    {state.currentEcoFact && (
                      <div className="bg-emerald-900/40 border border-emerald-500/20 p-4 rounded-2xl flex items-start gap-4">
                        <div className="p-2 bg-emerald-500/20 rounded-xl shrink-0">
                          <Sparkles className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <span className="text-[9px] font-black uppercase text-emerald-400 tracking-wider">Daily Eco-Fact</span>
                          <p className="text-sm leading-relaxed text-slate-200 mt-1">{state.currentEcoFact}</p>
                        </div>
                      </div>
                    )}

                    {/* Predictor forecast header card */}
                    <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                      <span className="text-[9px] font-black uppercase text-teal-400 tracking-wider">Predictive Trend (Dec 2026)</span>
                      <p className="text-xs leading-relaxed text-slate-200 mt-1">{state.aiInsights.predictiveForecast}</p>
                    </div>

                    {/* Insights list cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {state.aiInsights.insights.map((insight) => (
                        <div key={insight.id} className="bg-white/5 border border-white/5 p-4 rounded-xl space-y-2">
                          <div className="flex justify-between items-start">
                            <span className="text-[9px] font-medium uppercase tracking-wider text-slate-400">
                              Sector {insight.type}
                            </span>
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full font-mono ${
                              insight.color === 'green' ? 'bg-emerald-500/20 text-emerald-300' :
                              insight.color === 'red' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                            }`}>
                              {insight.impactValue}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-100">{insight.title}</h4>
                          <p className="text-[11px] text-slate-350 leading-normal">{insight.text}</p>
                        </div>
                      ))}
                    </div>

                    {/* Habit stacks suggestions list */}
                    {state.aiInsights.habitStackSuggestions && state.aiInsights.habitStackSuggestions.length > 0 && (
                      <div className="bg-emerald-950/20 border border-emerald-900/40 p-4 rounded-2xl">
                        <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1">
                          🔥 Proactive Habit Stacks to Practice Today
                        </span>
                        <ul className="list-disc pl-4 text-xs text-slate-300 space-y-1.5 mt-2">
                          {state.aiInsights.habitStackSuggestions.map((stack, i) => (
                            <li key={i}>{stack}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-slate-400">
                    <p>No active AI analyses cached yet. Click "Analyze with AI" to trigger your first Gemini climate audit report.</p>
                  </div>
                )}
              </div>
            </div>
            )}

            {/* Quick Actions & Habits Loggers column split */}
            {activeDashboardTab === 'dashboard' && (
            <div id="habit-management-cols" className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column: Habits checklist */}
              <div id="habits-checklist-box" className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-white/40 dark:border-gray-700 rounded-3xl p-6 shadow-lg space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wide">Daily Eco Habits Tracker</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Check completed daily actions to count points and live-calculate saved carbon offset</p>
                </div>

                {/* Monthly Streak Tracker */}
                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-100 dark:border-slate-700 shadow-inner mt-4 mb-5">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase font-bold flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      Last 30 Days
                    </span>
                    <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-md font-bold font-mono shadow-sm">
                      {state.streakCount} Day Streak
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5" role="grid" aria-label="Monthly Activity">
                    {Array.from({ length: 30 }).map((_, i) => {
                      const daysAgo = 29 - i;
                      const isActive = daysAgo < state.streakCount;
                      const wasActive = isActive || (daysAgo >= state.streakCount && ((i * 13) % 7) <= 2); 
                      
                      return (
                        <div 
                          key={i} 
                          title={`${daysAgo === 0 ? 'Today' : `${daysAgo} days ago`}`}
                          className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-[3px] transition-all duration-300 ${
                            wasActive 
                              ? (daysAgo < state.streakCount ? 'bg-emerald-500 shadow-sm scale-105' : 'bg-emerald-200 dark:bg-emerald-800/60 opacity-60') 
                              : 'bg-slate-200 dark:bg-slate-700'
                          } ${daysAgo === 0 ? 'ring-2 ring-offset-1 dark:ring-offset-slate-900 ring-emerald-500 z-10' : ''}`}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Category Filter Chips */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {(['all', 'home', 'travel', 'food', 'shopping'] as const).map(cat => (
                    <button
                      aria-label={`Filter by ${cat}`}
                      key={cat}
                      onClick={() => setHabitFilter(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                        habitFilter === cat 
                          ? 'bg-emerald-600 text-white shadow-sm' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                  {state.habits.filter(h => habitFilter === 'all' || h.category === habitFilter).map((h) => (
                    <button
                      aria-label={`Toggle habit ${h.text}`}
                      id={`habit-task-${h.id}`}
                      key={h.id}
                      onClick={() => handleToggleHabit(h.id)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all hover:bg-gray-50/50 dark:hover:bg-gray-700/50 cursor-pointer ${
                        h.completed ? 'bg-emerald-50/10 dark:bg-emerald-900/10 border-emerald-500/20 text-gray-500' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-600 text-gray-800 dark:text-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 max-w-[60%]">
                        <div className={`p-1.5 rounded-full border transition-all flex-shrink-0 ${
                          h.completed ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white border-gray-250 text-transparent'
                        }`}>
                          <Check className="w-3.5 h-3.5" strokeWidth={3} />
                        </div>
                        <span className={`text-xs truncate ${h.completed ? 'line-through text-gray-500 dark:text-gray-400 font-medium' : 'font-bold'}`}>{h.text}</span>
                      </div>
                      
                      <div className="hidden sm:block flex-1 px-4 max-w-[100px] h-6 opacity-60 flex justify-center items-center">
                        <LineChart width={80} height={24} data={(h.history || [0,0,0,0,0,0,0]).map((val, i) => ({ val, i }))}>
                          <YAxis domain={[-10, 110]} hide />
                          <Line type="monotone" dataKey="val" stroke={h.completed ? "#10b981" : "#9ca3af"} strokeWidth={2} dot={false} isAnimationActive={false} />
                        </LineChart>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className="text-[10px] font-bold text-emerald-700 font-mono flex flex-col sm:flex-row sm:gap-1 items-end sm:items-center"><span>+{h.points} Pts</span></span>
                        <div className="text-[9px] text-gray-500 dark:text-gray-400 font-mono mt-0.5">-{h.co2SavedKg}kg CO₂</div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Custom Action form setup */}
                <form id="add-custom-action-form" onSubmit={handleAddCustomAction} className="pt-4 border-t border-gray-100/60 flex gap-2">
                  <div className="flex-1 flex gap-2">
                    <input
                      id="custom-action-input"
                      type="text"
                      aria-label="Add custom impact habit"
                      placeholder="Add custom impact habit... (e.g. cold laundry wash)"
                      value={customActionText}
                      onChange={(e) => setCustomActionText(e.target.value)}
                      className="flex-1 text-xs border border-gray-200 bg-gray-550/50 px-4 py-2 rounded-xl focus:border-emerald-500 focus:outline-none focus:bg-white"
                    />
                    <select
                      id="custom-action-category-select"
                      aria-label="Select custom action category"
                      value={customActionCategory}
                      onChange={(e: any) => setCustomActionCategory(e.target.value)}
                      className="text-xs border border-gray-200 bg-gray-550/50 px-2 py-2 rounded-xl focus:outline-none"
                    >
                      <option value="home">Home</option>
                      <option value="travel">Travel</option>
                      <option value="food">Food</option>
                      <option value="shopping">Shop</option>
                    </select>
                  </div>
                  <button
                    id="add-custom-action-btn"
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 px-3 rounded-xl shadow-sm transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
                  >
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </form>
              </div>

              {/* Right Column: Simulated Integrations Manual triggers */}
              <div id="manual-insights-box" className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-white/40 dark:border-gray-700 rounded-3xl p-6 shadow-lg space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wide">Manual Food & Commute Quick-Logs</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Don't have automations connected? Use manual quick-log widgets in under 5 seconds</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Food entry panel */}
                  <div id="food-entry-panel" className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-100 dark:border-gray-600 space-y-3">
                    <h4 className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider">Fast Food & Dining Out</h4>
                    
                    <div className="grid grid-cols-3 gap-1.5 p-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl">
                      {['vegan', 'veg', 'meat'].map((type) => (
                        <button
                          aria-label={`Select ${type} diet option`}
                          id={`food-selector-${type}`}
                          key={type}
                          onClick={() => setManualFoodSelected(type)}
                          className={`py-2 text-[10px] font-bold uppercase rounded-lg transition-all cursor-pointer ${
                            manualFoodSelected === type
                              ? 'bg-emerald-600 text-white shadow-sm font-extrabold'
                              : 'text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>

                    <button
                      id="submit-food-log-btn"
                      onClick={handleLogManualFood}
                      className="w-full py-2 bg-white border border-gray-200 text-emerald-800 text-xs font-bold rounded-xl shadow-sm hover:bg-emerald-50 hover:border-emerald-100 transition-colors cursor-pointer text-center"
                    >
                      Log Meal Option (+10 pts)
                    </button>
                  </div>

                  {/* Commuting distance logger panel */}
                  <div id="commute-entry-panel" className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-100 dark:border-gray-600 space-y-3">
                    <div className="flex justify-between items-center text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      <span>Carbonavoid Commute</span>
                      <span className="font-mono text-emerald-600">{manualMiles} mi</span>
                    </div>

                    <input
                      id="commute-miles-range"
                      type="range"
                      aria-label="Carbonavoid Commute Distance in miles"
                      min="1"
                      max="30"
                      value={manualMiles}
                      onChange={(e) => setManualMiles(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-gray-250 rounded-lg cursor-pointer accent-emerald-600"
                    />

                    <button
                      id="submit-commute-log-btn"
                      onClick={handleLogManualCommute}
                      className="w-full py-2 bg-white border border-gray-200 text-emerald-800 text-xs font-bold rounded-xl shadow-sm hover:bg-emerald-50 hover:border-emerald-100 transition-colors cursor-pointer text-center"
                    >
                      Log Walking/Cycling (+15 pts)
                    </button>
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* Smart Automated Integrations feeds connector row */}
            {activeDashboardTab === 'integrations' && (
            <IntegrationsPanel 
              ecoState={state} 
              onUpdateState={updateState} 
              triggerAIUpdate={triggerAIInsightsUpdate} 
            />
            )}

            {activeDashboardTab === 'community' && (
            <div className="space-y-8 animate-fade-in">
              <CommunityLeaderboard />
              
              <LocalMap />

              {/* Gamification Challenges & partner discounts shop component */}
              <CommunityShop 
                ecoState={state} 
                onUpdateState={updateState} 
              />
            </div>
            )}

          </div>
      </main>

      <EcoTipsModal 
        isOpen={isEcoTipsModalOpen} 
        onClose={() => setIsEcoTipsModalOpen(false)} 
        quiz={state.profile?.quiz} 
      />

      <SmartAssistant ecoState={state} />

      <footer id="global-footer" className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-white/40 dark:border-gray-700 py-10 mt-16 text-center text-xs text-gray-700 dark:text-gray-300 font-medium space-y-2 relative z-10 w-full mb-0">
        <p className="font-extrabold tracking-wide text-gray-900 dark:text-gray-100">ECOTRACE © 2026</p>
        <p className="max-w-md mx-auto leading-normal">
          Engineered and crafted by <span className="font-black text-emerald-900">PAL</span>. All rights reserved.
        </p>
      </footer>
    </div>
    </div>
  );
}
