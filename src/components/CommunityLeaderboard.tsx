import React, { useState, useEffect } from 'react';
import { Trophy, Globe, Award } from 'lucide-react';

const MOCK_ACHIEVEMENTS = [
  { id: 1, user: "EcoWarrior_89", action: "Installed Solar Panels", points: 500, time: "2m ago", country: "🇧🇷" },
  { id: 2, user: "GreenLiving_US", action: "100-Day Walking Streak", points: 150, time: "15m ago", country: "🇺🇸" },
  { id: 3, user: "EarthHero_FR", action: "Swapped to EV", points: 1200, time: "1h ago", country: "🇫🇷" },
  { id: 4, user: "OceanSaver_AU", action: "Zero Waste Weekly Goal", points: 300, time: "3h ago", country: "🇦🇺" },
  { id: 5, user: "ForestGuardian_CA", action: "Planted 50 Trees", points: 450, time: "5h ago", country: "🇨🇦" },
  { id: 6, user: "WindPower_DE", action: "Switched to 100% Green Energy", points: 800, time: "12h ago", country: "🇩🇪" },
  { id: 7, user: "BikeCommuter_NL", action: "1,000 km Cycled", points: 600, time: "1d ago", country: "🇳🇱" },
  { id: 8, user: "VeganChef_IT", action: "1 Year Plant-Based", points: 1000, time: "2d ago", country: "🇮🇹" },
  { id: 9, user: "NatureLover_JP", action: "Beach Cleanup Completed", points: 200, time: "6h ago", country: "🇯🇵" },
  { id: 10, user: "CleanEnergy_UK", action: "Upgraded Home Insulation", points: 700, time: "5m ago", country: "🇬🇧" },
];

export const CommunityLeaderboard: React.FC = () => {
  const [achievements, setAchievements] = useState(MOCK_ACHIEVEMENTS.slice(0, 4));

  useEffect(() => {
    const interval = setInterval(() => {
      setAchievements((prev) => {
        const remaining = MOCK_ACHIEVEMENTS.filter(a => !prev.find(p => p.id === a.id));
        if (remaining.length === 0) return prev;
        
        const randomNew = remaining[Math.floor(Math.random() * remaining.length)];
        return [randomNew, ...prev.slice(0, 3)];
      });
    }, 4500); // Rotate every 4.5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-white/40 dark:border-gray-700 rounded-3xl p-6 shadow-lg space-y-6">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wide flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-700 dark:text-emerald-400" /> Global Eco-Leaderboard
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-500 dark:text-gray-400">Live feed of climate actions from our worldwide community</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/50 p-2 rounded-xl border border-emerald-100 dark:border-emerald-800 shrink-0 self-start">
          <Trophy className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
      </div>

      <div className="space-y-3 relative">
        {achievements.map((ach) => (
          <div 
            key={ach.id} 
            className="flex items-center justify-between p-4 bg-gray-50/80 dark:bg-gray-700/50 rounded-2xl border border-gray-100 dark:border-gray-600 transition-all duration-500 ease-in-out hover:bg-gray-100 dark:hover:bg-gray-600/50"
          >
            <div className="flex items-center gap-4">
              <div className="text-2xl" title={ach.country}>{ach.country}</div>
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-gray-100">{ach.user}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-500 dark:text-gray-400">{ach.action} &bull; {ach.time}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 px-2.5 py-1.5 rounded-lg shadow-sm text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
              <Award className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
              +{ach.points}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommunityLeaderboard;
