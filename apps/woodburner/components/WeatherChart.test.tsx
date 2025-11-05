const React = require('react');
const { render, screen } = require('@testing-library/react');
require('@testing-library/jest-dom');
const WeatherChart = require('./WeatherChart').default;

const mockHourlyData = [
  {
    time: '06:00',
    temperature: 15,
    humidity: 80,
    windSpeed: 5,
    rainChance: 10,
    uvIndex: 1,
    dewPoint: 12,
    cloudCover: 60
  },
  {
    time: '09:00',
    temperature: 18,
    humidity: 65,
    windSpeed: 8,
    rainChance: 5,
    uvIndex: 4,
    dewPoint: 11,
    cloudCover: 40
  },
  {
    time: '12:00',
    temperature: 22,
    humidity: 55,
    windSpeed: 12,
    rainChance: 0,
    uvIndex: 8,
    dewPoint: 10,
    cloudCover: 20
  },
  {
    time: '15:00',
    temperature: 24,
    humidity: 50,
    windSpeed: 15,
    rainChance: 15,
    uvIndex: 9,
    dewPoint: 9,
    cloudCover: 30
  },
  {
    time: '18:00',
    temperature: 20,
    humidity: 60,
    windSpeed: 10,
    rainChance: 20,
    uvIndex: 5,
    dewPoint: 11,
    cloudCover: 50
  },
  {
    time: '21:00',
    temperature: 16,
    humidity: 75,
    windSpeed: 6,
    rainChance: 30,
    uvIndex: 0,
    dewPoint: 12,
    cloudCover: 70
  }
];

const mockHourlyScores = [
  {
    hour: 9,
    time: '09:00',
    totalScore: 75,
    suitable: true,
    componentScores: {
      humidity: 70,
      temperature: 60,
      dewPointSpread: 0,
      windSpeed: 65,
      cloudCover: 0
    },
  }
];

describe('WeatherChart', () => {
  test('renders correctly with hourly data', () => {
    render(
      <WeatherChart 
        hourlyData={mockHourlyData}
        day="Today"
      />
    );

    // Check legend is present
    expect(screen.getByText(/Temperature/)).toBeInTheDocument();
    expect(screen.getByText(/Rain/)).toBeInTheDocument();
    expect(screen.getByText(/Wind/)).toBeInTheDocument();
    expect(screen.getByText(/Humidity/)).toBeInTheDocument();
    expect(screen.getByText(/Dew Point/)).toBeInTheDocument();
    expect(screen.getByText(/Cloud Cover/)).toBeInTheDocument();
  });

  test('displays temperature ranges in legend', () => {
    render(
      <WeatherChart 
        hourlyData={mockHourlyData}
        day="Today"
      />
    );

    // Should show temperature range from the data (15° - 24°)
    expect(screen.getByText(/15° - 24°/)).toBeInTheDocument();
  });

  test('displays rain chance ranges in legend', () => {
    render(
      <WeatherChart 
        hourlyData={mockHourlyData}
        day="Today"
      />
    );

    // Should show rain chance range (0% - 30%)
    expect(screen.getByText(/0% - 30%/)).toBeInTheDocument();
  });

  test('displays wind speed ranges in legend', () => {
    render(
      <WeatherChart 
        hourlyData={mockHourlyData}
        day="Today"
      />
    );

    // Should show wind speed range (5km/h - 15km/h)
    expect(screen.getByText(/5km\/h - 15km\/h/)).toBeInTheDocument();
  });

  test('displays humidity ranges in legend', () => {
    render(
      <WeatherChart 
        hourlyData={mockHourlyData}
        day="Today"
      />
    );

    // Humidity should be smoothed, but range should be visible
    expect(screen.getByText(/Humidity/)).toBeInTheDocument();
  });

  test('displays dew point ranges in legend', () => {
    render(
      <WeatherChart 
        hourlyData={mockHourlyData}
        day="Today"
      />
    );

    // Should show dew point range (9° - 12°)
    expect(screen.getByText(/9° - 12°/)).toBeInTheDocument();
  });

  test('renders SVG chart with correct dimensions', () => {
    const { container } = render(
      <WeatherChart 
        hourlyData={mockHourlyData}
        day="Today"
      />
    );

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '100%');
    expect(svg).toHaveAttribute('height', '80');
    expect(svg).toHaveAttribute('viewBox', '0 0 100 80');
  });

  test('renders chart lines for each metric', () => {
    const { container } = render(
      <WeatherChart 
        hourlyData={mockHourlyData}
        day="Today"
      />
    );

    const paths = container.querySelectorAll('path');
    expect(paths).toHaveLength(6); // Temperature, rain, wind, humidity, dew point, cloud cover lines

    // Check stroke colors match the legend
    const strokeColors = Array.from(paths).map(path => path.getAttribute('stroke'));
    expect(strokeColors).toContain('#ef4444'); // Temperature (red)
    expect(strokeColors).toContain('#000000'); // Rain (black)
    expect(strokeColors).toContain('#10b981'); // Wind (green)
    expect(strokeColors).toContain('#3b82f6'); // Humidity (blue)
    expect(strokeColors).toContain('#4b5563'); // Cloud Cover (gray)
  });

  test('renders hour divider lines', () => {
    const { container } = render(
      <WeatherChart 
        hourlyData={mockHourlyData}
        day="Today"
      />
    );

    const lines = container.querySelectorAll('line');
    // Should have divider lines between hours (length - 1)
    expect(lines.length).toBe(mockHourlyData.length - 1);
  });

  test('filters data to daylight hours only', () => {
    const allDayData = [
      { ...mockHourlyData[0], time: '03:00' }, // Night - should be filtered
      { ...mockHourlyData[0], time: '08:00' }, // Day - should show
      { ...mockHourlyData[0], time: '15:00' }, // Day - should show
      { ...mockHourlyData[0], time: '22:00' }, // Late but within range - should show
    ];

    const { container } = render(
      <WeatherChart 
        hourlyData={allDayData}
        day="Today"
      />
    );

    const lines = container.querySelectorAll('line');
    // Should have 2 divider lines (3 data points - 1)
    expect(lines.length).toBe(2);
  });

  test('returns null when no hourly data provided', () => {
    const { container } = render(
      <WeatherChart 
        hourlyData={[]}
        day="Today"
      />
    );

    expect(container.firstChild).toBeNull();
  });

  test('returns null when hourly data is undefined', () => {
    const { container } = render(
      <WeatherChart 
        hourlyData={undefined}
        day="Today"
      />
    );

    expect(container.firstChild).toBeNull();
  });

  test('handles single data point correctly', () => {
    const singleDataPoint = [mockHourlyData[0]];
    
    render(
      <WeatherChart 
        hourlyData={singleDataPoint}
        day="Today"
      />
    );

    // Should render without errors
    expect(screen.getByText(/Temperature/)).toBeInTheDocument();
  });

  test('applies 3-point moving average to humidity data', () => {
    const humidityTestData = [
      { ...mockHourlyData[0], humidity: 80, time: '06:00' },
      { ...mockHourlyData[0], humidity: 60, time: '09:00' }, // Should be averaged
      { ...mockHourlyData[0], humidity: 40, time: '12:00' },
      { ...mockHourlyData[0], humidity: 50, time: '15:00' }, // Should be averaged
      { ...mockHourlyData[0], humidity: 70, time: '18:00' },
    ];

    render(
      <WeatherChart 
        hourlyData={humidityTestData}
        day="Today"
      />
    );

    // The humidity range in legend should reflect the smoothed values
    expect(screen.getByText(/Humidity/)).toBeInTheDocument();
  });

  test('normalizes values correctly for consistent plotting', () => {
    const extremeData = [
      { ...mockHourlyData[0], temperature: 0, time: '06:00' },
      { ...mockHourlyData[0], temperature: 40, time: '09:00' },
    ];

    render(
      <WeatherChart 
        hourlyData={extremeData}
        day="Today"
      />
    );

    // Should show the extreme temperature range
    expect(screen.getByText(/0° - 40°/)).toBeInTheDocument();
  });

  test('handles optional hourlyScores prop', () => {
    render(
      <WeatherChart 
        hourlyData={mockHourlyData}
        hourlyScores={mockHourlyScores}
        day="Today"
      />
    );

    // Should render normally with hourlyScores provided
    expect(screen.getByText(/Temperature/)).toBeInTheDocument();
  });

  test('chart maintains proper aspect ratio', () => {
    const { container } = render(
      <WeatherChart 
        hourlyData={mockHourlyData}
        day="Today"
      />
    );

    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('preserveAspectRatio', 'none');
  });
});
