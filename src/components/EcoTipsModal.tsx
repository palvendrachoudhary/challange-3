import React from 'react';
import { X, Lightbulb, Home, Plane, Utensils, ShoppingBag, Zap, Car, Apple, Package } from 'lucide-react';
import { OnboardingQuiz } from '../types';

interface EcoTipsModalProps {
  isOpen: boolean;
  onClose: () => void;
  quiz?: OnboardingQuiz;
}

const EcoTipsModal: React.FC<EcoTipsModalProps> = ({ isOpen, onClose, quiz }) => {
  if (!isOpen) return null;

  const getTips = () => {
    if (!quiz) {
      return [
        { category: "General", icon: <Lightbulb className="w-5 h-5" />, tips: [
          "Start by tracking your daily emissions.",
          "Small changes make big impacts over time.",
          "Check the app daily to build your streak!"
        ]}
      ];
    }

    const tips = [];

    // Diet Tips
    const dietTips = [];
    if (quiz.diet === 'high-meat') {
      dietTips.push("Consider Meatless Mondays to reduce your food carbon footprint quickly.");
      dietTips.push("Try swapping beef for chicken or plant-based proteins, as beef has a much higher carbon footprint.");
    } else if (quiz.diet === 'balanced') {
      dietTips.push("Experiment with plant-based milks (like oat or almond) instead of dairy.");
      dietTips.push("Focus on buying local and seasonal produce to reduce transportation emissions.");
    } else {
      dietTips.push("You're already doing great with a plant-based diet! Focus on reducing food waste.");
      dietTips.push("Compost your food scraps if possible to prevent methane emissions from landfills.");
    }
    tips.push({ category: "Food & Diet", icon: <Apple className="w-5 h-5 text-rose-700 dark:text-rose-400" />, tips: dietTips });

    // Commute Tips
    const commuteTips = [];
    if (quiz.commuteMode === 'car') {
      commuteTips.push("Try carpooling or using public transit at least one day a week.");
      commuteTips.push("For trips under 2 miles, consider walking or biking instead of driving.");
      if (quiz.weeklyMileage > 100) commuteTips.push("Keep your tires properly inflated to improve gas mileage.");
    } else if (quiz.commuteMode === 'public-transit') {
      commuteTips.push("You're saving lots of emissions using transit! Use this time to read or relax.");
    } else if (quiz.commuteMode === 'electric-car') {
      commuteTips.push("Charge your EV during off-peak hours when the grid uses more renewable energy.");
    } else {
      commuteTips.push("Walking and cycling is the ultimate zero-carbon commute. Keep it up!");
    }
    tips.push({ category: "Travel & Commute", icon: <Car className="w-5 h-5 text-blue-500" />, tips: commuteTips });

    // Home Energy Tips
    const energyTips = [];
    if (quiz.homeEnergy === 'heating-gas' || quiz.homeEnergy === 'grid-electric') {
      energyTips.push("Switch to LED bulbs—they use up to 90% less energy than incandescent bulbs.");
      energyTips.push("Turn down your water heater to 120°F (49°C) to save energy safely.");
    }
    if (quiz.homeSize === 'large-house') {
      energyTips.push("Ensure your home is properly insulated. Drafty doors and windows waste heating/cooling.");
      energyTips.push("Use a programmable thermostat to avoid heating or cooling an empty house.");
    } else {
      energyTips.push("Unplug 'vampire' appliances (TVs, chargers) when not in use.");
    }
    tips.push({ category: "Home Energy", icon: <Zap className="w-5 h-5 text-amber-500" />, tips: energyTips });

    // Shopping Tips
    const shoppingTips = [];
    if (quiz.shoppingHabits === 'frequent-buyer' || quiz.shoppingHabits === 'average') {
      shoppingTips.push("Try a 'Buy Nothing' month for non-essential items.");
      shoppingTips.push("When shopping online, choose standard shipping instead of expedited to reduce emissions.");
      shoppingTips.push("Bring reusable bags when shopping and try to avoid single-use plastics.");
    } else {
      shoppingTips.push("Your minimalist habits are excellent for the planet!");
      shoppingTips.push("When you do buy, try to support circular economy brands or buy second-hand.");
    }
    tips.push({ category: "Shopping", icon: <Package className="w-5 h-5 text-purple-500" />, tips: shoppingTips });

    return tips;
  };

  const categorizedTips = getTips();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>
      
      {/* Modal Content */}
      <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col transform transition-all">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-gray-900 dark:text-gray-100">Personalized Eco-Tips</h2>
              <p className="text-xs text-gray-500 dark:text-gray-500 dark:text-gray-400">Tailored to your lifestyle choices</p>
            </div>
          </div>
          <button 
            aria-label="Close Modal"
            onClick={onClose}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {!quiz && (
            <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400 p-4 rounded-2xl flex items-start gap-3 border border-amber-100 dark:border-amber-900/50 text-sm">
              <Lightbulb className="w-5 h-5 shrink-0" />
              <p>Complete your onboarding quiz to receive highly personalized eco-tips and lifestyle recommendations!</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categorizedTips.map((categoryData, idx) => (
              <div key={idx} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    {categoryData.icon}
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-gray-100">{categoryData.category}</h3>
                </div>
                <ul className="space-y-2.5">
                  {categoryData.tips.map((tip, tIdx) => (
                    <li key={tIdx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <span className="text-emerald-700 dark:text-emerald-400 font-black mt-0.5">•</span>
                      <span className="leading-snug">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-colors shadow-sm"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
};

export default EcoTipsModal;
