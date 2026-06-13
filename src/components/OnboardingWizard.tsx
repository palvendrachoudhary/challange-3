/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { OnboardingQuiz, CarbonProfile } from '../types';
import { Leaf, Flame, ShieldAlert, ArrowRight, ArrowLeft, Loader2, Sparkles } from 'lucide-react';

interface OnboardingWizardProps {
  onOnboardingComplete: (profile: CarbonProfile, isFallback: boolean) => void;
}

const DIET_OPTIONS = [
  { value: 'vegan', label: 'Plant-Based / Vegan', desc: 'Zero meat, dairy, or animal product emissions.', icon: '🌱' },
  { value: 'vegetarian', label: 'Vegetarian', desc: 'No meat, incorporates dairy and eggs.', icon: '🥚' },
  { value: 'balanced', label: 'Balanced Consumer', desc: 'Occasional meat, poultry, and varied items.', icon: '🍲' },
  { value: 'high-meat', label: 'High Meat Intake', desc: 'Frequent beef, pork, or poultry with meals.', icon: '🥩' },
];

const COMMUTE_OPTIONS = [
  { value: 'walk-cycle', label: 'Active Transit', desc: 'Walking, running, or cycling everywhere.', icon: '🚲' },
  { value: 'electric-car', label: 'Electric Vehicle', desc: 'Zero tailpipe emissions, grid charging.', icon: '⚡' },
  { value: 'public-transit', label: 'Public Transit', desc: 'Trains, subways, metro systems, or buses.', icon: '🚌' },
  { value: 'car', label: 'Combustion Engine Car', desc: 'Gasoline, diesel, or hybrid personal driving.', icon: '🚗' },
];

const ENERGY_OPTIONS = [
  { value: 'electric-solar', label: 'Solar & Renewable', desc: 'Rooftop solar panels, clean storage.', icon: '☀️' },
  { value: 'grid-electric', label: 'Grid Electricity', desc: 'Standard power from mixed regional grid.', icon: '💡' },
  { value: 'heating-gas', label: 'Natural Gas / Oil heating', desc: 'Fossil fuel combustion warming systems.', icon: '🔥' },
];

const SIZE_OPTIONS = [
  { value: 'apartment', label: 'Apartment / Tiny House', desc: 'Shared structure insulation, small layout.', icon: '🏢' },
  { value: 'medium-house', label: 'Medium Townhouse / House', desc: 'Modest heating & utility load footprint.', icon: '🏡' },
  { value: 'large-house', label: 'Large Detached Estate', desc: 'High thermostat coverage and spacious energy demands.', icon: '🏰' },
];

const SHOPPING_OPTIONS = [
  { value: 'minimalist', label: 'Conscious Minimalist', desc: 'Buy secondhand, rare clothing purchases.', icon: '📦' },
  { value: 'average', label: 'Standard Purchaser', desc: 'Moderate shopping, occasional fast fashion.', icon: '🛍️' },
  { value: 'frequent-buyer', label: 'High Consumption Retailer', desc: 'Regular trends updates, brand packaging and shipping.', icon: '💎' },
];

export default function OnboardingWizard({ onOnboardingComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [quiz, setQuiz] = useState<OnboardingQuiz>({
    diet: 'balanced',
    commuteMode: 'car',
    weeklyMileage: 35,
    flightsPerYear: 1,
    homeEnergy: 'grid-electric',
    homeSize: 'medium-house',
    shoppingHabits: 'average',
  });

  const [loadingMessageIdx, setLoadingMessageIdx] = useState(0);
  const loadingMessages = [
    'Calculating eco baseline variables locally...',
    'Tuning state multipliers against climate research database...',
    'Drafting custom habit loops using behavior sciences...',
    'Securing sandbox utility integration protocols...',
  ];

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setLoadingMessageIdx((prev) => (prev + 1) % loadingMessages.length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleNext = () => {
    setError(null);
    setStep((prev) => prev + 1);
  };

  const handlePrev = () => {
    setError(null);
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      // Perform calculation locally to avoid API calls on static deployment
      let home = 3.5; // Apartment default
      if (quiz.homeSize === 'medium-house') home = 3.5;
      if (quiz.homeSize === 'large-house') home = 5.2;

      if (quiz.homeEnergy === 'electric-solar') home *= 0.15; // Solar offset
      if (quiz.homeEnergy === 'grid-electric') home *= 0.8;

      let travel = 0.5; // low travel
      const weeklyMileage = Number(quiz.weeklyMileage) || 35;
      const flightsPerYear = Number(quiz.flightsPerYear) || 1;
      
      if (quiz.commuteMode === 'car') {
        travel += (weeklyMileage * 52 * 0.404) / 1000;
      } else if (quiz.commuteMode === 'electric-car') {
        travel += (weeklyMileage * 52 * 0.12) / 1000;
      } else if (quiz.commuteMode === 'public-transit') {
        travel += (weeklyMileage * 52 * 0.14) / 1000;
      } else {
        travel += 0.05;
      }

      travel += flightsPerYear * 0.8;

      let food = 1.5; // balanced
      if (quiz.diet === 'vegan') food = 0.5;
      if (quiz.diet === 'vegetarian') food = 0.9;
      if (quiz.diet === 'high-meat') food = 2.8;

      let shopping = 1.0;
      if (quiz.shoppingHabits === 'minimalist') shopping = 0.3;
      if (quiz.shoppingHabits === 'frequent-buyer') shopping = 2.4;

      const total = Math.round((home + travel + food + shopping) * 10) / 10;
      const personaName = quiz.commuteMode === 'walk-cycle' ? 'Active Eco-Explorer' :
                          quiz.diet === 'vegan' ? 'Green Plate Pioneer' : 'Mindful Consumer';

      // Simulate a small network delay
      await new Promise(resolve => setTimeout(resolve, 800));

      onOnboardingComplete({
          name: personaName,
          baselineScore: isNaN(total) ? 12.0 : total,
          baselineBreakdown: { 
            home: isNaN(home) ? 3.5 : Math.round(home * 10) / 10,
            travel: isNaN(travel) ? 4.2 : Math.round(travel * 10) / 10, 
            food: isNaN(food) ? 1.5 : Math.round(food * 10) / 10, 
            shopping: isNaN(shopping) ? 1.8 : Math.round(shopping * 10) / 10
          },
          targetScore: Math.round((total * 0.75) * 10) / 10,
          personalizedWelcome: `Welcome to EcoTrace! Based on your onboarding details, your primary impact area is **${home > travel ? 'Home Energy' : 'Travel & Commutes'}**. Fortunately, basic habits like solar/electric swaps can lower this significantly!`,
          initialHabits: [
            quiz.commuteMode === 'car' ? 'Walk or bike for short trips under 1.5 miles' : 'Turn down home thermostat by 1°C',
            quiz.diet === 'high-meat' ? 'Introduce Meatless Mondays into your weekly meal planning' : 'Unplug your home electronics and game consoles before bed',
            'Repurpose or repair one old clothing item instead of buying new'
          ],
      }, true);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during state optimization.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="onboarding-wizard-container" className="max-w-2xl mx-auto bg-white border border-gray-100 rounded-3xl p-8 md:p-12 shadow-sm animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
            <Leaf className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-xs font-semibold text-emerald-600 tracking-wider uppercase">EcoTrace Profile Setup</span>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight leading-none mt-0.5">2-Min Carbon Quiz</h1>
          </div>
        </div>
        <div className="text-sm font-mono text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
          Step {step} of 5
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 w-full bg-gray-100 rounded-full mb-10 overflow-hidden">
        <div 
          className="h-full bg-emerald-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${(step / 5) * 100}%` }}
        />
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-550 border border-thin border-rose-100 text-rose-700 rounded-xl flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <div className="relative mb-6">
            <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
            <Sparkles className="w-6 h-6 text-yellow-500 absolute -top-2 -right-2 animate-bounce" />
          </div>
          <p className="text-lg font-medium text-gray-900 tracking-tight">Optimizing carbon footprint matrix...</p>
          <p className="text-sm text-gray-500 font-mono max-w-sm mt-2 transition-opacity duration-300">
            {loadingMessages[loadingMessageIdx]}
          </p>
        </div>
      ) : (
        <div className="min-h-[340px] flex flex-col justify-between">
          <div>
            {/* STEP 1: DIET TYPE */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">What best describes your typical daily diet?</h2>
                  <p className="text-sm text-gray-500 mt-1">Primary food choices represent a substantial portion of scope 3 consumption values.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {DIET_OPTIONS.map((opt) => (
                    <button
                      id={`diet-opt-${opt.value}`}
                      key={opt.value}
                      onClick={() => setQuiz({ ...quiz, diet: opt.value as any })}
                      className={`flex items-start text-left p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                        quiz.diet === opt.value
                          ? 'border-emerald-500 bg-emerald-50/40 text-emerald-950'
                          : 'border-gray-100 hover:border-gray-200 text-gray-700 bg-white'
                      }`}
                    >
                      <span className="text-2xl mr-3 mt-0.5">{opt.icon}</span>
                      <div>
                        <div className="font-semibold text-sm">{opt.label}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{opt.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 2: TRAVEL & LEISURE */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">How do you primarily commute?</h2>
                  <p className="text-sm text-gray-500 mt-1">We will detect and track this in high fidelity using GPS integrations later.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {COMMUTE_OPTIONS.map((opt) => (
                    <button
                      id={`commute-opt-${opt.value}`}
                      key={opt.value}
                      onClick={() => setQuiz({ ...quiz, commuteMode: opt.value as any })}
                      className={`flex items-start text-left p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                        quiz.commuteMode === opt.value
                          ? 'border-emerald-500 bg-emerald-50/40 text-emerald-950'
                          : 'border-gray-100 hover:border-gray-200 text-gray-700 bg-white'
                      }`}
                    >
                      <span className="text-2xl mr-3 mt-0.5">{opt.icon}</span>
                      <div>
                        <div className="font-semibold text-sm">{opt.label}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{opt.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="bg-gray-550 p-5 rounded-2xl border border-gray-100 space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-semibold text-gray-700">Estimated weekly commute mileage:</label>
                    <span className="text-lg font-mono font-bold text-emerald-700 bg-white px-3 py-1 rounded-xl shadow-sm border border-gray-100">{quiz.weeklyMileage} miles</span>
                  </div>
                  <input
                    id="weekly-mileage-slider"
                    type="range"
                    min="1"
                    max="150"
                    value={quiz.weeklyMileage}
                    onChange={(e) => setQuiz({ ...quiz, weeklyMileage: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                    <span>1 mile (Low)</span>
                    <span>75 miles (Average)</span>
                    <span>150+ miles (High)</span>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: FLIGHT CO2 SCALE */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">How many return flights do you take per year?</h2>
                  <p className="text-sm text-gray-500 mt-1">Air travel constitutes massive high-altitude carbon radiative forcing spikes.</p>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  {[0, 1, 3, 6].map((num) => (
                    <button
                      id={`flights-btn-${num}`}
                      key={num}
                      onClick={() => setQuiz({ ...quiz, flightsPerYear: num })}
                      className={`py-6 rounded-2xl border-2 font-bold text-xl transition-all flex flex-col justify-center items-center cursor-pointer ${
                        quiz.flightsPerYear === num
                          ? 'border-emerald-500 bg-emerald-50/40 text-emerald-950'
                          : 'border-gray-100 hover:border-gray-200 text-gray-600 bg-white'
                      }`}
                    >
                      <span>{num === 6 ? '6+' : num}</span>
                      <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400 mt-1">Flights</span>
                    </button>
                  ))}
                </div>

                <div className="flex items-start gap-3 bg-blue-50/50 p-4 border border-blue-150 rounded-2xl text-blue-800 text-xs">
                  <Flame className="w-5 h-5 shrink-0 mt-0.5 text-blue-500 animate-pulse" />
                  <p className="leading-relaxed">
                    Did you know? A single round-trip transatlantic flight can emit more than **1.6 Metric Tons** of CO₂ per passenger. That spans almost half of a highly climate-friendly target of 2.5 Tons/year!
                  </p>
                </div>
              </div>
            )}

            {/* STEP 4: HOME HEATING & UTILITY DENSITY */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Residential Energy & Home Footprint</h2>
                  <p className="text-sm text-gray-500 mt-1">Heating source and structural footprint define your home footprint baseline.</p>
                </div>

                <div className="space-y-3">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Home Size & Housing Category</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {SIZE_OPTIONS.map((opt) => (
                      <button
                        id={`size-opt-${opt.value}`}
                        key={opt.value}
                        onClick={() => setQuiz({ ...quiz, homeSize: opt.value as any })}
                        className={`text-left p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                          quiz.homeSize === opt.value
                            ? 'border-emerald-500 bg-emerald-50/40'
                            : 'border-gray-100 hover:border-gray-200 bg-white'
                        }`}
                      >
                        <span className="text-xl inline-block mb-1">{opt.icon}</span>
                        <div className="font-semibold text-xs text-gray-800 leading-tight">{opt.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Primary Energy heating resource</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {ENERGY_OPTIONS.map((opt) => (
                      <button
                        id={`energy-opt-${opt.value}`}
                        key={opt.value}
                        onClick={() => setQuiz({ ...quiz, homeEnergy: opt.value as any })}
                        className={`text-left p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                          quiz.homeEnergy === opt.value
                            ? 'border-emerald-500 bg-emerald-50/40'
                            : 'border-gray-100 hover:border-gray-200 bg-white'
                        }`}
                      >
                        <span className="text-xl inline-block mb-1">{opt.icon}</span>
                        <div className="font-semibold text-xs text-gray-800 leading-tight">{opt.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: IMPACT RETAIL & SHOPPING */}
            {step === 5 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Typical Consumer & Shopping Habits</h2>
                  <p className="text-sm text-gray-500 mt-1">Manufacturing, packaging, and high supply-chain scope 3 shipping represent massive variables.</p>
                </div>
                <div className="space-y-3">
                  {SHOPPING_OPTIONS.map((opt) => (
                    <button
                      id={`shop-opt-${opt.value}`}
                      key={opt.value}
                      onClick={() => setQuiz({ ...quiz, shoppingHabits: opt.value as any })}
                      className={`w-full flex items-center text-left p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        quiz.shoppingHabits === opt.value
                          ? 'border-emerald-500 bg-emerald-50/40 text-emerald-950'
                          : 'border-gray-100 hover:border-gray-200 text-gray-700 bg-white'
                      }`}
                    >
                      <span className="text-2xl mr-4">{opt.icon}</span>
                      <div>
                        <div className="font-semibold text-sm">{opt.label}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{opt.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ACTIONS */}
          <div className="flex justify-between items-center pt-8 border-t border-gray-100 mt-10">
            {step > 1 ? (
              <button
                id="onboarding-prev-btn"
                onClick={handlePrev}
                className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            ) : (
              <div />
            )}

            {step < 5 ? (
              <button
                id="onboarding-next-btn"
                onClick={handleNext}
                className="flex items-center gap-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-6 py-2.5 rounded-full shadow-sm transition-all cursor-pointer ml-auto"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                id="onboarding-submit-btn"
                onClick={handleSubmit}
                className="flex items-center gap-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-8 py-3 rounded-full shadow bg-gradient-to-r from-emerald-600 to-teal-600 hover:shadow-lg transition-all cursor-pointer ml-auto"
              >
                Calculate Footprint <Sparkles className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
