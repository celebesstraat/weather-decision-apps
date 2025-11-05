import React from 'react';
import { useTimeAxis } from '../contexts/TimeAxisContext';
import { ChartAlignment, useScreenSize } from '../utils/chartAlignment';
import SunriseIcon from './icons/SunriseIcon';
import SunsetIcon from './icons/SunsetIcon';

interface SharedTimestampAxisProps {
  showSunriseSunset?: boolean;
  showHourLabels?: boolean;
  className?: string;
}

const SharedTimestampAxis: React.FC<SharedTimestampAxisProps> = ({
  showSunriseSunset = true,
  showHourLabels = true,
  className = ""
}) => {
  const timeAxis = useTimeAxis();
  const screenSize = useScreenSize();
  
  // Calculate optimal dimensions for current screen
  const dimensions = ChartAlignment.calculateOptimalDimensions(
    timeAxis.totalHours,
    screenSize
  );
  
  // Create alignment helper
  const alignment = new ChartAlignment(
    dimensions.chartWidth,
    dimensions.leftMargin,
    dimensions.rightMargin,
    timeAxis.totalHours,
    32 // Timestamp row height
  );
  
  const containerStyles = alignment.getContainerStyles();
  
  // Generate timestamp labels with smart spacing
  const timestampLabels = ChartAlignment.generateTimestampLabels(
    timeAxis.visibleHours,
    screenSize
  );
  
  return (
    <div className={`w-full ${className}`} style={containerStyles.container}>
      {/* Left gutter - Sunrise */}
      {showSunriseSunset && (
        <div style={containerStyles.leftGutter}>
          <div className="flex items-center gap-1">
            <SunriseIcon className="w-4 h-4 text-orange-500" />
            <span className="text-xs text-orange-600 font-medium whitespace-nowrap">
              {timeAxis.sunriseTime}
            </span>
          </div>
        </div>
      )}
      
      {/* Chart area - Hour labels */}
      {showHourLabels && (
        <div style={containerStyles.timestampRow}>
          <div style={alignment.createTimestampGrid(timeAxis.visibleHours)}>
            {timestampLabels.map((item, index) => (
              <div
                key={item.hour}
                className={`text-center transition-opacity duration-200 ${
                  item.show ? 'opacity-100' : 'opacity-0'
                }`}
                style={{
                  fontSize: screenSize === 'mobile' ? '0.7rem' : '0.75rem',
                  fontWeight: 500
                }}
              >
                {item.show ? item.label : ''}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Right gutter - Sunset */}
      {showSunriseSunset && (
        <div style={containerStyles.rightGutter}>
          <div className="flex items-center gap-1">
            <span className="text-xs text-orange-800 font-medium whitespace-nowrap">
              {timeAxis.sunsetTime}
            </span>
            <SunsetIcon className="w-4 h-4 text-orange-700" />
          </div>
        </div>
      )}
    </div>
  );
};

export default SharedTimestampAxis;