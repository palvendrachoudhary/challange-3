import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LocalMap from './LocalMap';

// Mock Leaflet and React-Leaflet since they require DOM environments that might be hard to mock in JSDOM testing
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children }: { children: React.ReactNode }) => <div data-testid="marker">{children}</div>,
  Popup: ({ children }: { children: React.ReactNode }) => <div data-testid="popup">{children}</div>,
  useMap: () => ({
    flyTo: vi.fn(),
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),
  }),
}));

describe('LocalMap', () => {
  it('renders the map container and initial elements', () => {
    render(<LocalMap />);
    
    // Check for the title
    expect(screen.getByText('Global & Local Green Spots')).toBeDefined();
    
    // Check for "Find Nearby" button
    const findButton = screen.getByRole('button', { name: /Find Nearby/i });
    expect(findButton).toBeDefined();

    // Check for City Selector
    const select = screen.getByRole('combobox', { name: /Select a city/i });
    expect(select).toBeDefined();
    
    // Map container mock should be rendered
    const map = screen.getByTestId('map-container');
    expect(map).toBeDefined();
  });

  it('triggers find nearby action which shows nearby spots', () => {
    render(<LocalMap />);
    
    const findButton = screen.getByRole('button', { name: /Find Nearby/i });
    fireEvent.click(findButton);
    
    // Once clicked, it should render "3 Closest Eco-Spots" panel
    expect(screen.getByText('3 Closest Eco-Spots')).toBeDefined();
  });
});
