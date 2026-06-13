import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import IntegrationsPanel from './IntegrationsPanel';
import { UserEcoState } from '../types';

const mockState: UserEcoState = {
  profile: null,
  habits: [],
  ecoPoints: 0,
  challenges: [],
  loggedActionsCount: 0,
  streakCount: 0,
  lastActiveDate: null,
  utilityConnected: false,
  bankingConnected: false,
  fitnessConnected: false,
  manualLogs: { foodEmissionsKg: 0, wasteKg: 0 },
  transactions: [],
  bills: [],
  commutes: [],
  aiInsights: null,
  aiInsightsLoading: false
};

describe('IntegrationsPanel', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders initial state correctly', () => {
    render(<IntegrationsPanel ecoState={mockState} onUpdateState={vi.fn()} triggerAIUpdate={vi.fn()} />);
    expect(screen.getByText('Smart Integrations')).toBeDefined();
    expect(screen.getByText('Connect EcoWatts Provider')).toBeDefined();
  });

  it('connects utility on button click', async () => {
    const onUpdate = vi.fn();
    const triggerAI = vi.fn();
    render(<IntegrationsPanel ecoState={mockState} onUpdateState={onUpdate} triggerAIUpdate={triggerAI} />);
    
    fireEvent.click(screen.getByText('Connect EcoWatts Provider'));
    expect(screen.getByText('Pulling metrics...')).toBeDefined();
    
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({
      utilityConnected: true,
      ecoPoints: 50
    }));
    expect(triggerAI).toHaveBeenCalled();
  });

  it('displays bills when utility is connected', () => {
    const stateWithUtility = { ...mockState, utilityConnected: true, bills: [{
      billingPeriod: 'May 2026',
      electricityKwh: 360,
      gasTherms: 18,
      unusualSpikeDetected: true,
      carbonImpactKg: 154.2
    }] };
    render(<IntegrationsPanel ecoState={stateWithUtility} onUpdateState={vi.fn()} triggerAIUpdate={vi.fn()} />);
    
    expect(screen.getByText('May 2026 Statement')).toBeDefined();
    expect(screen.getByText(/\+12% Spike Alert!/i)).toBeDefined();
  });
  
  it('resets all connections', () => {
    const stateConnected = { ...mockState, utilityConnected: true, bankingConnected: true, fitnessConnected: true };
    const onUpdate = vi.fn();
    const triggerAI = vi.fn();
    
    render(<IntegrationsPanel ecoState={stateConnected} onUpdateState={onUpdate} triggerAIUpdate={triggerAI} />);
    
    const resetBtn = screen.getByText('Reset Feeds');
    fireEvent.click(resetBtn);
    
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({
      utilityConnected: false,
      bankingConnected: false,
      fitnessConnected: false
    }));
  });
});
