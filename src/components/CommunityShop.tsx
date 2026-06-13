/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserEcoState, Challenge } from '../types';
import { Flame, Medal, Award, Tag, Sparkles, Check, Users, ShoppingBag } from 'lucide-react';

interface CommunityShopProps {
  ecoState: UserEcoState;
  onUpdateState: (updates: Partial<UserEcoState>) => void;
}

const PARTNER_REWARDS = [
  {
    id: 'rew-1',
    brand: 'AeroGreen Footwear',
    item: '20% Off Recycled Knit Shoes',
    cost: 120,
    desc: 'Made from 100% ocean-harvested post-consumer bottles.',
    code: 'AEROGREEN20'
  },
  {
    id: 'rew-2',
    brand: 'CleanGrid Energy',
    item: 'Offset 500kg of CO₂ Footprint',
    cost: 200,
    desc: 'Sponsor wind farm turbines in low income grids.',
    code: 'OFFWIND500'
  },
  {
    id: 'rew-3',
    brand: 'EcoMug Sustainable Co',
    item: 'Free Glass Reusable Bottle',
    cost: 150,
    desc: 'Eliminates up to 300 single-use thermo plastic cups per year.',
    code: 'MUGFREEOCEAN'
  },
  {
    id: 'rew-4',
    brand: 'GreenPass Transit',
    item: '$10 Train Commute Transit Pass',
    cost: 250,
    desc: 'Valid for public buses and metropolitan subways globally.',
    code: 'SUBPASS10'
  }
];

export default function CommunityShop({ ecoState, onUpdateState }: CommunityShopProps) {
  const [unlockedCodes, setUnlockedCodes] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'challenges' | 'rewards'>('challenges');

  const handleJoinChallenge = (id: string) => {
    const updated = ecoState.challenges.map(ch => {
      if (ch.id === id) {
        const isJoining = !ch.joined;
        return {
          ...ch,
          joined: isJoining,
          participantsCount: isJoining ? ch.participantsCount + 1 : ch.participantsCount - 1,
          progress: isJoining ? 20 : 0
        };
      }
      return ch;
    });

    onUpdateState({ challenges: updated });
  };

  const handleClaimChallengeReward = (ch: Challenge) => {
    // Complete 100% progress and award points + CO2 savings
    const updated = ecoState.challenges.map(item => {
      if (item.id === ch.id) {
        return { ...item, progress: 100 };
      }
      return item;
    });

    const newPoints = ecoState.ecoPoints + ch.pointsReward;
    
    // Attempt to reduce profile actual carbon if profile exists
    let updatedProfile = ecoState.profile ? { ...ecoState.profile } : null;
    if (updatedProfile) {
      // Reduce baseline actual score (saving 100kg = 0.1 tons)
      const co2SavingsTons = ch.co2SavingsKg / 1000;
      updatedProfile.baselineScore = Math.max(1.0, updatedProfile.baselineScore - co2SavingsTons);
    }

    onUpdateState({
      challenges: updated,
      ecoPoints: newPoints,
      profile: updatedProfile
    });
  };

  const handleRedeemReward = (id: string, cost: number, code: string) => {
    if (ecoState.ecoPoints < cost) return;

    onUpdateState({
      ecoPoints: ecoState.ecoPoints - cost
    });

    setUnlockedCodes(prev => ({
      ...prev,
      [id]: code
    }));
  };

  return (
    <div id="gamification-panel-container" className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
      {/* Header with quick indicators */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-550 pb-5 gap-4 mb-6">
        <div>
          <h3 className="text-md font-bold text-gray-900 leading-none">Challenges & Rewards Shop</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Practice behavior stacking with our sustainable partner brands</p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-gray-50 border border-gray-100 p-1 rounded-full text-xs">
          <button
            id="challenges-tab-button"
            onClick={() => setActiveTab('challenges')}
            className={`px-4 py-1.5 rounded-full font-semibold transition-all cursor-pointer ${
              activeTab === 'challenges' ? 'bg-white shadow-sm text-emerald-700' : 'text-gray-530'
            }`}
          >
            Live Challenges
          </button>
          <button
            id="rewards-tab-button"
            onClick={() => setActiveTab('rewards')}
            className={`px-4 py-1.5 rounded-full font-semibold transition-all cursor-pointer ${
              activeTab === 'rewards' ? 'bg-white shadow-sm text-emerald-700' : 'text-gray-530'
            }`}
          >
            Partner Discounts
          </button>
        </div>
      </div>

      {activeTab === 'challenges' ? (
        <div id="challenges-section" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ecoState.challenges.map((ch) => (
              <div
                id={`challenge-card-${ch.id}`}
                key={ch.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                  ch.progress === 100 ? 'bg-gray-50/50 border-gray-150' :
                  ch.joined ? 'bg-emerald-50/10 border-emerald-500/50 shadow-sm' : 'bg-white border-gray-100/80 hover:border-gray-200'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {ch.targetCategory} · +{ch.pointsReward} Points
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-mono flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> {ch.participantsCount.toLocaleString()} active
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-800 leading-tight">{ch.title}</h4>
                    <p className="text-xs text-gray-550 leading-relaxed mt-1">{ch.description}</p>
                  </div>
                </div>

                {/* Progress bar if joined */}
                {ch.joined && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-gray-500 dark:text-gray-400 font-semibold font-mono">My Quest Progress: {ch.progress}%</span>
                      <span className="text-emerald-700 font-semibold font-mono">Reward: -{ch.co2SavingsKg}kg CO₂</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                        style={{ width: `${ch.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-gray-550/60 flex gap-2">
                  <button
                    id={`join-challenge-btn-${ch.id}`}
                    onClick={() => handleJoinChallenge(ch.id)}
                    disabled={ch.progress === 100}
                    className={`w-full py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                      ch.progress === 100 ? 'bg-gray-100 text-gray-500 dark:text-gray-400 cursor-default' :
                      ch.joined ? 'bg-emerald-50 border border-emerald-100 text-emerald-700 hover:bg-emerald-100/50' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {ch.progress === 100 ? 'Quest Mastered' : ch.joined ? 'Active (Leave)' : 'Join Challenge'}
                  </button>

                  {ch.joined && ch.progress < 100 && (
                    <button
                      id={`claim-challenge-btn-${ch.id}`}
                      onClick={() => handleClaimChallengeReward(ch)}
                      className="w-full py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                      Complete quest <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div id="rewards-section" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PARTNER_REWARDS.map((rew) => {
              const claimed = !!unlockedCodes[rew.id];
              const tooExpensive = ecoState.ecoPoints < rew.cost;

              return (
                <div
                  id={`reward-card-${rew.id}`}
                  key={rew.id}
                  className={`p-4 border rounded-2xl transition-all flex flex-col justify-between ${
                    claimed ? 'bg-emerald-50/5 border-emerald-500/20' : 'bg-white border-gray-100'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="text-xs font-mono font-bold text-gray-500 dark:text-gray-400 uppercase">{rew.brand}</div>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-mono">
                        <Award className="w-3.5 h-3.5" /> {rew.cost} Pts
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-gray-800 leading-tight">{rew.item}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-normal">{rew.desc}</p>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-gray-550 flex items-center justify-between gap-3">
                    {claimed ? (
                      <div className="w-full flex items-center justify-between bg-emerald-50 p-2 rounded-xl text-xs font-bold text-emerald-800">
                        <span>Unlocked! Use code:</span>
                        <span className="font-mono bg-white px-2 py-1 rounded border border-emerald-100 select-all tracking-wider text-emerald-750">{unlockedCodes[rew.id]}</span>
                      </div>
                    ) : (
                      <button
                        id={`redeem-reward-${rew.id}`}
                        onClick={() => handleRedeemReward(rew.id, rew.cost, rew.code)}
                        disabled={tooExpensive}
                        className={`w-full py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          tooExpensive ? 'bg-gray-150 text-gray-500 dark:text-gray-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                        }`}
                      >
                        <Tag className="w-4 h-4" /> Redeem for {rew.cost} Points
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
