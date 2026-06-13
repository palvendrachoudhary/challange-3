import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import EcoTipsModal from './EcoTipsModal';
import { OnboardingQuiz } from '../types';

describe('EcoTipsModal', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(<EcoTipsModal isOpen={false} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders generic tips when no quiz is provided', () => {
    render(<EcoTipsModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Personalized Eco-Tips')).toBeDefined();
    expect(screen.getByText(/Complete your onboarding quiz to receive highly personalized eco-tips/i)).toBeDefined();
    expect(screen.getByText('General')).toBeDefined();
  });

  it('renders customized tips based on quiz', () => {
    const quiz: OnboardingQuiz = {
      diet: 'high-meat',
      commuteMode: 'car',
      weeklyMileage: 200,
      flightsPerYear: 2,
      homeEnergy: 'heating-gas',
      homeSize: 'large-house',
      shoppingHabits: 'frequent-buyer'
    };

    render(<EcoTipsModal isOpen={true} onClose={vi.fn()} quiz={quiz} />);
    
    // Diet
    expect(screen.getByText(/Consider Meatless Mondays to reduce your food carbon footprint quickly./i)).toBeDefined();
    // Commute
    expect(screen.getByText(/Try carpooling or using public transit at least one day a week./i)).toBeDefined();
    // Home
    expect(screen.getByText(/Ensure your home is properly insulated./i)).toBeDefined();
    // Shopping
    expect(screen.getByText(/Try a 'Buy Nothing' month for non-essential items./i)).toBeDefined();
    
    expect(screen.queryByText(/Complete your onboarding quiz/i)).toBeNull();
  });

  it('calls onClose when close button or backdrop is clicked', () => {
    const handleClose = vi.fn();
    render(<EcoTipsModal isOpen={true} onClose={handleClose} />);
    
    const closeBtn = screen.getByLabelText('Close Modal');
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);

    const gotItBtn = screen.getByText('Got it, thanks!');
    fireEvent.click(gotItBtn);
    expect(handleClose).toHaveBeenCalledTimes(2);
  });
});
