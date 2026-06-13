import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import PremiumSuite from './PremiumSuite';

describe('PremiumSuite', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders premium features correctly and switches tabs', () => {
    const state = { premiumOffsets: [], smartPlugsCount: 0, totalSmartSavesKg: 0 } as any;
    render(<PremiumSuite ecoState={state} onUpdateState={() => {}} onPostNotification={() => {}} triggerAIUpdate={() => {}} />);
    
    expect(screen.getByText(/Advanced Suite/i)).toBeDefined();
    
    const iotTab = screen.getByText(/Standby IoT Plugs/i);
    fireEvent.click(iotTab);
    expect(screen.getByText(/Vampire standby/i)).toBeDefined();
    
    const advisoryTab = screen.getByText(/Elite Carbon Budget/i);
    fireEvent.click(advisoryTab);
    expect(screen.getByText(/EcoTrace Advanced Program/i)).toBeDefined();
  });

  it('adds a smart plug', () => {
    const state = { premiumOffsets: [], smartPlugsCount: 0, totalSmartSavesKg: 0, ecoPoints: 10 } as any;
    const onUpdate = vi.fn();
    const onNotify = vi.fn();
    const triggerAI = vi.fn();

    render(<PremiumSuite ecoState={state} onUpdateState={onUpdate} onPostNotification={onNotify} triggerAIUpdate={triggerAI} />);
    
    const iotTab = screen.getByText(/Standby IoT Plugs/i);
    fireEvent.click(iotTab);

    const addPlugBtn = screen.getByText(/Add Standby Smart Plug/i);
    fireEvent.click(addPlugBtn);

    expect(screen.getByText(/Pinging Zigbee Hub/i)).toBeDefined();

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(onUpdate).toHaveBeenCalled();
    expect(onNotify).toHaveBeenCalledWith(expect.stringContaining('Synchronized'));
    expect(triggerAI).toHaveBeenCalled();
  });

  it('toggles offset subscriptions', () => {
    const state = { premiumOffsets: ['off-1'], smartPlugsCount: 0, totalSmartSavesKg: 0 } as any;
    const onUpdate = vi.fn();
    const onNotify = vi.fn();

    render(<PremiumSuite ecoState={state} onUpdateState={onUpdate} onPostNotification={onNotify} triggerAIUpdate={vi.fn()} />);

    // Pause offset
    const pauseBtns = screen.getAllByText(/Pause Offset/i);
    fireEvent.click(pauseBtns[0]);
    expect(onUpdate).toHaveBeenCalled();
    expect(onNotify).toHaveBeenCalledWith(expect.stringContaining('paused'));

    // Activate offset
    const activateBtns = screen.getAllByText(/Activate offset portfolio/i);
    fireEvent.click(activateBtns[0]);
    expect(onNotify).toHaveBeenCalledWith(expect.stringContaining('Activated'));
  });
});

