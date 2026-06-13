import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CommunityShop from './CommunityShop';
import { UserEcoState } from '../types';

const mockState: UserEcoState = {
  profile: null,
  habits: [],
  ecoPoints: 500,
  challenges: [
    {
      id: 'c1',
      title: 'Vegan Week',
      description: 'Eat vegan for a week.',
      targetCategory: 'food',
      targetValue: '7 days',
      pointsReward: 50,
      co2SavingsKg: 20,
      participantsCount: 100,
      joined: false,
      progress: 0
    },
    {
      id: 'c2',
      title: 'Bike to Work',
      description: 'Bike to work for 3 days.',
      targetCategory: 'travel',
      targetValue: '3 days',
      pointsReward: 30,
      co2SavingsKg: 10,
      participantsCount: 50,
      joined: true,
      progress: 50
    }
  ],
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

describe('CommunityShop', () => {
  it('renders shop correctly', () => {
    render(<CommunityShop ecoState={mockState} onUpdateState={vi.fn()} />);
    expect(screen.getByText('Challenges & Rewards Shop')).toBeDefined();
    expect(screen.getByText('Vegan Week')).toBeDefined();
  });

  it('switches tabs correctly', () => {
    render(<CommunityShop ecoState={mockState} onUpdateState={vi.fn()} />);
    const rewardsTabBtn = screen.getByText('Partner Discounts');
    fireEvent.click(rewardsTabBtn);
    expect(screen.getByText(/AeroGreen Footwear/i)).toBeDefined();
  });

  it('joins a challenge', () => {
    const onUpdate = vi.fn();
    render(<CommunityShop ecoState={mockState} onUpdateState={onUpdate} />);
    const joinBtn = screen.getByText('Join Challenge');
    fireEvent.click(joinBtn);
    
    expect(onUpdate).toHaveBeenCalled();
    const updatedCalls = onUpdate.mock.calls[0][0];
    expect(updatedCalls.challenges[0].joined).toBe(true);
    expect(updatedCalls.challenges[0].participantsCount).toBe(101);
  });

  it('claims a challenge reward', () => {
    const onUpdate = vi.fn();
    render(<CommunityShop ecoState={mockState} onUpdateState={onUpdate} />);
    const claimBtn = screen.getByText(/Complete quest/i);
    fireEvent.click(claimBtn);
    
    expect(onUpdate).toHaveBeenCalled();
    const updatedCalls = onUpdate.mock.calls[0][0];
    expect(updatedCalls.ecoPoints).toBe(530); // 500 + 30
    expect(updatedCalls.challenges[1].progress).toBe(100);
  });

  it('redeems a reward', () => {
    const onUpdate = vi.fn();
    render(<CommunityShop ecoState={mockState} onUpdateState={onUpdate} />);
    
    fireEvent.click(screen.getByText('Partner Discounts'));
    
    // Redeem a reward matching "Redeem for 120 Points", since AeroGreen Footwear costs 120
    const redeemBtn = screen.getByText('Redeem for 120 Points');
    fireEvent.click(redeemBtn);
    
    expect(onUpdate).toHaveBeenCalled();
    const updatedCalls = onUpdate.mock.calls[0][0];
    expect(updatedCalls.ecoPoints).toBe(380); // 500 - 120
    
    // Assert that unlocked code message appears
    expect(screen.getByText(/Unlocked! Use code:/i)).toBeDefined();
  });
});
