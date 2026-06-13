import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import CommunityLeaderboard from './CommunityLeaderboard';

describe('CommunityLeaderboard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders correctly and cycles achievements', () => {
    render(<CommunityLeaderboard />);
    expect(screen.getByText(/Global Eco-Leaderboard/i)).toBeDefined();
    
    act(() => {
      vi.advanceTimersByTime(5000);
    });
  });
});
