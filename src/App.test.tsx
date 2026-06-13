import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from './App';

describe('App', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders auth portal on load', () => {
    // Need to set matchMedia for some components that might rely on it, but App.tsx seems plain.
    render(<App />);
    expect(screen.getByText(/SECURED END-TO-END ENCRYPTED PORTAL/i)).toBeDefined();
  });

  it('bypasses login and shows onboarding wizard', async () => {
    render(<App />);
    
    const bypassBtn = screen.getByLabelText('Skip to Guest');
    fireEvent.click(bypassBtn);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // The onboarding wizard should be visible now
    expect(screen.getByText(/What best describes your typical daily diet/i)).toBeDefined();
    
    // Complete the onboarding wizard to reach main dashboard
    const continueBtns = screen.getAllByText('Continue');
    fireEvent.click(continueBtns[0]); // to Step 2
    fireEvent.click(screen.getByText('Continue')); // to Step 3
    fireEvent.click(screen.getByText('Continue')); // to Step 4
    fireEvent.click(screen.getByText('Continue')); // to Step 5
    
    const calculateBtn = screen.getByText('Calculate Footprint');
    fireEvent.click(calculateBtn);

    act(() => {
      vi.advanceTimersByTime(2000); // Wait for simulation to finish calculating
    });

    // Verify SmartAssistant component is rendered by floating action button
    expect(screen.getByLabelText('Open Smart Assistant')).toBeDefined();
  });
});
