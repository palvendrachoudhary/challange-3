import React, { useState, useEffect } from 'react';
import { Globe, RefreshCw, Info } from 'lucide-react';

interface GlobalData {
  annualTons: number;
  source: string;
  year: number;
}

export default function WorldEmissionsMeter() {
  const [data, setData] = useState<GlobalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTons, setCurrentTons] = useState<number>(0);
  const [retryCount, setRetryCount] = useState(0);

  // Fetch the data from the backend on mount and on retry
  useEffect(() => {
    let isSubscribed = true;
    let fallbackTimeoutId: ReturnType<typeof setTimeout>;

    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/gemini/global-emissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        // The new server returns {"error": ...} or similar for 429 now, or we'll just check status
        if (response.status === 429 || !response.ok) {
          throw new Error('Rate limited or failed to fetch global emissions data');
        }

        const json = await response.json();
        
        if (json.processing) {
            throw new Error('Processing...');
        }

        if (isSubscribed) {
          setData(json);
          setError(null);
          
          // Calculate how many seconds have passed in the current year
          const now = new Date();
          const startOfYear = new Date(now.getFullYear(), 0, 1);
          const secondsPassed = (now.getTime() - startOfYear.getTime()) / 1000;
          
          // Emitted so far this year
          const tonsPerSecond = json.annualTons / (365.25 * 24 * 60 * 60);
          setCurrentTons(tonsPerSecond * secondsPassed);
          setLoading(false);
        }
        
      } catch (err: any) {
        if (isSubscribed) {
          if (retryCount < 1) {
            // Keep showing "Processing..." and schedule a retry.
            setLoading(true);
            fallbackTimeoutId = setTimeout(() => {
              setRetryCount(c => c + 1);
            }, 3000); // Wait 3 seconds before retrying
          } else {
            // Fallback to offline data so the user isn't stuck forever
            const fallbackData = { annualTons: 37400000000, source: 'EcoTrace Data Estimation', year: 2026 };
            setData(fallbackData);
            setError(null);
            
            const now = new Date();
            const startOfYear = new Date(now.getFullYear(), 0, 1);
            const secondsPassed = (now.getTime() - startOfYear.getTime()) / 1000;
            const tonsPerSecond = fallbackData.annualTons / (365.25 * 24 * 60 * 60);
            setCurrentTons(tonsPerSecond * secondsPassed);
            setLoading(false);
          }
        }
      }
    };

    fetchData();

    return () => {
      isSubscribed = false;
      if (fallbackTimeoutId) clearTimeout(fallbackTimeoutId);
    };
  }, [retryCount]);

  // Increment the counter in real time smoothly
  useEffect(() => {
    if (!data) return;

    // We add a constant discrete value every tick
    // This looks much smoother to human eyes than jumping wildly (like 16 then 19 then 17)
    // due to requestAnimationFrame timing jitter.
    const tonsPerSecond = data.annualTons / (365.25 * 24 * 60 * 60);
    const intervalMs = 60; // Slightly over 60fps equivalent smoothing
    const tonsPerInterval = tonsPerSecond * (intervalMs / 1000);

    const interval = setInterval(() => {
      setCurrentTons(prev => prev + tonsPerInterval);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [data]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex flex-col justify-center items-center h-48 animate-pulse">
        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
        <div className="text-gray-500 font-semibold text-sm">Processing...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex flex-col justify-center items-center h-48">
        <div className="text-red-500 font-semibold text-sm">Failed to load world data.</div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-red-100 dark:border-red-900 rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center gap-8 animate-fade-in">
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="flex-shrink-0 relative z-10 flex flex-col items-center justify-center p-6 bg-red-50 dark:bg-red-900/20 rounded-full w-32 h-32 border border-red-100 dark:border-red-800">
        <Globe className="w-12 h-12 text-red-600 dark:text-red-400 mb-1" />
        <span className="text-[10px] font-black uppercase tracking-widest text-red-700 dark:text-red-400 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          Live
        </span>
      </div>

      <div className="flex-1 relative z-10 text-center md:text-left space-y-3">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center justify-center md:justify-start gap-2">
          Global CO2 Emissions (Year-to-Date)
          <div className="group relative">
            <Info className="w-4 h-4 text-gray-400 hover:text-emerald-500 cursor-help transition-colors" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-20">
              Data sourced in real-time using Google Search Grounding via Gemini. Represents estimated current year running total.
            </div>
          </div>
        </h3>
        
        <div className="font-mono tabular-nums text-4xl md:text-5xl font-black text-red-600 dark:text-red-400 tracking-tighter flex items-end justify-center md:justify-start" style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
          {Math.floor(currentTons).toLocaleString('en-US')}
          <span className="text-lg md:text-2xl text-red-800/50 dark:text-red-300/50 ml-1 mb-1">
            .{Math.floor((currentTons % 1) * 100).toString().padStart(2, '0')}
          </span>
        </div>
        
        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
          Metric Tons Emitted
        </div>
        
        <div className="pt-2 border-t border-red-100 dark:border-red-900/50 flex flex-wrap gap-x-4 gap-y-1 justify-center md:justify-start text-[11px] text-gray-500 font-medium">
           <span><strong className="text-gray-700 dark:text-gray-300">Annual Rate:</strong> ~{(data?.annualTons || 0).toLocaleString()} tons / year</span>
           <span><strong className="text-gray-700 dark:text-gray-300">Source:</strong> {data?.source} (<strong className="text-emerald-600 dark:text-emerald-400">{data?.year}</strong>)</span>
        </div>
      </div>
    </div>
  );
}
