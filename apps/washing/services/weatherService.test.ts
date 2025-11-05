import { analyzeDryingPattern } from './weatherService';
import type { DryingScore } from '../types';
import { RecommendationStatus } from '../types';

describe('DryCast Algorithm', () => {
  describe('analyzeDryingPattern', () => {
    const createMockScore = (hour: number, totalScore: number, suitable: boolean): DryingScore => ({
      hour,
      time: `${hour}:00`,
      totalScore,
      componentScores: {
        humidity: 50,
        temperature: 50,
        dewPointSpread: 50,
        windSpeed: 50,
        cloudCover: 50
      },
      suitable
    });

    it('should recommend "Get The Washing Out" for 2+ continuous hours with 60%+ scores', () => {
      const scores = [
        createMockScore(8, 45, false),   // Below 60% threshold
        createMockScore(9, 65, true),    // Above 60% - start of window
        createMockScore(10, 70, true),   // Above 60% - continues window (2+ hours now)
        createMockScore(11, 55, false),  // Below 60% - breaks window
        createMockScore(12, 75, true),   // Above 60% - isolated hour
      ];

      const result = analyzeDryingPattern(scores);
      
      expect(result.status).toBe('continuous');
      expect(result.message).toBe('Get The Washing Out');
      expect(result.color).toBe('bg-green-500');
    });

    it('should recommend "Brief Gaps" for isolated good hours without 2+ continuous window', () => {
      const scores = [
        createMockScore(8, 45, false),   // Below 60%
        createMockScore(9, 70, true),    // Above 60% - isolated
        createMockScore(10, 45, false),  // Below 60%
        createMockScore(11, 65, true),   // Above 60% - isolated
        createMockScore(12, 40, false),  // Below 60%
      ];

      const result = analyzeDryingPattern(scores);
      
      expect(result.status).toBe('isolated');
      expect(result.message).toBe('Brief Gaps for Outdoor Drying');
      expect(result.color).toBe('bg-amber-500');
    });

    it('should recommend "Indoor Drying Only" when no hours meet 60% threshold', () => {
      const scores = [
        createMockScore(8, 45, false),
        createMockScore(9, 50, false),
        createMockScore(10, 35, false),
        createMockScore(11, 40, false),
      ];

      const result = analyzeDryingPattern(scores);
      
      expect(result.status).toBe('none');
      expect(result.message).toBe('Indoor Drying Only');
      expect(result.color).toBe('bg-red-500');
    });

    it('should handle single good hour (not meeting 2+ hour requirement)', () => {
      const scores = [
        createMockScore(8, 45, false),
        createMockScore(9, 70, true),    // Single good hour
        createMockScore(10, 45, false),
      ];

      const result = analyzeDryingPattern(scores);
      
      expect(result.status).toBe('isolated');
      expect(result.message).toBe('Brief Gaps for Outdoor Drying');
    });
  });

  describe('RecommendationStatus enum', () => {
    it('should have the correct simplified binary values', () => {
      expect(RecommendationStatus.GET_THE_WASHING_OUT).toBe('GET_THE_WASHING_OUT');
      expect(RecommendationStatus.INDOOR_DRYING_ONLY).toBe('INDOOR_DRYING_ONLY');
      
      // Verify MAYBE no longer exists
      expect((RecommendationStatus as any).MAYBE).toBeUndefined();
      expect((RecommendationStatus as any).YES).toBeUndefined();
      expect((RecommendationStatus as any).NO).toBeUndefined();
    });
  });
});