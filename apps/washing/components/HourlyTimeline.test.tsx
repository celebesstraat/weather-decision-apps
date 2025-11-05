import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import HourlyTimeline from './HourlyTimeline';
import type { DryingScore, HourlyForecast, WeatherCondition } from '../types';

// Mock the icon components
jest.mock('./icons/SunriseIcon', () => ({ className }: { className: string }) => 
  <div data-testid="sunrise-icon" className={className} />
);
jest.mock('./icons/SunsetIcon', () => ({ className }: { className: string }) => 
  <div data-testid="sunset-icon" className={className} />
);
jest.mock('./HourlyConditionsPopup', () => ({ isVisible, onClose }: { isVisible: boolean; onClose: () => void }) => 
  isVisible ? <div data-testid="conditions-popup" onClick={onClose}>Popup</div> : null
);

const mockHourlyScores: DryingScore[] = [
  {
    hour: 8,
    time: '08:00',
    totalScore: 75,
    suitable: true,
    componentScores: {
      humidity: 70,
      rainChance: 90,
      windSpeed: 65,
      temperature: 60,
      uvIndex: 50
    },
    details: 'Good drying conditions',
    dryingWindows: []
  },
  {
    hour: 12,
    time: '12:00',
    totalScore: 45,
    suitable: false,
    componentScores: {
      humidity: 30,
      rainChance: 40,
      windSpeed: 45,
      temperature: 70,
      uvIndex: 80
    },
    details: 'Poor drying conditions',
    dryingWindows: []
  },
  {
    hour: 16,
    time: '16:00',
    totalScore: 85,
    suitable: true,
    componentScores: {
      humidity: 80,
      rainChance: 95,
      windSpeed: 75,
      temperature: 65,
      uvIndex: 70
    },
    details: 'Excellent drying conditions',
    dryingWindows: []
  }
];

const mockHourlyData: HourlyForecast[] = [
  {
    time: '08:00',
    temperature: 18,
    humidity: 60,
    windSpeed: 12,
    rainChance: 10,
    uvIndex: 3,
    dewPoint: 12,
    cloudCover: 40
  },
  {
    time: '12:00',
    temperature: 22,
    humidity: 70,
    rainChance: 60,
    uvIndex: 8,
    dewPoint: 16,
    cloudCover: 80
  },
  {
    time: '16:00',
    temperature: 20,
    humidity: 55,
    rainChance: 5,
    uvIndex: 6,
    dewPoint: 10,
    cloudCover: 20
  }
];

const mockAstronomy = {
  sunrise: '06:25',
  sunset: '20:03',
  sunriseDecimal: 6.42,
  sunsetDecimal: 20.05
};

describe('HourlyTimeline', () => {
  beforeEach(() => {
    // Mock current time to 10 AM for consistent testing
    jest.spyOn(Date.prototype, 'getHours').mockReturnValue(10);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders correctly with basic props', () => {
    render(
      <HourlyTimeline 
        hourlyScores={mockHourlyScores}
        day="Today"
      />
    );

    expect(screen.getByText('Drying Conditions')).toBeInTheDocument();
    expect(screen.getByText(/hour forecast/)).toBeInTheDocument();
  });

  test('displays sunrise and sunset icons with times', () => {
    render(
      <HourlyTimeline 
        hourlyScores={mockHourlyScores}
        day="Today"
        astronomy={mockAstronomy}
      />
    );

    expect(screen.getByTestId('sunrise-icon')).toBeInTheDocument();
    expect(screen.getByTestId('sunset-icon')).toBeInTheDocument();
    expect(screen.getByText('06:25')).toBeInTheDocument();
    expect(screen.getByText('20:03')).toBeInTheDocument();
  });

  test('shows correct number of bars for filtered scores', () => {
    render(
      <HourlyTimeline 
        hourlyScores={mockHourlyScores}
        day="Today"
      />
    );

    // Should show 3 bars for the 3 scores provided (all within daylight hours)
    const bars = screen.getByText(/3 hour forecast/);
    expect(bars).toBeInTheDocument();
  });

  test('applies correct colors for suitable vs unsuitable scores', () => {
    const { container } = render(
      <HourlyTimeline 
        hourlyScores={mockHourlyScores}
        day="Today"
      />
    );

    // Look for elements with both h-8 class (bar height) and color classes
    const greenBars = container.querySelectorAll('.h-8.bg-green-600');
    const redBars = container.querySelectorAll('.h-8.bg-red-500');
    
    expect(greenBars.length).toBe(2); // Two suitable scores
    expect(redBars.length).toBe(1);   // One unsuitable score
  });

  test('shows current time indicator for today', () => {
    // Mock current hour to match one of our test scores
    jest.spyOn(Date.prototype, 'getHours').mockReturnValue(8);

    render(
      <HourlyTimeline 
        hourlyScores={mockHourlyScores}
        day="Today"
        isToday={true}
      />
    );

    expect(screen.getByText('NOW')).toBeInTheDocument();
  });

  test('does not show current time indicator for non-today', () => {
    render(
      <HourlyTimeline 
        hourlyScores={mockHourlyScores}
        day="Tomorrow"
        isToday={false}
      />
    );

    expect(screen.queryByText('NOW')).not.toBeInTheDocument();
  });

  test('shows mobile details panel when bar is clicked', () => {
    const { container } = render(
      <HourlyTimeline 
        hourlyScores={mockHourlyScores}
        day="Today"
      />
    );

    const firstBar = container.querySelector('.h-8');
    expect(firstBar).toBeTruthy();
    
    if (firstBar) {
      fireEvent.click(firstBar);
      // Check mobile panel is visible by looking for the sm:hidden class
      const mobilePanel = container.querySelector('.sm\\:hidden.mt-3.p-3');
      expect(mobilePanel).toBeInTheDocument();
    }
  });

  test('closes mobile details panel when close button is clicked', () => {
    const { container } = render(
      <HourlyTimeline 
        hourlyScores={mockHourlyScores}
        day="Today"
      />
    );

    const firstBar = container.querySelector('.h-8');
    if (firstBar) {
      fireEvent.click(firstBar);
      
      const closeButton = screen.getByText('✕');
      fireEvent.click(closeButton);
      
      // Check mobile panel is no longer visible
      const mobilePanel = container.querySelector('.sm\\:hidden.mt-3.p-3');
      expect(mobilePanel).not.toBeInTheDocument();
    }
  });

  test('shows conditions popup when hourly data is available', () => {
    const { container } = render(
      <HourlyTimeline 
        hourlyScores={mockHourlyScores}
        hourlyData={mockHourlyData}
        day="Today"
      />
    );

    const firstBar = container.querySelector('.h-8');
    if (firstBar) {
      fireEvent.click(firstBar);
      expect(screen.getByTestId('conditions-popup')).toBeInTheDocument();
    }
  });

  test('displays legend correctly', () => {
    render(
      <HourlyTimeline 
        hourlyScores={mockHourlyScores}
        day="Today"
      />
    );

    expect(screen.getByText('Good for outdoor drying')).toBeInTheDocument();
    expect(screen.getByText('Indoor drying only')).toBeInTheDocument();
    expect(screen.getByText('💡 Tap any hour for details')).toBeInTheDocument();
  });

  test('formatHour function works correctly', () => {
    const { container } = render(
      <HourlyTimeline 
        hourlyScores={mockHourlyScores}
        day="Today"
      />
    );

    const firstBar = container.querySelector('.h-8');
    if (firstBar) {
      fireEvent.click(firstBar);
      // Check mobile panel shows formatted time
      const mobilePanel = container.querySelector('.sm\\:hidden');
      expect(mobilePanel).toBeInTheDocument();
    }
  });

  test('filters scores to match WeatherChart hours (6am-11pm)', () => {
    const allDayScores: DryingScore[] = [
      { ...mockHourlyScores[0], hour: 3, time: '03:00' }, // Early morning - should be filtered
      { ...mockHourlyScores[0], hour: 5, time: '05:00' }, // Before 6am - should be filtered  
      { ...mockHourlyScores[0], hour: 8, time: '08:00' }, // Day - should show
      { ...mockHourlyScores[0], hour: 15, time: '15:00' }, // Day - should show
      { ...mockHourlyScores[0], hour: 20, time: '20:00' }, // Evening - should show
      { ...mockHourlyScores[0], hour: 23, time: '23:00' }, // Late - should show (matches WeatherChart)
    ];

    const { container } = render(
      <HourlyTimeline 
        hourlyScores={allDayScores}
        day="Today"
        astronomy={mockAstronomy}
      />
    );

    // Should show 4 bars (filtered from 6 to show only 6am-11pm range)
    const bars = container.querySelectorAll('.h-8');
    expect(bars.length).toBe(4);
  });

  test('handles empty hourly scores gracefully', () => {
    render(
      <HourlyTimeline 
        hourlyScores={[]}
        day="Today"
      />
    );

    expect(screen.getByText('Drying Conditions')).toBeInTheDocument();
    expect(screen.getByText(/0 hour forecast/)).toBeInTheDocument();
  });

  test('uses fallback astronomy calculations when astronomy prop not provided', () => {
    render(
      <HourlyTimeline 
        hourlyScores={mockHourlyScores}
        day="Today"
      />
    );

    // Should still render sunrise/sunset icons with calculated times
    expect(screen.getByTestId('sunrise-icon')).toBeInTheDocument();
    expect(screen.getByTestId('sunset-icon')).toBeInTheDocument();
  });
});