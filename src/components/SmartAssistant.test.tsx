import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import SmartAssistant from './SmartAssistant';
import { UserEcoState } from '../types';

const mockState: UserEcoState = {
  profile: {
    name: "Mock User",
    personalizedWelcome: "Welcome",
    initialHabits: [],
    baselineScore: 5000,
    targetScore: 3000,
    quiz: {
      diet: 'high-meat',
      commuteMode: 'car',
      weeklyMileage: 100,
      flightsPerYear: 1,
      homeEnergy: 'heating-gas',
      homeSize: 'medium-house',
      shoppingHabits: 'frequent-buyer'
    },
    baselineBreakdown: { home: 1000, travel: 1000, food: 1000, shopping: 2000 }
  },
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

describe('SmartAssistant', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // mock scrollIntoView
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders closed by default and opens on click', () => {
    render(<SmartAssistant ecoState={mockState} />);
    
    // Should not see the chat window
    expect(screen.queryByText('Eco Assistant')).toBeNull();
    
    // Click floating button
    const fabButton = screen.getByLabelText('Open Smart Assistant');
    fireEvent.click(fabButton);
    
    // Now should see it
    expect(screen.getByText('Eco Assistant')).toBeDefined();
    
    // Click close
    const closeButton = screen.getByLabelText('Close Assistant');
    fireEvent.click(closeButton);
    
    // Should be closed again
    expect(screen.queryByText('Eco Assistant')).toBeNull();
  });

  it('handles sending messages and receiving ai response', async () => {
    render(<SmartAssistant ecoState={mockState} />);
    
    // Open chat
    fireEvent.click(screen.getByLabelText('Open Smart Assistant'));
    
    const input = screen.getByLabelText('Type your message');
    const sendBtn = screen.getByLabelText('Send Message');
    
    // Type and send "score"
    fireEvent.change(input, { target: { value: 'what is my score' } });
    fireEvent.click(sendBtn);
    
    expect(screen.getByText('what is my score')).toBeDefined();
    
    // AI should reply after 1000ms
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    
    expect(screen.getByText(/Your current score is 5000 kg CO₂./)).toBeDefined();
    
    // Type another message
    fireEvent.change(input, { target: { value: 'habit tips' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    
    expect(screen.getByText('habit tips')).toBeDefined();
    
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    
    expect(screen.getByText(/I recommend focusing on your largest emissions category/)).toBeDefined();
  });
});
