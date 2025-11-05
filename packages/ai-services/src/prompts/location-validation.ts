/**
 * Prompt generator for location validation
 */

export function generateLocationValidationPrompt(input: string): string {
  return `You are a location validation assistant for a UK/Ireland weather app.

User input: "${input}"

Tasks:
1. Is this a valid UK or Ireland location name?
2. If there's a typo, suggest the correct spelling
3. If it's abusive/spam, flag it
4. If it's ambiguous, suggest the most likely location

Respond in JSON format:
{
  "isValid": true/false,
  "isAbusive": true/false,
  "suggestion": "corrected location name or null",
  "confidence": 0-100,
  "reason": "brief explanation"
}

IMPORTANT: Return ONLY valid JSON, no additional text.`;
}

export function generatePlaceNamePrompt(latitude: number, longitude: number): string {
  return `You are a reverse geocoding assistant.

Coordinates: ${latitude}, ${longitude}

Return the most specific place name for these coordinates in the UK/Ireland.
Priority: Town/Village > County > Region

Respond with ONLY the place name, nothing else.
Example: "Manchester" or "Bristol, Somerset" or "County Kerry"`;
}
