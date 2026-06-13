import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CommunityLeaderboard from './CommunityLeaderboard';

describe('CommunityLeaderboard', () => {
  it('renders correctly', () => {
    render(<CommunityLeaderboard />);
    expect(screen.getByText(/Global Eco-Leaderboard/i)).toBeDefined();
  });
});
