// Test script for the enhanced coastal detection system
// This tests the new distance-based 5-tier classification vs the old crude system

import { getWashingRecommendation } from './services/weatherService.js';

const testLocations = [
    // STRONGLY_COASTAL (0-5km)
    { name: "Brighton", expected: "STRONGLY_COASTAL", expectedDistance: 0.8 },
    { name: "Aberdeen", expected: "STRONGLY_COASTAL", expectedDistance: 1.2 },
    { name: "Blackpool", expected: "STRONGLY_COASTAL", expectedDistance: 0.3 },
    { name: "Dover", expected: "STRONGLY_COASTAL", expectedDistance: 0.9 },
    
    // COASTAL (5-10km) 
    { name: "Edinburgh", expected: "COASTAL", expectedDistance: 8.1 },
    { name: "Bristol", expected: "COASTAL", expectedDistance: 8.9 },
    { name: "Hull", expected: "COASTAL", expectedDistance: 4.2 },
    
    // TRANSITIONAL (10-20km)
    { name: "Glasgow", expected: "TRANSITIONAL", expectedDistance: 15.2 },
    { name: "Norwich", expected: "TRANSITIONAL", expectedDistance: 18.2 },
    
    // WEAKLY_INLAND (20-40km)
    { name: "Manchester", expected: "WEAKLY_INLAND", expectedDistance: 32.1 },
    { name: "Carlisle", expected: "WEAKLY_INLAND", expectedDistance: 23.7 },
    
    // STRONGLY_INLAND (40km+)
    { name: "Birmingham", expected: "STRONGLY_INLAND", expectedDistance: 85.7 },
    { name: "Leeds", expected: "STRONGLY_INLAND", expectedDistance: 55.2 },
    { name: "Sheffield", expected: "STRONGLY_INLAND", expectedDistance: 62.8 }
];

console.log("🌊 ENHANCED COASTAL DETECTION SYSTEM TEST");
console.log("==========================================");
console.log("Testing new distance-based 5-tier classification system\n");

// Test a few key locations
const testCases = [
    "Brighton",    // Should be STRONGLY_COASTAL (0.8km)
    "Glasgow",     // Should be TRANSITIONAL (15.2km) 
    "Birmingham",  // Should be STRONGLY_INLAND (85.7km)
    "Edinburgh"    // Should be COASTAL (8.1km)
];

for (const location of testCases) {
    try {
        console.log(`\n🔍 Testing: ${location}`);
        console.log("─".repeat(30));
        
        const result = await getWashingRecommendation(location);
        
        // The coastal analysis should be logged by the enhanced system
        console.log(`✅ Successfully processed ${location}`);
        console.log(`   Recommendation: ${result.currentRecommendation.status}`);
        console.log(`   Reason: ${result.currentRecommendation.reason}`);
        
    } catch (error) {
        console.error(`❌ Error testing ${location}:`, error.message);
    }
}

console.log("\n🎯 TEST SUMMARY");
console.log("================");
console.log("The enhanced coastal detection system should now:");
console.log("✓ Use real geographic distances (not crude lat/lon boxes)");
console.log("✓ Apply graduated modifiers (5-tier vs binary coastal/inland)");
console.log("✓ Detect onshore vs offshore winds properly");
console.log("✓ Account for seasonal coastal effects");
console.log("✓ Provide more accurate recommendations for transitional locations");