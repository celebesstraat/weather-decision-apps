import React, { useState, useEffect } from 'react';
import type { Recommendation, DryingScore, HourlyForecast } from '../types';
import { RecommendationStatus } from '../types';
import Character from './Character';
import { generateTodayDryingAdvice } from '../services/geminiService';

interface TodayCompactPanelProps {
    recommendation: Recommendation;
    location: string;
    hourlyScores?: DryingScore[];
    hourlyData?: HourlyForecast[];
    astronomy?: {
        sunrise: string;
        sunset: string;
        sunriseDecimal: number;
        sunsetDecimal: number;
    };
}

// Status configurations matching ShortTermForecast patterns
const statusConfig: Record<RecommendationStatus, { 
    bgColor: string; 
    textColor: string; 
    label: string;
    borderColor: string;
}> = {
    [RecommendationStatus.GET_THE_WASHING_OUT]: {
        bgColor: 'bg-green-50/80',
        borderColor: 'border-green-200',
        textColor: 'text-green-800',
        label: 'Get The Washing Out'
    },
    [RecommendationStatus.ACCEPTABLE_CONDITIONS]: {
        bgColor: 'bg-amber-50/80',
        borderColor: 'border-amber-200',
        textColor: 'text-amber-800',
        label: 'Acceptable Conditions'
    },
    [RecommendationStatus.INDOOR_DRYING_ONLY]: {
        bgColor: 'bg-red-50/80',
        borderColor: 'border-red-200',
        textColor: 'text-red-800',
        label: 'Indoor Drying Only'
    },
};

const TodayCompactPanel: React.FC<TodayCompactPanelProps> = ({
    recommendation,
    location,
    hourlyScores,
    hourlyData,
    astronomy
}) => {
    const config = statusConfig[recommendation.status];
    const [aiAdvice, setAiAdvice] = useState<string>("");
    const [isLoadingAdvice, setIsLoadingAdvice] = useState<boolean>(false);

    // Get current time windows from recommendation
    const timeWindow = recommendation.dryingWindow ?
        `${recommendation.dryingWindow.startTime} - ${recommendation.dryingWindow.endTime}` :
        (recommendation.timeWindow && recommendation.timeWindow !== 'N/A') ? recommendation.timeWindow : null;

    // Generate AI advice when component mounts or location/recommendation changes
    useEffect(() => {
        const fetchAIAdvice = async () => {
            if (!hourlyData || hourlyData.length === 0) {
                return;
            }

            setIsLoadingAdvice(true);

            try {
                const currentTime = new Date().toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                });

                const sunset = astronomy?.sunset || "20:00";

                // Filter to ONLY daylight hours for AI advice - no point mentioning 4am in winter!
                const startHour = astronomy ? Math.floor(astronomy.sunriseDecimal) : 6;
                const endHour = astronomy ? Math.floor(astronomy.sunsetDecimal) : 20;

                const daylightHourlyData = hourlyData
                    .map((h, idx) => ({
                        time: h.time,
                        temperature: h.temperature,
                        humidity: h.humidity,
                        rainChance: h.rainChance,
                        windSpeed: h.windSpeed,
                        uvIndex: h.uvIndex,
                        dewPoint: h.dewPoint,
                        dryingScore: hourlyScores?.[idx]?.totalScore || 0,
                        suitable: hourlyScores?.[idx]?.suitable || false,
                        hour: idx
                    }))
                    .filter(h => h.hour >= startHour && h.hour <= endHour);

                const advice = await generateTodayDryingAdvice(
                    daylightHourlyData,
                    recommendation.dryingWindow,
                    currentTime,
                    sunset
                );

                setAiAdvice(advice);
            } catch (error) {
                console.error("Error fetching AI advice:", error);
                setAiAdvice("");
            } finally {
                setIsLoadingAdvice(false);
            }
        };

        fetchAIAdvice();
    }, [location, recommendation.status, hourlyData, astronomy?.sunset, recommendation.dryingWindow]);
    
    return (
        <div className="bg-white/90 backdrop-blur-2xl p-6 rounded-3xl shadow-xl border border-slate-200/50">
            <h2 className="text-2xl font-bold text-slate-800 mb-4" style={{ fontFamily: 'Nunito, sans-serif' }}>
                Drying Conditions for Rest of Today in {location}
            </h2>
            
            <div className={`${config.bgColor} ${config.borderColor} border rounded-2xl p-5 shadow-sm`}>
                {/* Header row with main status */}
                <div className="flex items-center mb-4">
                    <div className="flex items-center gap-4">
                        <Character status={recommendation.status} size="small" animate={false} />
                    </div>
                    
                    {/* Square advice tag - truly centered within pane for maximum impact */}
                    <div className="flex-1 flex justify-center">
                        <div className={`w-64 h-32 rounded-lg font-bold border-2 shadow-lg flex items-center justify-center text-center leading-tight px-4 ${
                            recommendation.status === RecommendationStatus.GET_THE_WASHING_OUT ? 'bg-green-600 text-white shadow-green-500/50 border-green-700' :
                            'bg-red-600 text-white shadow-red-500/50 border-red-700'
                        }`} style={{ fontSize: '32px' }}>
                            {config.label}
                        </div>
                    </div>
                </div>
                
                {/* Time window display */}
                {timeWindow && (
                    <div className="text-center mb-4">
                        <div className={`text-2xl font-bold ${config.textColor} mb-1`}>
                            {timeWindow}
                        </div>
                        <p className="text-sm text-slate-600">
                            Optimal drying time remaining today
                        </p>
                    </div>
                )}

                {/* AI-Generated Advice Section */}
                {(aiAdvice || isLoadingAdvice) && (
                    <div className="mt-4 pt-4 border-t border-slate-200/50">
                        <div className="flex items-start gap-2">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                                AI
                            </div>
                            <div className="flex-1">
                                {isLoadingAdvice ? (
                                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                                        <div className="animate-pulse">Generating smart advice...</div>
                                    </div>
                                ) : (
                                    <p className="text-slate-700 text-base leading-relaxed" style={{ fontFamily: 'Nunito, sans-serif' }}>
                                        {aiAdvice}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TodayCompactPanel;