/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserEcoState, MockTransaction, MockUtilityBill, CommuteLog } from '../types';
import { Network, Zap, CreditCard, Compass, CheckCircle2, RotateCcw, AlertTriangle, CloudRain, ShieldCheck } from 'lucide-react';

interface IntegrationsPanelProps {
  ecoState: UserEcoState;
  onUpdateState: (updates: Partial<UserEcoState>) => void;
  triggerAIUpdate: (newState: UserEcoState) => void;
}

export default function IntegrationsPanel({ ecoState, onUpdateState, triggerAIUpdate }: IntegrationsPanelProps) {
  const [connectingUtility, setConnectingUtility] = useState(false);
  const [connectingBanking, setConnectingBanking] = useState(false);
  const [connectingFitness, setConnectingFitness] = useState(false);

  const simulateUtilityConnect = () => {
    setConnectingUtility(true);
    setTimeout(() => {
      const mockBills: MockUtilityBill[] = [
        {
          billingPeriod: 'May 2026',
          electricityKwh: 360,
          gasTherms: 18,
          unusualSpikeDetected: true,
          carbonImpactKg: 154.2
        },
        {
          billingPeriod: 'April 2026',
          electricityKwh: 310,
          gasTherms: 12,
          unusualSpikeDetected: false,
          carbonImpactKg: 122.5
        }
      ];

      const updatedState = {
        ...ecoState,
        utilityConnected: true,
        bills: mockBills,
        ecoPoints: ecoState.ecoPoints + 50 // bonus for connecting
      };

      onUpdateState({
        utilityConnected: true,
        bills: mockBills,
        ecoPoints: ecoState.ecoPoints + 50
      });
      setConnectingUtility(false);
      triggerAIUpdate(updatedState);
    }, 1500);
  };

  const simulateBankingConnect = () => {
    setConnectingBanking(true);
    setTimeout(() => {
      const mockTransactions: MockTransaction[] = [
        {
          id: 'tx-1',
          date: '2026-06-11',
          merchant: 'ExxonMobil Station',
          amount: 58.50,
          category: 'Fuel',
          carbonImpactKg: 68.4,
          impactLevel: 'high'
        },
        {
          id: 'tx-2',
          date: '2026-06-10',
          merchant: 'Zara Fast Fashion Store',
          amount: 112.00,
          category: 'Fast Fashion',
          carbonImpactKg: 42.0,
          impactLevel: 'high'
        },
        {
          id: 'tx-3',
          date: '2026-06-09',
          merchant: 'Whole Foods Market',
          amount: 72.40,
          category: 'Groceries',
          carbonImpactKg: 8.5,
          impactLevel: 'low'
        },
        {
          id: 'tx-4',
          date: '2026-06-08',
          merchant: 'Clawburger Foodtruck',
          amount: 24.00,
          category: 'Dining Out',
          carbonImpactKg: 18.2,
          impactLevel: 'moderate'
        },
        {
          id: 'tx-5',
          date: '2026-06-05',
          merchant: 'SolarOffset Partner Brand',
          amount: 20.00,
          category: 'Sustainable shop',
          carbonImpactKg: -50.0,
          impactLevel: 'low'
        }
      ];

      const updatedState = {
        ...ecoState,
        bankingConnected: true,
        transactions: mockTransactions,
        ecoPoints: ecoState.ecoPoints + 50
      };

      onUpdateState({
        bankingConnected: true,
        transactions: mockTransactions,
        ecoPoints: ecoState.ecoPoints + 50
      });
      setConnectingBanking(false);
      triggerAIUpdate(updatedState);
    }, 1500);
  };

  const simulateFitnessConnect = () => {
    setConnectingFitness(true);
    setTimeout(() => {
      const mockCommutes: CommuteLog[] = [
        {
          id: 'log-1',
          date: '2026-06-12',
          distanceMiles: 4.2,
          mode: 'walking',
          carbonImpactKg: 0
        },
        {
          id: 'log-2',
          date: '2026-06-11',
          distanceMiles: 14.5,
          mode: 'driving',
          carbonImpactKg: 5.8
        },
        {
          id: 'log-3',
          date: '2026-06-10',
          distanceMiles: 11.2,
          mode: 'public-transit',
          carbonImpactKg: 1.5
        },
        {
          id: 'log-4',
          date: '2026-06-09',
          distanceMiles: 6.0,
          mode: 'cycling',
          carbonImpactKg: 0
        }
      ];

      const updatedState = {
        ...ecoState,
        fitnessConnected: true,
        commutes: mockCommutes,
        ecoPoints: ecoState.ecoPoints + 50
      };

      onUpdateState({
        fitnessConnected: true,
        commutes: mockCommutes,
        ecoPoints: ecoState.ecoPoints + 50
      });
      setConnectingFitness(false);
      triggerAIUpdate(updatedState);
    }, 1500);
  };

  const resetAllConnections = () => {
    const clearedState = {
      ...ecoState,
      utilityConnected: false,
      bankingConnected: false,
      fitnessConnected: false,
      bills: [],
      transactions: [],
      commutes: []
    };
    onUpdateState({
      utilityConnected: false,
      bankingConnected: false,
      fitnessConnected: false,
      bills: [],
      transactions: [],
      commutes: []
    });
    triggerAIUpdate(clearedState);
  };

  return (
    <div id="integrations-panel-wrapper" className="space-y-6">
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-md font-bold text-gray-900 leading-none">Smart Integrations</h3>
              <p className="text-xs text-gray-400 mt-0.5">Connect external feeds for zero-friction auto-tracking</p>
            </div>
          </div>
          {(ecoState.utilityConnected || ecoState.bankingConnected || ecoState.fitnessConnected) && (
            <button
              id="reset-integrations-btn"
              onClick={resetAllConnections}
              className="flex items-center gap-1.5 text-xs text-rose-600 font-semibold hover:bg-rose-50 px-2.5 py-1.5 rounded-full transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Feeds
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* UTILITY BILL LINK */}
          <div className={`p-5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
            ecoState.utilityConnected ? 'bg-emerald-50/20 border-emerald-500/70' : 'bg-gray-50/50 border-gray-100'
          }`}>
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div className={`p-2 rounded-xl ${ecoState.utilityConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                  <Zap className="w-5 h-5" />
                </div>
                {ecoState.utilityConnected ? (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> CONNECTED
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">OFFLINE</span>
                )}
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-800">Utility Provider API</h4>
                <p className="text-xs text-gray-400 leading-normal mt-1">
                  Imports heating, electric and natural gas bill therm consumption values.
                </p>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-gray-100/50">
              {ecoState.utilityConnected ? (
                <div className="text-xs text-gray-500 font-mono">
                  Ingested: <span className="font-semibold text-emerald-600">{ecoState.bills.length} bills</span>
                </div>
              ) : (
                <button
                  id="connect-utility-btn"
                  onClick={simulateUtilityConnect}
                  disabled={connectingUtility}
                  className="w-full text-xs font-semibold py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:bg-gray-300 transition-colors cursor-pointer text-center flex justify-center"
                >
                  {connectingUtility ? 'Pulling metrics...' : 'Connect EcoWatts Provider'}
                </button>
              )}
            </div>
          </div>

          {/* OPEN BANKING LINK */}
          <div className={`p-5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
            ecoState.bankingConnected ? 'bg-emerald-50/20 border-emerald-500/70' : 'bg-gray-50/50 border-gray-100'
          }`}>
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div className={`p-2 rounded-xl ${ecoState.bankingConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                  <CreditCard className="w-5 h-5" />
                </div>
                {ecoState.bankingConnected ? (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> CONNECTED
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">OFFLINE</span>
                )}
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-800">Secure Open Banking</h4>
                <p className="text-xs text-gray-400 leading-normal mt-1">
                  Scouts and tags scope 3 carbon estimates across fuel vs clothing retail merchant transactions.
                </p>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-gray-100/50">
              {ecoState.bankingConnected ? (
                <div className="text-xs text-gray-500 font-mono">
                  Ingested: <span className="font-semibold text-emerald-600">{ecoState.transactions.length} buys</span>
                </div>
              ) : (
                <button
                  id="connect-banking-btn"
                  onClick={simulateBankingConnect}
                  disabled={connectingBanking}
                  className="w-full text-xs font-semibold py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:bg-gray-300 transition-colors cursor-pointer text-center flex justify-center"
                >
                  {connectingBanking ? 'Analyzing ledger...' : 'Connect GreenCard Bank'}
                </button>
              )}
            </div>
          </div>

          {/* SMARTPHONE GPS LOG LINK */}
          <div className={`p-5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
            ecoState.fitnessConnected ? 'bg-emerald-50/20 border-emerald-500/70' : 'bg-gray-50/50 border-gray-100'
          }`}>
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div className={`p-2 rounded-xl ${ecoState.fitnessConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                  <Compass className="w-5 h-5" />
                </div>
                {ecoState.fitnessConnected ? (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> CONNECTED
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">OFFLINE</span>
                )}
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-800">GPS Commute Logger</h4>
                <p className="text-xs text-gray-400 leading-normal mt-1">
                  Integrates with Fitbit, Apple, or Strava to auto-calculate walking vs driving emissions.
                </p>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-gray-100/50">
              {ecoState.fitnessConnected ? (
                <div className="text-xs text-gray-500 font-mono">
                  Ingested: <span className="font-semibold text-emerald-600">{ecoState.commutes.length} transit logs</span>
                </div>
              ) : (
                <button
                  id="connect-fitness-btn"
                  onClick={simulateFitnessConnect}
                  disabled={connectingFitness}
                  className="w-full text-xs font-semibold py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:bg-gray-300 transition-colors cursor-pointer text-center flex justify-center"
                >
                  {connectingFitness ? 'Retrieving GPS logs...' : 'Connect GPS Fit Tracker'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Ingested Feeds Detail Drawer lists for High Fidelity Experience */}
      {(ecoState.utilityConnected || ecoState.bankingConnected || ecoState.fitnessConnected) && (
        <div id="ingested-data-ledger-card" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left panel: Card transaction ledger */}
          {ecoState.bankingConnected && ecoState.transactions.length > 0 && (
            <div id="banking-ledger-card" className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-gray-900">Ingested Card Ledger</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-550 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                      <th className="pb-2">Merchant</th>
                      <th className="pb-2">Category</th>
                      <th className="pb-2">Amt</th>
                      <th className="pb-2 text-right">CO₂ Impact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-550 text-xs">
                    {ecoState.transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-gray-50/50">
                        <td className="py-2.5 font-medium text-gray-800">{tx.merchant}</td>
                        <td className="py-2.5 text-gray-500">{tx.category}</td>
                        <td className="py-2.5 text-gray-500">${tx.amount.toFixed(2)}</td>
                        <td className="py-2.5 text-right font-mono font-medium">
                          <span className={`px-2 py-0.5 rounded-full ${
                            tx.carbonImpactKg < 0 ? 'bg-emerald-50 text-emerald-600' :
                            tx.carbonImpactKg > 35 ? 'bg-rose-50 text-rose-600' : 'bg-yellow-50 text-yellow-600'
                          }`}>
                            {tx.carbonImpactKg > 0 ? `+${tx.carbonImpactKg}` : tx.carbonImpactKg} kg
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Right panel: Commutes and Utility spike alarms */}
          <div className="space-y-4">
            {ecoState.fitnessConnected && ecoState.commutes.length > 0 && (
              <div id="fitness-ledger-card" className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-3">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-emerald-600" /> Ingested Commutes Tracker (Fitbit)
                </h3>
                <div className="space-y-2 max-h-[160px] overflow-y-auto">
                  {ecoState.commutes.map((log) => (
                    <div key={log.id} className="flex justify-between items-center text-xs py-2 border-b border-gray-550">
                      <div>
                        <span className="capitalize font-semibold text-gray-800">{log.mode}</span>
                        <span className="text-gray-400 font-mono ml-2">({log.distanceMiles} miles)</span>
                      </div>
                      <span className={`font-mono font-semibold ${log.carbonImpactKg === 0 ? 'text-emerald-600' : 'text-gray-600'}`}>
                        {log.carbonImpactKg === 0 ? '0.0 kg (Eco-Safe)' : `+${log.carbonImpactKg} kg CO₂`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {ecoState.utilityConnected && ecoState.bills.length > 0 && (
              <div id="utility-ledger-card" className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-3">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-600" /> Utility Bill Ledger
                </h3>
                {ecoState.bills.map((bill, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50/50 rounded-xl border border-gray-100">
                    <div className="text-xs">
                      <div className="font-bold text-gray-800">{bill.billingPeriod} Statement</div>
                      <div className="text-gray-400 font-mono mt-0.5">{bill.electricityKwh} kWh electric · {bill.gasTherms} therms gas</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-gray-705">+{bill.carbonImpactKg} kg CO₂</div>
                      {bill.unusualSpikeDetected && (
                        <div className="text-[9px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5 mt-1">
                          <AlertTriangle className="w-2.5 h-2.5" /> +12% Spike Alert!
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
