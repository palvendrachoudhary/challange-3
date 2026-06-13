/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserEcoState } from '../types';
import { 
  Crown, 
  Sparkles, 
  Zap, 
  Check, 
  Lock, 
  Star, 
  Activity, 
  ArrowUpRight, 
  Plus, 
  Minus, 
  Leaf, 
  HelpCircle, 
  AlertCircle
} from 'lucide-react';

interface PremiumSuiteProps {
  ecoState: UserEcoState;
  onUpdateState: (updates: Partial<UserEcoState>) => void;
  onPostNotification: (message: string) => void;
  triggerAIUpdate: (newState: UserEcoState) => void;
}

const PREMIUM_OFFSETS = [
  {
    id: 'off-1',
    name: 'CleanAir High-Tech DAC',
    type: 'Direct Air Capture (DAC) Suite',
    offsetRateKgPerDay: 4.5,
    desc: 'High-tech collectors vacuum carbon from ambient air, storing it underground in basalt stone permanently.',
  },
  {
    id: 'off-2',
    name: 'Coastal Mangrove Blue-Carbon',
    type: 'Wetland Bio-Restoration',
    offsetRateKgPerDay: 3.0,
    desc: 'Marine mangrove roots store up to 5x more carbon per acre than dry pine soils while saving coastal biomes.',
  },
  {
    id: 'off-3',
    name: 'Amazon Rainforest Protection',
    type: 'Deforestation Buffer Block',
    offsetRateKgPerDay: 3.8,
    desc: 'Legally shields dense old-growth acreage in Para, Brazil from predatory logging and livestock grazing.',
  }
];

export default function PremiumSuite({ ecoState, onUpdateState, onPostNotification, triggerAIUpdate }: PremiumSuiteProps) {
  const [activeTab, setActiveTab] = useState<'offset' | 'iot' | 'advisory'>('offset');
  const [connectingPlug, setConnectingPlug] = useState(false);

  const isPremium = !!ecoState.isPremiumActive;
  const activeOffsets = ecoState.premiumOffsets || [];
  const smartPlugs = ecoState.smartPlugsCount || 0;
  const totalSmartSaves = ecoState.totalSmartSavesKg || 0;

  const handleActivatePremium = () => {
    const updatedState = {
      ...ecoState,
      isPremiumActive: true
    };
    onUpdateState({
      isPremiumActive: true
    });
    onPostNotification('✨ Activated EcoTrace Platinum Premium Suite for Free!');
    triggerAIUpdate(updatedState);
  };

  const handleToggleOffset = (id: string) => {
    if (!isPremium) return;

    let updatedOffsets = [...activeOffsets];

    if (updatedOffsets.includes(id)) {
      // Deactivate
      updatedOffsets = updatedOffsets.filter(x => x !== id);
      onPostNotification('Subscription paused. Carbon impact adjusted.');
    } else {
      // Activate
      updatedOffsets.push(id);
      onPostNotification(`🚀 Activated carbon offset: ${PREMIUM_OFFSETS.find(x => x.id === id)?.name}`);
    }

    const updatedState = {
      ...ecoState,
      premiumOffsets: updatedOffsets
    };
    onUpdateState(updatedState);
    triggerAIUpdate(updatedState);
  };

  const handleAddSmartPlug = () => {
    if (!isPremium) return;
    setConnectingPlug(true);

    setTimeout(() => {
      const newPlugCount = smartPlugs + 1;
      const additionalSavings = Math.round(Math.random() * 8 + 4); // 4-12kg
      const updatedState = {
        ...ecoState,
        smartPlugsCount: newPlugCount,
        totalSmartSavesKg: totalSmartSaves + additionalSavings,
        ecoPoints: ecoState.ecoPoints + 20 // bonus points for device connection
      };
      
      onUpdateState({
        smartPlugsCount: newPlugCount,
        totalSmartSavesKg: totalSmartSaves + additionalSavings,
        ecoPoints: ecoState.ecoPoints + 20
      });

      setConnectingPlug(false);
      onPostNotification(`🔌 IoT Smart Adapter Synchronized! +${additionalSavings}kg standby carbon locked.`);
      triggerAIUpdate(updatedState);
    }, 1200);
  };

  // Live off-set rates calculation
  const totalDailyOffsetRate = PREMIUM_OFFSETS
    .filter(o => activeOffsets.includes(o.id))
    .reduce((sum, o) => sum + o.offsetRateKgPerDay, 0);

  return (
    <div id="premium-suite-outer-container" className="relative bg-gradient-to-br from-amber-50/40 via-white to-stone-50 border border-amber-200/50 rounded-3xl p-6 md:p-8 shadow-sm overflow-hidden animate-fade-in">
      
      {/* Decorative Gold Badge Elements */}
      <div className="absolute right-0 top-0 -mr-12 -mt-12 w-48 h-48 bg-amber-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute left-1/3 bottom-0 -ml-12 -mb-12 w-48 h-48 bg-emerald-200/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header element */}
      <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-stone-200/60 gap-4 mb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 bg-amber-100 border border-amber-300 text-amber-800 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
            <Crown className="w-3.5 h-3.5 fill-amber-600 stroke-amber-700" /> Platinum Suite
          </div>
          <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
            EcoTrace Platinum Carbon-Neutral Planner
          </h2>
          <p className="text-xs text-gray-400">
            Automate continuous offsets, configure idle appliance standby sensors, and design complex reduction paths.
          </p>
        </div>

        {/* Upgrade Button or Premium Indicator Badge */}
        {!isPremium ? (
          <button
            id="premium-upgrade-cta-btn"
            onClick={handleActivatePremium}
            className="w-full md:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-600 via-amber-700 to-yellow-600 hover:shadow-md text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all border border-amber-500/30"
          >
            <Crown className="w-4 h-4 animate-bounce" /> Unlock Premium Suite (FREE)
          </button>
        ) : (
          <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-400/30 p-2 px-4 rounded-2xl">
            <Star className="w-4 h-4 text-amber-600 fill-amber-500 animate-pulse" />
            <span className="text-xs font-black text-amber-800 tracking-wider">PLATINUM LEVEL ENABLED</span>
          </div>
        )}
      </div>

      {/* RENDER BODY WITH OVERLAY IF NOT PREMIUM */}
      <div className="relative animate-fade-in">
        
        {/* Lock Overlay */}
        {!isPremium && (
          <div className="absolute inset-0 z-30 bg-white/80 backdrop-blur-[2px] rounded-2xl flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="p-3.5 bg-amber-55/70 border border-amber-200 text-amber-750 rounded-full shadow-sm">
              <Lock className="w-6 h-6 animate-pulse text-amber-600" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Access Locked to Premium Tier</h4>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 leading-normal">
                Activate high-impact automated direct air offset portfolios and IoT standby controllers instantly. Completely Free.
              </p>
            </div>
            <button
              id="premium-unlock-inner-btn"
              onClick={handleActivatePremium}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow cursor-pointer transition-all flex items-center gap-1.5"
            >
              <Crown className="w-3.5 h-3.5" /> Activate Premium Suite (Free)
            </button>
          </div>
        )}

        {/* Content Tabs selector */}
        <div className="flex border-b border-stone-200/40 pb-3 mb-6 gap-6 text-xs font-bold text-gray-500">
          <button
            id="premium-tab-offset"
            onClick={() => setActiveTab('offset')}
            className={`pb-2.5 transition-all relative cursor-pointer ${
              activeTab === 'offset' ? 'text-amber-800 border-b-2 border-amber-600 font-extrabold' : 'hover:text-gray-900'
            }`}
          >
            Continuous Carbon Portfolios ({activeOffsets.length} active)
          </button>
          <button
            id="premium-tab-iot"
            onClick={() => setActiveTab('iot')}
            className={`pb-2.5 transition-all relative cursor-pointer ${
              activeTab === 'iot' ? 'text-amber-800 border-b-2 border-amber-600 font-extrabold' : 'hover:text-gray-900'
            }`}
          >
            Standby IoT Plugs ({smartPlugs} connected)
          </button>
          <button
            id="premium-tab-advisory"
            onClick={() => setActiveTab('advisory')}
            className={`pb-2.5 transition-all relative cursor-pointer ${
              activeTab === 'advisory' ? 'text-amber-800 border-b-2 border-amber-600 font-extrabold' : 'hover:text-gray-900'
            }`}
          >
            Elite Carbon Budget
          </button>
        </div>

        {/* TAB 1: CONTINUOUS CARBON OFFSET SUBSCRIPTIONS */}
        {activeTab === 'offset' && (
          <div className="space-y-6">
            
            {/* Live rate preview stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-stone-900 text-white p-5 rounded-2xl">
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block font-mono">My Offset Rate</span>
                <span className="text-2xl font-black font-mono tracking-tight text-white">{totalDailyOffsetRate.toFixed(1)} kg</span>
                <span className="text-xs text-gray-400 ml-1">CO₂ / day</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block font-mono">Monthly Avoidance Estimate</span>
                <span className="text-2xl font-black font-mono tracking-tight text-emerald-400">{(totalDailyOffsetRate * 30).toFixed(0)} kg</span>
                <span className="text-xs text-gray-400 ml-1">CO₂ saved</span>
              </div>
              <div className="flex items-center">
                <span className="text-xs text-stone-300 leading-normal pl-4 border-l border-white/10">
                  Subscriptions are deducted continuously from your score baseline, dynamically keeping your footprint score close to neutrality.
                </span>
              </div>
            </div>

            {/* List offset programs */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {PREMIUM_OFFSETS.map((off) => {
                const isActive = activeOffsets.includes(off.id);
                return (
                  <div
                    key={off.id}
                    className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 transition-all hover:shadow-xs bg-white ${
                      isActive ? 'border-amber-400 shadow-sm ring-1 ring-amber-300/30' : 'border-gray-150'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded uppercase font-mono">
                          Free Setup
                        </span>
                        <span className="text-xs font-bold text-emerald-700 font-mono flex items-center gap-0.5">
                          -{off.offsetRateKgPerDay}kg/day
                        </span>
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-gray-900 leading-snug">{off.name}</h4>
                        <span className="text-[9px] text-gray-400 uppercase block leading-none font-semibold font-mono">{off.type}</span>
                        <p className="text-xs text-gray-500 leading-relaxed mt-2">{off.desc}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleOffset(off.id)}
                      className={`w-full py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                        isActive
                          ? 'bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-100/50'
                          : 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                      }`}
                    >
                      {isActive ? 'Pause Offset' : 'Activate offset portfolio'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: SMART ENERGY STANDBY IOT PLUGS */}
        {activeTab === 'iot' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-emerald-50 border border-emerald-100 p-5 rounded-2xl gap-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-emerald-900 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-emerald-600 animate-bounce" /> Vampire standby-power auto-shutdown active
                </h4>
                <p className="text-xs text-emerald-800 leading-normal max-w-xl">
                  Standby power accounts for up to 10% of home utility bills. Our virtual IoT scanner shuts down systems (consoles, media, charges) under sleep timers automatically.
                </p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[11px] font-bold text-emerald-700 uppercase block font-mono">STANDBY SAVINGS</span>
                <span className="text-xl font-mono font-black text-emerald-800">-{totalSmartSaves} kg CO₂</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-150 p-5 rounded-2xl space-y-4">
                <h3 className="text-xs font-black text-gray-700 uppercase tracking-wider font-mono">My Smart Grid Adapters</h3>
                
                {smartPlugs === 0 ? (
                  <div className="py-6 text-center text-xs text-gray-400 space-y-2">
                    <Activity className="w-8 h-8 text-stone-350 mx-auto" />
                    <p>No smart IoT adapters synchronized yet. Connect key home appliances to begin monitoring standby leakage.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {Array.from({ length: smartPlugs }).map((_, i) => (
                      <div key={i} className="flex justify-between items-center text-xs p-3 bg-stone-50 border border-stone-100 rounded-xl">
                        <div className="flex items-center gap-2">
                          <div className="p-1 text-emerald-700 bg-white rounded-md border border-emerald-100">
                            <Zap className="w-3.5 h-3.5 fill-emerald-500" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-800">Smart Adapter #{i + 1}</p>
                            <span className="text-[10px] text-emerald-600 font-mono uppercase bg-emerald-50 px-1 rounded">Active-Auto</span>
                          </div>
                        </div>

                        <span className="font-mono text-emerald-700 font-bold">~1.2W standby saved</span>
                      </div>
                    ))}
                  </div>
                )}
                
                <button
                  id="add-smart-plug-btn"
                  onClick={handleAddSmartPlug}
                  disabled={connectingPlug}
                  className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-gray-300 text-gray-600 text-xs font-semibold rounded-xl hover:border-emerald-500 hover:text-emerald-700 cursor-pointer transition-colors"
                >
                  <Plus className="w-4 h-4" /> {connectingPlug ? 'Pinging Zigbee Hub...' : 'Add Standby Smart Plug'}
                </button>
              </div>

              {/* standby calculations card info */}
              <div className="bg-white border border-gray-150 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-gray-700 uppercase tracking-wider font-mono">Real-time Grid Analysis</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Total Connected Devices:</span>
                      <span className="font-bold text-gray-900">{smartPlugs}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Continuous Wattage Preventive Shutoff:</span>
                      <span className="font-bold text-emerald-600 font-mono">{(smartPlugs * 1.5).toFixed(1)}W stand-by</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Annual Prevented Household Cost:</span>
                      <span className="font-bold text-emerald-700 font-mono">${(smartPlugs * 4.25).toFixed(2)} USD</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 text-amber-850 rounded-xl text-[11px] leading-relaxed flex items-start gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                  <span>
                    <strong>Carbon Saving Formula:</strong> Smart plug avoidance saves stand-by wattage 12 hours daily during work / sleep routines, preventing clean-grid carbon waste.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ELITE ADVOCACY STATUS AND STRATEGY */}
        {activeTab === 'advisory' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 border border-stone-200/60 rounded-2xl bg-white space-y-3">
                <span className="text-[10px] font-bold text-amber-600 tracking-wider block font-mono uppercase">VIP Carbon Quota</span>
                <h4 className="text-sm font-black text-gray-900 leading-tight">EcoTrace Platinum Elite Program</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  As a Platinum level participant, you gain early access to beta carbon-reduction partnerships and certified reforestation programs. Make sure to consult Gemini analytics below with your premium configurations.
                </p>
                <div className="pt-2 flex gap-3 text-xs font-bold">
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-1 rounded">✓ Verified CO2 Seals</span>
                  <span className="text-amber-700 bg-amber-50 px-2 py-1 rounded">✓ Gold Star Status</span>
                </div>
              </div>

              <div className="p-5 bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-amber-500/20 rounded-2xl flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-[9px] font-black uppercase text-amber-800 font-mono">VIP ADVOCACY QUOTAS</span>
                  <h4 className="text-sm font-bold text-amber-950 mt-1 leading-tight">Personalized Carbon Neutral Certificate Available</h4>
                  <p className="text-[11px] text-amber-900 leading-normal mt-1">
                    Once your calculated net footprint score score drops below **3.0 Tons/year**, you qualify to download a Cryptographically Sealed Carbon Neutral Participant Certificate.
                  </p>
                </div>
                
                <div className="text-xs text-amber-950 font-bold flex items-center gap-1 font-mono">
                  Current Net: <span className="underline decoration-amber-600">Locked</span> (Unlock at &lt; 3.0T baseline)
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
