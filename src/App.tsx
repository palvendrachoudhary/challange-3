/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserEcoState, CarbonProfile, HabitTask, AIInsightsPayload } from './types';
import OnboardingWizard from './components/OnboardingWizard';
import EmissionsCharts from './components/EmissionsCharts';
import IntegrationsPanel from './components/IntegrationsPanel';
import CommunityShop from './components/CommunityShop';
import PremiumSuite from './components/PremiumSuite';
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
  Crown
} from 'lucide-react';

const INITIAL_HABIT_TASKS: HabitTask[] = [
  { id: 'h-1', text: 'Unplug entertainment systems tonight', points: 15, category: 'home', completed: false, co2SavedKg: 1.8 },
  { id: 'h-2', text: 'Walk or cycle for a trip under 1.5 miles', points: 20, category: 'travel', completed: false, co2SavedKg: 3.2 },
  { id: 'h-3', text: 'Choose package-free zero-waste produce', points: 10, category: 'shopping', completed: false, co2SavedKg: 0.9 },
  { id: 'h-4', text: 'Prepare a fiber-rich plant-based dinner', points: 15, category: 'food', completed: false, co2SavedKg: 2.4 },
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

const initializeNewTenantState = (): UserEcoState => ({
  profile: null,
  habits: INITIAL_HABIT_TASKS,
  loggedActionsCount: 0,
  ecoPoints: 10,
  streakCount: 3,
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
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('ecotrace_is_logged_in_v1') === 'true';
  });
  
  // Auth Form Panel input states
  const [authTab, setAuthTab] = useState<'signin' | 'signup' | 'guest'>('signin');
  const [authUsername, setAuthUsername] = useState('');
  const [authPin, setAuthPin] = useState('');
  const [authPinConfirm, setAuthPinConfirm] = useState('');
  const [authMessage, setAuthMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  
  const [rlsSecurityAlert, setRlsSecurityAlert] = useState<string | null>(null);

  const [state, setState] = useState<UserEcoState>(initializeNewTenantState());

  const [apiBudget, setApiBudget] = useState({
    totalCostUsd: 0.0,
    limitUsd: 1.00,
    requestCount: 0,
    isLimitReached: false
  });

  const activeRowKey = deriveTenantRowKey(activeUser, activePin);

  // Manual Quick Logger States
  const [manualFoodSelected, setManualFoodSelected] = useState('veg');
  const [manualMiles, setManualMiles] = useState(5);
  const [customActionText, setCustomActionText] = useState('');
  const [customActionCategory, setCustomActionCategory] = useState<'home' | 'travel' | 'food' | 'shopping'>('home');

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

  // Pull budget status from server
  const fetchBudgetStatus = async () => {
    try {
      const res = await fetch('/api/budget');
      if (res.ok) {
        const data = await res.json();
        setApiBudget({
          totalCostUsd: data.totalCostUsd || 0,
          limitUsd: data.limitUsd || 1.00,
          requestCount: data.requestCount || 0,
          isLimitReached: !!data.isLimitReached
        });
      }
    } catch (err) {
      console.warn('Error reading budget details:', err);
    }
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
    triggerAIInsightsUpdate(nextState);
  };

  // Direct REST API Sync with error logging
  const triggerAIInsightsUpdate = async (currentState: UserEcoState) => {
    if (!currentState.profile) return;

    setState(prev => ({ ...prev, aiInsightsLoading: true }));
    try {
      const response = await fetch('/api/insights/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentState),
      });

      if (!response.ok) {
        throw new Error('AI Engine failed to compute current metrics.');
      }

      const data = await response.json();
      
      if (data.apiBudget) {
        setApiBudget(data.apiBudget);
      }

      setState(prev => {
        const next = { 
          ...prev, 
          aiInsights: data, 
          aiInsightsLoading: false 
        };
        const { signature } = signState(next);
        localStorage.setItem(activeRowKey, JSON.stringify({ ...next, signature }));
        return next;
      });
    } catch (e) {
      console.error('[AI Insights Trigger Failure]:', e);
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

    const nextHabits = state.habits.map((h) => 
      h.id === id ? { ...h, completed: nextComp } : h
    );

    updateState({
      habits: nextHabits,
      ecoPoints: Math.max(0, state.ecoPoints + ptsDiff),
      loggedActionsCount: Math.max(0, state.loggedActionsCount + countDiff)
    });
  };

  // Success message flashes
  const [achievementMsg, setAchievementMsg] = useState<string | null>(null);
  const onQuickSuccessNotification = (msg: string) => {
    setAchievementMsg(msg);
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

  const calculateActualCurrentScore = () => {
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
  };

  const currentScore = calculateActualCurrentScore();

  // AUTHENTICATION VISUAL INTERFACE INTERCEPTOR
  if (!isLoggedIn) {
    return (
      <div id="ecotrace-auth-root" className="min-h-screen bg-stone-50 flex flex-col justify-between text-gray-800 antialiased font-sans">
        
        {/* Toast Toast Notifications */}
        {achievementMsg && (
          <div id="auth-toast" className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-950 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 border border-emerald-500/30 font-bold text-xs font-mono">
            <Sparkles className="w-5 h-5 text-yellow-400 animate-spin" />
            <span>{achievementMsg}</span>
          </div>
        )}

        {/* Minimal header */}
        <header className="px-6 py-5 border-b border-gray-150 bg-white">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-gradient-to-tr from-emerald-600 to-teal-500 text-white rounded-xl shadow-md">
                <Leaf className="w-5 h-5" />
              </div>
              <div>
                <span className="text-md font-black text-gray-950 tracking-tight leading-none flex items-center gap-1.5 uppercase">
                  ECOTRACE <span className="text-[9px] font-mono uppercase bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-extrabold tracking-wide">SECURE</span>
                </span>
                <p className="text-[9px] font-bold text-emerald-800 uppercase tracking-widest leading-none mt-1 font-extrabold">by THEKEDAAR.PROD</p>
              </div>
            </div>
            <div className="text-[10px] text-gray-450 font-mono tracking-wider flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-emerald-650" /> SECURED END-TO-END CRYPTO PORTAL
            </div>
          </div>
        </header>

        {/* Auth card content */}
        <main className="flex-1 flex items-center justify-center p-6 my-8">
          <div className="w-full max-w-sm bg-white border border-gray-200/80 rounded-3xl p-8 shadow-sm space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 bg-emerald-50 text-emerald-700 rounded-full">
                <Shield className="w-6 h-6" />
              </div>
              <h1 className="text-lg font-bold tracking-tight text-gray-900">Secure Carbon Vault</h1>
              <p className="text-xs text-gray-400 max-w-sm mx-auto leading-normal">
                Sign in or create a private partitioned storage vault to secure your local carbon data.
              </p>
            </div>

            {/* Tabs selector */}
            <div className="flex bg-gray-100/80 p-1 rounded-xl">
              <button
                id="tab-signin-btn"
                onClick={() => { setAuthTab('signin'); setAuthMessage(null); }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  authTab === 'signin' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-950'
                }`}
              >
                Sign In
              </button>
              <button
                id="tab-signup-btn"
                onClick={() => { setAuthTab('signup'); setAuthMessage(null); }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  authTab === 'signup' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-950'
                }`}
              >
                Sign Up
              </button>
              <button
                id="tab-guest-btn"
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
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block font-mono">Tenant ID / Username</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
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
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block font-mono">Access PIN Code</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
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
                  <label className="text-[10px] font-bold text-gray-400 uppercase block font-mono">Choose Tenant ID</label>
                  <div className="relative">
                    <UserPlus className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      id="auth-username-up"
                      type="text"
                      required
                      placeholder="e.g. user_alpha"
                      value={authUsername}
                      onChange={(e) => setAuthUsername(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:border-gray-500 focus:outline-none focus:bg-white bg-gray-50/50 font-mono"
                    />
                  </div>
                  <p className="text-[9px] text-gray-400 leading-none mt-1">
                    3-15 lowercase letters, digits, or underscores.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase block font-mono">Access PIN Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
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
                  <label className="text-[10px] font-bold text-gray-400 uppercase block font-mono">Confirm PIN</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
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
                  onClick={handleContinueAsGuest}
                  className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer hover:shadow-sm transition-all text-center flex items-center justify-center gap-1.5"
                >
                  Enter as Sandbox Guest
                </button>
              </div>
            )}

            {/* Quick Guest Bypass / Skip Login Option */}
            <div className="pt-4 border-t border-gray-100 flex flex-col items-center gap-2">
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider font-mono">Bypass Login</span>
              <button
                id="quick-skip-to-guest-btn"
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
        <footer className="py-8 text-center text-xs text-gray-400 border-t border-gray-150 bg-white">
          <p className="font-extrabold tracking-wide text-gray-700">ECOTRACE • THEKEDAAR.PROD EDITION</p>
          <p className="text-[10px] text-gray-400 max-w-sm mx-auto mt-1 leading-normal px-2 font-mono">
            Isolated Multi-Tenant Ledger framework designed & hosted by THEKEDAAR.PROD.
          </p>
        </footer>
      </div>
    );
  }

  return (
    <div id="ecotrace-app-main-root" className="min-h-screen bg-neutral-50 text-gray-800 antialiased font-sans">
      
      {/* Dynamic Flash Notifications Banner */}
      {achievementMsg && (
        <div id="toast-notif-bar" className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 border border-emerald-500/30 animate-bounce">
          <Sparkles className="w-5 h-5 text-yellow-400" />
          <span className="text-xs font-bold font-mono tracking-wider">{achievementMsg}</span>
        </div>
      )}

      {/* Global Navigation Header */}
      <header id="global-header" className="sticky top-0 z-45 bg-white/95 backdrop-blur border-b border-gray-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-tr from-emerald-600 to-teal-500 text-white rounded-xl shadow-md">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <span className="text-md font-black text-gray-900 tracking-tight leading-none flex items-center gap-1.5">
                ECOTRACE <span className="text-[10px] font-mono uppercase bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-extrabold tracking-wide">SECURE</span>
              </span>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-1">Smart Carbon Reducer</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Active Vault Badge */}
            <div className="hidden sm:flex items-center gap-1.5 bg-stone-100 border border-stone-200 text-stone-700 px-3 py-1.5 rounded-full text-xs font-mono font-bold">
              {state.isPremiumActive ? (
                <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-300 stroke-amber-600 animate-pulse" />
              ) : (
                <Shield className="w-3.5 h-3.5 text-emerald-600 font-bold" />
              )}
              <span>User: <span className="text-stone-900 font-extrabold">{activeUser}</span>{state.isPremiumActive && <span className="text-amber-700 font-black text-[10px] uppercase ml-1">PLATINUM</span>}</span>
            </div>

            {state.profile ? (
              <div className="flex items-center gap-3">
                {/* Point Indicator */}
                <div id="eco-points-badge" className="flex items-center gap-1.5 bg-emerald-50 text-emerald-850 px-3.5 py-1.5 rounded-full border border-emerald-100 text-xs font-bold font-mono shadow-xs">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <span>{state.ecoPoints} Pts</span>
                </div>

                {/* Streak Counter */}
                <div id="streak-counter-badge" className="flex items-center gap-1.5 bg-orange-50 text-orange-850 px-3.5 py-1.5 rounded-full border border-orange-100 text-xs font-bold font-mono shadow-xs">
                  <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
                  <span>{state.streakCount} Days</span>
                </div>
              </div>
            ) : (
              <div className="text-[10px] text-gray-400 font-mono tracking-wider">ONBOARDING PROFILE ACTIVE</div>
            )}

            {/* Lock Session / Logout Action and Workspace Wiping Button side by side */}
            <div className="flex items-center border-l border-gray-150 pl-3 gap-1">
              {state.profile && (
                <button
                  id="purge-profile-nav-btn"
                  onClick={handleResetProfile}
                  title="Wipe & Reset Profile Data"
                  className="p-1 px-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer text-xs flex items-center"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                id="lock-partition-session-btn"
                onClick={handleLogout}
                title="Lock & Exit Vault Partition"
                className="p-1 px-2 text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer text-xs flex items-center"
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

        {!state.profile ? (
          /* ONBOARDING FLOW PANEL */
          <div id="un-onboarded-workspace" className="space-y-12 py-6">
            <div className="max-w-2xl mx-auto text-center space-y-4">
              <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" /> Behavior Science Carbon Tracking
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
                Emissions tracking, scaled to zero effort.
              </h2>
              <p className="text-sm text-gray-500 max-w-lg mx-auto leading-relaxed">
                EcoTrace connects safely to your utilities and ledger cards to automatically categorize emissions, recommending micro-rewards instead of climate guilt.
              </p>
            </div>

            <OnboardingWizard onOnboardingComplete={handleOnboardingComplete} />
          </div>
        ) : (
          /* CORE DASHBOARD WORKSPACE */
          <div id="onboarded-workspace" className="space-y-8 animate-fade-in">

            {/* Profile Intro Greeting Badge */}
            <div id="welcome-profile-card" className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-emerald-600 tracking-widest uppercase">Environmental Status: **{state.profile.name}**</span>
                <h2 className="text-xl font-extrabold text-gray-900">Your Carbon Footprint Matrix</h2>
                <p className="text-xs text-gray-500 max-w-lg leading-relaxed mt-1">
                  {state.profile.personalizedWelcome.replace(/\*\*/g, '')}
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <span className="text-xs text-gray-400 font-semibold font-mono">My Persona Badge:</span>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl shadow-sm">
                  🏆 {state.profile.name}
                </span>
              </div>
            </div>

            {/* Main Charts & Wheels Component */}
            <EmissionsCharts profile={state.profile} currentActualScore={currentScore} />

            {/* Premium Gold Carbon-Neutral Planner Suite */}
            <PremiumSuite 
              ecoState={state} 
              onUpdateState={updateState} 
              onPostNotification={onQuickSuccessNotification} 
              triggerAIUpdate={triggerAIInsightsUpdate}
            />

            {/* AI Custom Insights panel */}
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

            {/* Quick Actions & Habits Loggers column split */}
            <div id="habit-management-cols" className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column: Habits checklist */}
              <div id="habits-checklist-box" className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Daily Eco Habits Tracker</h3>
                  <p className="text-xs text-gray-400 mt-1">Check completed daily actions to count points and live-calculate saved carbon offset</p>
                </div>

                <div className="space-y-3">
                  {state.habits.map((h) => (
                    <button
                      id={`habit-task-${h.id}`}
                      key={h.id}
                      onClick={() => handleToggleHabit(h.id)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all hover:bg-gray-50/50 cursor-pointer ${
                        h.completed ? 'bg-emerald-50/10 border-emerald-500/20 text-gray-500' : 'bg-white border-gray-100 text-gray-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-full border transition-all ${
                          h.completed ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white border-gray-250 text-transparent'
                        }`}>
                          <Check className="w-3.5 h-3.5" strokeWidth={3} />
                        </div>
                        <span className={`text-xs ${h.completed ? 'line-through text-gray-400 font-medium' : 'font-bold'}`}>{h.text}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-emerald-700 font-mono">+{h.points} Pts</span>
                        <div className="text-[9px] text-gray-400 font-mono mt-0.5">-{h.co2SavedKg}kg CO₂</div>
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
                      placeholder="Add custom impact habit... (e.g. cold laundry wash)"
                      value={customActionText}
                      onChange={(e) => setCustomActionText(e.target.value)}
                      className="flex-1 text-xs border border-gray-200 bg-gray-550/50 px-4 py-2 rounded-xl focus:border-emerald-500 focus:outline-none focus:bg-white"
                    />
                    <select
                      id="custom-action-category-select"
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
              <div id="manual-insights-box" className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Manual Food & Commute Quick-Logs</h3>
                  <p className="text-xs text-gray-400 mt-1">Don't have automations connected? Use manual quick-log widgets in under 5 seconds</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Food entry panel */}
                  <div id="food-entry-panel" className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
                    <h4 className="text-xs font-black text-gray-700 uppercase tracking-wider">Fast Food & Dining Out</h4>
                    
                    <div className="grid grid-cols-3 gap-1.5 p-1 bg-white border border-gray-200 rounded-xl">
                      {['vegan', 'veg', 'meat'].map((type) => (
                        <button
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
                  <div id="commute-entry-panel" className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
                    <div className="flex justify-between items-center text-xs font-black text-gray-700 uppercase tracking-wider">
                      <span>Carbonavoid Commute</span>
                      <span className="font-mono text-emerald-600">{manualMiles} mi</span>
                    </div>

                    <input
                      id="commute-miles-range"
                      type="range"
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

            {/* Smart Automated Integrations feeds connector row */}
            <IntegrationsPanel 
              ecoState={state} 
              onUpdateState={updateState} 
              triggerAIUpdate={triggerAIInsightsUpdate} 
            />

            {/* Gamification Challenges & partner discounts shop component */}
            <CommunityShop 
              ecoState={state} 
              onUpdateState={updateState} 
            />

          </div>
        )}
      </main>

      <footer id="global-footer" className="bg-white border-t border-gray-100 py-10 mt-16 text-center text-xs text-gray-400 space-y-2">
        <p className="font-extrabold tracking-wide text-gray-800">ECOTRACE © 2026</p>
        <p className="max-w-md mx-auto leading-normal">
          Engineered and crafted by <span className="font-black text-emerald-800">THEKEDAAR.PROD</span>. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
