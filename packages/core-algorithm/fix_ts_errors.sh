#!/bin/bash
# Fix TypeScript strict mode errors

# Fix WeatherScorer.ts - add non-null assertions
sed -i 's/const currentHour = hourlyScores\[0\];/const currentHour = hourlyScores[0]!;/g' src/engine/WeatherScorer.ts
sed -i 's/protected collectWarnings(hourlyScores: ScoringResult\[\], location: Location)/protected collectWarnings(hourlyScores: ScoringResult[], _location: Location)/g' src/engine/WeatherScorer.ts

# Fix WindowDetector.ts
sed -i 's/qualifyingHours\.forEach((hour, i)/qualifyingHours.forEach((hour)/g' src/engine/WindowDetector.ts
sed -i 's/const lastHour = currentWindow\[currentWindow\.length - 1\];/const lastHour = currentWindow[currentWindow.length - 1]!;/g' src/engine/WindowDetector.ts
sed -i 's/currentWindow\.push(allHours\[j\]);/currentWindow.push(allHours[j]!);/g' src/engine/WindowDetector.ts
sed -i 's/const startTime = new Date(hours\[0\]\.timestamp);/const startTime = new Date(hours[0]!.timestamp);/g' src/engine/WindowDetector.ts
sed -i 's/const endTime = new Date(hours\[hours\.length - 1\]\.timestamp);/const endTime = new Date(hours[hours.length - 1]!.timestamp);/g' src/engine/WindowDetector.ts
sed -i 's/start: hours\[0\]\.timestamp,/start: hours[0]!.timestamp,/g' src/engine/WindowDetector.ts
sed -i 's/end: hours\[hours\.length - 1\]\.timestamp,/end: hours[hours.length - 1]!.timestamp,/g' src/engine/WindowDetector.ts
sed -i 's/let current = sorted\[0\];/let current = sorted[0]!;/g' src/engine/WindowDetector.ts
sed -i 's/const next = sorted\[i\];/const next = sorted[i]!;/g' src/engine/WindowDetector.ts
sed -i 's/return scored\[0\]\.window;/return scored[0]!.window;/g' src/engine/WindowDetector.ts

# Fix CoastalIntelligence.ts
sed -i 's/windDirection: number/\_windDirection: number/g' src/engine/CoastalIntelligence.ts

# Fix WindAnalyzer.ts
sed -i 's/return directions\[index\];/return directions[index]!;/g' src/engine/WindAnalyzer.ts

# Fix humidity.ts
sed -i 's/const MIN = 0;//g' src/normalization/humidity.ts

# Fix wind.ts (getCompassBearing)
sed -i 's|return directions\[index\];|return directions[index]!;|g' src/normalization/wind.ts

echo "Fixes applied"
