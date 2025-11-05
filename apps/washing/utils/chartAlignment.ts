import type { CSSProperties } from 'react';

export interface ChartContainerStyles {
  container: CSSProperties;
  chartArea: CSSProperties;
  leftGutter: CSSProperties;
  rightGutter: CSSProperties;
  timestampRow: CSSProperties;
}

export interface ChartDimensions {
  totalWidth: number;
  chartWidth: number;
  leftMargin: number;
  rightMargin: number;
  hourWidth: number;
  containerHeight: number;
}

export class ChartAlignment {
  private dimensions: ChartDimensions;
  
  constructor(
    chartWidth: number,
    leftMargin: number,
    rightMargin: number,
    totalHours: number,
    containerHeight: number = 80
  ) {
    this.dimensions = {
      totalWidth: leftMargin + chartWidth + rightMargin,
      chartWidth,
      leftMargin,
      rightMargin,
      hourWidth: chartWidth / totalHours,
      containerHeight
    };
  }
  
  /**
   * Get CSS Grid container styles for perfect alignment
   */
  getContainerStyles(): ChartContainerStyles {
    const { leftMargin, chartWidth, rightMargin } = this.dimensions;
    
    return {
      container: {
        display: 'grid',
        gridTemplateColumns: `${leftMargin}px ${chartWidth}px ${rightMargin}px`,
        gridTemplateRows: 'auto',
        alignItems: 'center',
        width: '100%',
        minWidth: `${this.dimensions.totalWidth}px`
      },
      
      leftGutter: {
        gridColumn: '1',
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingRight: '8px'
      },
      
      chartArea: {
        gridColumn: '2',
        width: '100%',
        height: `${this.dimensions.containerHeight}px`,
        position: 'relative'
      },
      
      rightGutter: {
        gridColumn: '3',
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingLeft: '8px'
      },
      
      timestampRow: {
        gridColumn: '2',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '0.75rem',
        color: '#64748b',
        marginTop: '4px',
        fontFamily: 'monospace'
      }
    };
  }
  
  /**
   * Get SVG viewBox string for consistent scaling
   */
  getSVGViewBox(height?: number): string {
    const chartHeight = height || this.dimensions.containerHeight;
    return `0 0 ${this.dimensions.chartWidth} ${chartHeight}`;
  }
  
  /**
   * Calculate X position for a given hour index within the chart
   */
  getHourXPosition(hourIndex: number, totalHours: number): number {
    return ((hourIndex + 0.5) / totalHours) * this.dimensions.chartWidth;
  }
  
  /**
   * Get responsive hour width based on total hours and screen size
   */
  static calculateOptimalDimensions(
    totalHours: number,
    screenSize: 'mobile' | 'tablet' | 'desktop' = 'desktop'
  ): { chartWidth: number; leftMargin: number; rightMargin: number } {
    const baseHourWidth = {
      mobile: 24,
      tablet: 28,
      desktop: 32
    }[screenSize];
    
    const margins = {
      mobile: { left: 60, right: 60 },
      tablet: { left: 70, right: 70 },
      desktop: { left: 80, right: 80 }
    }[screenSize];
    
    const maxChartWidth = {
      mobile: 280,
      tablet: 500,
      desktop: 800
    }[screenSize];
    
    const minChartWidth = 200;
    const idealChartWidth = totalHours * baseHourWidth;
    const chartWidth = Math.min(maxChartWidth, Math.max(minChartWidth, idealChartWidth));
    
    return {
      chartWidth,
      leftMargin: margins.left,
      rightMargin: margins.right
    };
  }
  
  /**
   * Create CSS Grid template for timestamp labels
   */
  createTimestampGrid(visibleHours: number[]): CSSProperties {
    const gridTemplate = visibleHours.map(() => '1fr').join(' ');
    
    return {
      display: 'grid',
      gridTemplateColumns: gridTemplate,
      width: '100%',
      textAlign: 'center' as const,
      fontSize: '0.75rem',
      color: '#64748b',
      fontFamily: 'monospace'
    };
  }
  
  /**
   * Generate optimized timestamp labels to prevent overcrowding
   */
  static generateTimestampLabels(
    visibleHours: number[],
    screenSize: 'mobile' | 'tablet' | 'desktop'
  ): { hour: number; label: string; show: boolean }[] {
    const formatHour = (hour: number): string => {
      if (hour === 0) return '12am';
      if (hour < 12) return `${hour}am`;
      if (hour === 12) return '12pm';
      return `${hour - 12}pm`;
    };
    
    const totalHours = visibleHours.length;
    
    // Determine step size based on screen size and total hours
    let step = 1;
    if (screenSize === 'mobile' && totalHours > 8) {
      step = totalHours > 12 ? 3 : 2;
    } else if (screenSize === 'tablet' && totalHours > 12) {
      step = 2;
    }
    
    return visibleHours.map((hour, index) => ({
      hour,
      label: formatHour(hour),
      show: index % step === 0 || index === 0 || index === totalHours - 1 // Always show first and last
    }));
  }
}

/**
 * Hook for detecting current screen size
 */
export const useScreenSize = (): 'mobile' | 'tablet' | 'desktop' => {
  const [screenSize, setScreenSize] = React.useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  
  React.useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setScreenSize('mobile');
      } else if (width < 1024) {
        setScreenSize('tablet');
      } else {
        setScreenSize('desktop');
      }
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);
  
  return screenSize;
};

// Import React for the hook
import React from 'react';