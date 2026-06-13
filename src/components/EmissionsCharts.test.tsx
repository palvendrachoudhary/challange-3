import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import EmissionsCharts from './EmissionsCharts';

vi.mock('recharts', async () => {
  const OriginalRechartsModule = await vi.importActual('recharts') as any;
  return {
    ...OriginalRechartsModule,
    ResponsiveContainer: ({ children }: any) => (
      <OriginalRechartsModule.ResponsiveContainer width={800} height={800}>
        {children}
      </OriginalRechartsModule.ResponsiveContainer>
    ),
  };
});

describe('EmissionsCharts', () => {
  it('renders charts and main regions with proper accessibility', () => {
    const mockProfile = {
      baselineScore: 10,
      targetScore: 5,
      baselineBreakdown: { home: 4, travel: 3, food: 2, shopping: 1 }
    };
    render(<EmissionsCharts profile={mockProfile as any} currentActualScore={8} />);
    
    expect(screen.getByText('Carbon Score Dashboard')).toBeDefined();
    expect(screen.getByText('Detailed Category Breakdown')).toBeDefined();
    expect(screen.getByText('Weekly Carbon Savings Trend')).toBeDefined();
    expect(screen.getByRole('region', { name: "Category Breakdown" })).toBeDefined();
  });
});
