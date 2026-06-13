import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders auth portal on load', () => {
    // Need to set matchMedia for some components that might rely on it, but App.tsx seems plain.
    render(<App />);
    expect(screen.getByText(/SECURED END-TO-END ENCRYPTED PORTAL/i)).toBeDefined();
  });
});
