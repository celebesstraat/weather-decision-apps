# @weather-apps/security

Security utilities for the weather-decision app family.

## Features

- **Rate Limiting**: In-memory sliding window rate limiter
- **Input Validation**: XSS and SQL injection prevention
- **Coordinate Validation**: Geographic bounds checking
- **Sanitization**: Safe string cleaning

## Installation

```bash
npm install @weather-apps/security
```

## Usage

### Rate Limiting

```typescript
import { InMemoryLimiter } from '@weather-apps/security/rate-limiting';

const limiter = new InMemoryLimiter({
  maxRequests: 20,
  windowMs: 60000, // 1 minute
});

// Check if IP is within rate limit
if (!limiter.checkLimit(clientIP)) {
  return res.status(429).json({
    error: 'Rate limit exceeded',
    retryAfter: limiter.getSecondsUntilReset(clientIP),
  });
}

// Check remaining requests
const remaining = limiter.getRemainingRequests(clientIP);
console.log(`${remaining} requests remaining`);
```

### Input Validation

```typescript
import { InputValidator } from '@weather-apps/security/validation';

// Validate location input
const result = InputValidator.locationInput(userInput);
if (!result.valid) {
  return res.status(400).json({ error: result.error });
}
const cleanLocation = result.sanitized;

// Validate coordinates
const coordResult = InputValidator.coordinates(lat, lon);
if (!coordResult.valid) {
  return res.status(400).json({ error: coordResult.error });
}
const { latitude, longitude } = coordResult;

// Validate AI request
const aiResult = InputValidator.aiRequest(req.body);
if (!aiResult.valid) {
  return res.status(400).json({ error: aiResult.error });
}
```

## API Reference

### InMemoryLimiter

**Methods:**

- `checkLimit(identifier: string): boolean` - Check if request is allowed
- `getRemainingRequests(identifier: string): number` - Get remaining requests
- `getSecondsUntilReset(identifier: string): number` - Time until reset
- `reset(identifier: string): void` - Reset limit for identifier
- `resetAll(): void` - Clear all limits (testing only)

### InputValidator

**Static Methods:**

- `locationInput(input: string): ValidationResult` - Validate location string
- `coordinates(lat: number, lon: number): CoordinateValidation` - Validate coordinates
- `aiRequest(body: any): ValidationResult` - Validate AI API request
- `email(email: string): ValidationResult` - Validate email address
- `url(url: string): ValidationResult` - Validate URL (SSRF prevention)

## Security Best Practices

1. **Always validate user input** before processing
2. **Use rate limiting** on all public API endpoints
3. **Sanitize data** before storing or displaying
4. **Log security events** for monitoring
5. **Upgrade to distributed rate limiting** (Vercel KV) for production at scale

## Testing

```bash
npm test
```

## License

MIT
