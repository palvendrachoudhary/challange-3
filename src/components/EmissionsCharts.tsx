/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CarbonProfile } from '../types';
import { Target, TrendingDown, TrendingUp, Sparkles, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface EmissionsChartsProps {
  profile: CarbonProfile;
  currentActualScore: number;
}

export default function EmissionsCharts({ profile, currentActualScore }: EmissionsChartsProps) {
  // Safe math bounds
  const baseline = profile.baselineScore;
  const target = profile.targetScore;
  const current = currentActualScore;

  // Percentage calculations
  const reductionTargetPercent = Math.round(((baseline - target) / baseline) * 100);
  const actualSavedTons = Math.max(0, baseline - current);
  const savedPercent = Math.round((actualSavedTons / baseline) * 100);
  
  // Angle for circle progress meter (radius 50)
  // circumference is 2 * pi * r = 314.15
  const circumference = 314.15;
  const maxLimit = Math.max(baseline, current) || 10;
  const fillRatio = Math.min(1, current / maxLimit);
  const strokeDashoffset = circumference * (1 - fillRatio);

  const status = current <= target ? 'Excellent' : current <= baseline ? 'On Track' : 'Needs Action';
  const statusColor = current <= target ? 'text-teal-600 bg-teal-50' : current <= baseline ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50';

  // Category values
  const categories = [
    { label: 'Home Energy', key: 'home', value: profile.baselineBreakdown.home, color: 'bg-indigo-500 text-indigo-700', bg: 'bg-indigo-50' },
    { label: 'Travel & Flying', key: 'travel', value: profile.baselineBreakdown.travel, color: 'bg-purple-500 text-purple-700', bg: 'bg-purple-50' },
    { label: 'Food Intake', key: 'food', value: profile.baselineBreakdown.food, color: 'bg-emerald-500 text-emerald-700', bg: 'bg-emerald-50' },
    { label: 'Shopping Goods', key: 'shopping', value: profile.baselineBreakdown.shopping, color: 'bg-blue-500 text-blue-700', bg: 'bg-blue-50' },
  ];

  // Max for relative scaling
  const maxCatVal = Math.max(...categories.map(c => c.value)) || 1;

  // Mock weekly trend data leading up to current
  const trendData = [
    { name: 'Week 1', score: baseline },
    { name: 'Week 2', score: baseline - (baseline - current) * 0.25 },
    { name: 'Week 3', score: baseline - (baseline - current) * 0.55 },
    { name: 'Week 4', score: baseline - (baseline - current) * 0.8 },
    { name: 'Current', score: current },
  ];

  return (
    <div id="emissions-graphs-section" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Main Carbon Score Wheel */}
      <div id="carbon-score-card" className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-6">
        <div>
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Carbon Score Dashboard</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Tracking annual trajectory estimate (Metric Tons CO₂ / year)</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
          {/* Wheel */}
          <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
            {/* SVG Progress Arc */}
            <svg className="w-full h-full transform -rotate-95" viewBox="0 0 120 120">
              {/* Outer Background Tracker */}
              <circle
                cx="60"
                cy="60"
                r="50"
                className="fill-none stroke-gray-100"
                strokeWidth="8"
              />
              {/* Dynamic Progress Indicator */}
              <circle
                cx="60"
                cy="60"
                r="50"
                className="fill-none stroke-emerald-500 transition-all duration-1000 ease-out"
                strokeWidth="10"
                strokeDasharray={`${circumference}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
              {/* Goal Target Tick Pin Indicator */}
              {baseline > 0 && (
                <circle
                  cx={60 + 50 * Math.cos((2 * Math.PI * (target / maxLimit)) - Math.PI/2)}
                  cy={60 + 50 * Math.sin((2 * Math.PI * (target / maxLimit)) - Math.PI/2)}
                  r="4"
                  className="fill-rose-500 stroke-white stroke-2"
                />
              )}
            </svg>
            <div className="absolute text-center">
              <span className="text-3xl font-extrabold text-gray-900 tracking-tight">{current.toFixed(1)}</span>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mt-0.5">Tons / Year</p>
              <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full mt-2 uppercase tracking-wide ${statusColor}`}>
                {status}
              </span>
            </div>
          </div>

          {/* Core Analytics Cards */}
          <div className="space-y-4 w-full">
            <div className="flex items-center justify-between p-3 bg-gray-50/50 rounded-2xl border border-gray-100 text-xs">
              <div className="flex items-center gap-2">
                <div className="p-1 px-2 bg-emerald-500 text-white rounded-lg font-mono font-bold leading-none">A</div>
                <div>
                  <div className="text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider text-[9px]">Starting Baseline</div>
                  <div className="font-bold text-gray-800">{baseline.toFixed(1)} Tons</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50/50 rounded-2xl border border-gray-100 text-xs">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-rose-500 text-white rounded-lg leading-none"><Target className="w-3.5 h-3.5" /></div>
                <div>
                  <div className="text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider text-[9px]">Carbon Target Limit</div>
                  <div className="font-bold text-gray-800">{target.toFixed(1)} Tons</div>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">-{reductionTargetPercent}%</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-emerald-65/50 rounded-2xl border border-emerald-100 leading-tight">
              <div className="flex items-center gap-2 text-xs">
                <TrendingDown className="w-4 h-4 text-emerald-600" />
                <div>
                  <div className="text-emerald-800 font-bold">Carbon Footprint Saved</div>
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5">Reducing climate change contribution</div>
                </div>
              </div>
              <div className="text-right text-xs">
                <div className="font-extrabold text-emerald-700">-{actualSavedTons.toFixed(1)} Tons</div>
                <div className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400">{savedPercent}% avoid rate</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Emissions breakdown cards */}
      <div id="emissions-categories-card" className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between" role="region" aria-label="Category Breakdown">
        <div>
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Detailed Category Breakdown</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Baseline proportions vs relative intensity sectors</p>
        </div>

        <div className="space-y-4 pt-4">
          {categories.map((cat) => {
            const pctOfMax = maxCatVal > 0 ? (cat.value / maxCatVal) * 100 : 0;
            const pctOfTotal = baseline > 0 ? Math.round((cat.value / baseline) * 100) : 0;

            return (
              <div key={cat.key} className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-gray-700">{cat.label}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-gray-800">{cat.value.toFixed(1)} Tons/yr</span>
                    <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 font-mono">({pctOfTotal}%)</span>
                  </div>
                </div>

                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${cat.color.split(' ')[0]} transition-all duration-1000 ease-out`}
                    style={{ width: `${pctOfMax}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2.5 bg-gray-50 p-4 rounded-2xl border border-gray-100 text-xs mt-6">
          <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
          <p className="text-gray-500 leading-normal">
            Your highest emission node is **{categories.reduce((p, c) => p.value > c.value ? p : c).label}**. Smart automations can highlight habits to shrink this category first.
          </p>
        </div>
      </div>

      {/* 3. Weekly Trend Line Chart */}
      <div id="weekly-trend-chart-card" className="col-span-1 lg:col-span-2 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
        <div className="mb-6">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-700 dark:text-emerald-400" /> Weekly Carbon Savings Trend
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Historical progress of your carbon footprint (Metric Tons CO₂ / year)</p>
        </div>
        
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
            <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 'bold' }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 'bold' }}
                domain={['auto', 'auto']}
                dx={-10}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: '1px solid #f3f4f6', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                formatter={(value: number) => [`${value.toFixed(1)} Tons`, 'Score']}
              />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#10b981" 
                strokeWidth={3} 
                dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#10b981' }} 
                activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
