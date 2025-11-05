# @weather-apps/ai-services

Secure AI services for the weather-decision app family.

## Features

- **SecureAIClient**: Proxy client for Gemini API (never exposes API keys)
- **Prompt Generators**: App-specific prompts for drying, burning, lawn, golf
- **Error Handling**: Graceful degradation on quota errors
- **Rate Limit Handling**: Automatic retry-after support

## Installation

```bash
npm install @weather-apps/ai-services
```

## Usage

### Basic Setup

```typescript
import { SecureAIClient } from '@weather-apps/ai-services';

const aiClient = new SecureAIClient({
  proxyEndpoint: '/api/gemini',
  timeout: 30000, // 30 seconds
});
```

### Generate Advice

```typescript
try {
  const advice = await aiClient.generateAdvice({
    hourlyData: [...],
    dryingWindow: {...},
    currentTime: '14:30',
    sunset: '20:15',
    forecastData: [...]
  });

  console.log(advice); // "Conditions are perfect for drying..."
} catch (error) {
  if (SecureAIClient.isQuotaError(error)) {
    // Graceful degradation - show weather data only
    console.log('AI advice temporarily unavailable');
  } else if (SecureAIClient.isRateLimitError(error)) {
    // Show rate limit message with retry time
    console.log(`Rate limited. Retry in ${error.retryAfter}s`);
  } else {
    console.error('AI service error:', error.message);
  }
}
```

### Validate Location

```typescript
const result = await aiClient.validateLocation('Londn'); // Typo

console.log(result);
// {
//   isValid: true,
//   isAbusive: false,
//   suggestion: "London",
//   confidence: 95,
//   reason: "Minor spelling correction"
// }
```

### Get Place Name

```typescript
const placeName = await aiClient.getPlaceName(51.5074, -0.1278);
console.log(placeName); // "London"
```

## Custom Prompts

You can use the prompt generators directly:

```typescript
import { generateDryingAdvicePrompt, generateBurningAdvicePrompt } from '@weather-apps/ai-services/prompts';

const dryingPrompt = generateDryingAdvicePrompt({
  hourlyData: [...],
  dryingWindow: {...},
  currentTime: '14:30',
  sunset: '20:15'
});

// Use with your own AI service
const response = await yourAIService.generate(dryingPrompt);
```

## Error Handling

```typescript
import { AIServiceError, RateLimitError } from '@weather-apps/ai-services';

try {
  const advice = await aiClient.generateAdvice(params);
} catch (error) {
  if (error instanceof RateLimitError) {
    // Handle rate limiting
    console.log(`Retry after ${error.retryAfter} seconds`);
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: error.retryAfter
    });
  } else if (error instanceof AIServiceError) {
    // Handle AI service errors
    if (error.isQuotaError) {
      // Graceful degradation
      res.status(503).json({
        error: 'AI temporarily unavailable',
        weatherDataStillAvailable: true
      });
    } else {
      res.status(error.statusCode || 500).json({
        error: error.message
      });
    }
  }
}
```

## API Reference

### SecureAIClient

**Constructor:**
```typescript
new SecureAIClient(config: AIClientConfig)
```

**Methods:**
- `generateAdvice(params: AdviceParams): Promise<string>` - Generate comprehensive advice
- `validateLocation(input: string): Promise<LocationValidationResult>` - Validate location
- `getPlaceName(lat: number, lon: number): Promise<string>` - Reverse geocoding

**Static Methods:**
- `isQuotaError(error: any): boolean` - Check if quota error
- `isRateLimitError(error: any): boolean` - Check if rate limit error

### Prompt Generators

- `generateDryingAdvicePrompt(params: AdviceParams): string` - Laundry drying
- `generateBurningAdvicePrompt(params: AdviceParams): string` - Wood burner
- `generateLocationValidationPrompt(input: string): string` - Location validation
- `generatePlaceNamePrompt(lat: number, lon: number): string` - Reverse geocoding

## Integration with Serverless Function

The client works with serverless functions like this:

```typescript
// /api/gemini.ts (Vercel serverless function)
import { GoogleGenAI } from '@google/genai';
import { generateDryingAdvicePrompt } from '@weather-apps/ai-services/prompts';

export default async function handler(req, res) {
  const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const prompt = generateDryingAdvicePrompt(req.body.weatherData);

  const result = await genAI.models.generateContent({
    model: 'gemini-2.5-flash-lite',
    contents: prompt,
  });

  res.json({
    success: true,
    text: result.candidates[0].content.parts[0].text
  });
}
```

## Testing

```bash
npm test
```

## License

MIT
