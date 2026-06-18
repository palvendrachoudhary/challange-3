import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ComprehensiveCalculator from './ComprehensiveCalculator';

describe('ComprehensiveCalculator', () => {
  it('renders the ComprehensiveCalculator component', () => {
    render(<ComprehensiveCalculator />);
    expect(screen.getByText('ISO-Compliant Deep Carbon Auditor')).toBeDefined();
  });

  it('can switch tabs and add a flight', () => {
    render(<ComprehensiveCalculator />);
    
    // Default tab is 'home'
    expect(screen.getByText('Home Energy Consumption')).toBeDefined();

    // Switch to Flights tab
    fireEvent.click(screen.getByText('Flights'));
    expect(screen.getByText('Flight Registry')).toBeDefined();

    // Add a flight
    expect(screen.getByText(/No flights added/i)).toBeDefined();
    fireEvent.click(screen.getByText('Add Flight'));
    expect(screen.getByText('Flight 1')).toBeDefined();
  });
});
