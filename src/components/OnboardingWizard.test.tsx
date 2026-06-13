import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import OnboardingWizard from './OnboardingWizard';

describe('OnboardingWizard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders first step and changes options', () => {
    render(<OnboardingWizard onOnboardingComplete={vi.fn()} />);
    expect(screen.getByText('What best describes your typical daily diet?')).toBeDefined();
    
    const veganBtn = screen.getByText('Plant-Based / Vegan');
    fireEvent.click(veganBtn);
    
    // Now verify vegan button is selected (it should have bg-emerald-50/40)
    expect(veganBtn.closest('button')?.className.includes('bg-emerald-50/40')).toBe(true);
  });

  it('navigates through steps', () => {
    render(<OnboardingWizard onOnboardingComplete={vi.fn()} />);
    
    // Step 1 -> 2
    fireEvent.click(screen.getByText('Continue'));
    expect(screen.getByText('How do you primarily commute?')).toBeDefined();
    
    // Step 2 -> 1
    fireEvent.click(screen.getByText('Back'));
    expect(screen.getByText('What best describes your typical daily diet?')).toBeDefined();
  });

  it('submits quiz on last step and calculates correctly', async () => {
    const onComplete = vi.fn();
    render(<OnboardingWizard onOnboardingComplete={onComplete} />);
    
    // Move to step 5
    fireEvent.click(screen.getByText('Continue')); // to step 2
    fireEvent.click(screen.getByText('Continue')); // to step 3
    fireEvent.click(screen.getByText('Continue')); // to step 4
    fireEvent.click(screen.getByText('Continue')); // to step 5
    
    expect(screen.getByText('Typical Consumer & Shopping Habits')).toBeDefined();
    
    // Click submit
    fireEvent.click(screen.getByText('Calculate Footprint'));
    
    expect(screen.getByText('Optimizing carbon footprint matrix...')).toBeDefined();
    
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(onComplete).toHaveBeenCalled();
    const profileData = onComplete.mock.calls[0][0];
    expect(profileData).toHaveProperty('baselineScore');
    expect(profileData).toHaveProperty('targetScore');
  });
});
