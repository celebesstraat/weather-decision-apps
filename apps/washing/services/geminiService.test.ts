import { generateShortTermSummary, getPlacenameFromCoords } from './geminiService';
import { GoogleGenerativeAI } from '@google/genai';

// Mock the entire @google/genai library
jest.mock('@google/genai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn(),
    }),
  })),
}));

const mockGenerateContent = (text: string) => {
  const mockGenAI = new GoogleGenerativeAI('mock-api-key');
  const model = mockGenAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  (model.generateContent as jest.Mock).mockResolvedValue({
    response: {
      text: () => text,
    },
  });
};

describe('geminiService', () => {
  describe('generateShortTermSummary', () => {
    it('should return a summary from the Gemini API', async () => {
      const mockSummary = 'The best day to do laundry is Tuesday. Avoid Wednesday.';
      mockGenerateContent(mockSummary);

      const forecast = [
        { day: 'Monday', condition: 'Cloudy', washingStatus: 'Poor' },
        { day: 'Tuesday', condition: 'Sunny', washingStatus: 'Good' },
        { day: 'Wednesday', condition: 'Rainy', washingStatus: 'Poor' },
      ];
      const summary = await generateShortTermSummary(forecast as any);
      expect(summary).toBe(mockSummary);
    });

    it('should handle API errors gracefully', async () => {
      const mockGenAI = new GoogleGenerativeAI('mock-api-key');
      const model = mockGenAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      (model.generateContent as jest.Mock).mockRejectedValue(new Error('API Error'));

      const forecast = [{ day: 'Monday', condition: 'Cloudy', washingStatus: 'Poor' }];
      const summary = await generateShortTermSummary(forecast as any);
      expect(summary).toBe('🤖 AI summary temporarily unavailable. Your weather recommendations above are still accurate and updated with the latest conditions.');
    });
  });

  describe('getPlacenameFromCoords', () => {
    it('should return a placename from the Gemini API', async () => {
      const mockPlacename = 'Larbert';
      mockGenerateContent(mockPlacename);

      const coords = { lat: 56.02, lon: -3.8 };
      const placename = await getPlacenameFromCoords(coords);
      expect(placename).toBe(mockPlacename);
    });

    it('should handle API errors gracefully', async () => {
        const mockGenAI = new GoogleGenerativeAI('mock-api-key');
        const model = mockGenAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        (model.generateContent as jest.Mock).mockRejectedValue(new Error('API Error'));

      const coords = { lat: 56.02, lon: -3.8 };
      const placename = await getPlacenameFromCoords(coords);
      expect(placename).toBe('Unknown Location');
    });
  });
});