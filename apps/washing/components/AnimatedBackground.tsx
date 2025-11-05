import React from 'react';
import type { Recommendation } from '../types';
import { RecommendationStatus } from '../types';

interface AnimatedBackgroundProps {
    recommendation: Recommendation | null;
}

const SunnyScene: React.FC = () => (
    <div className="SunnyScene absolute inset-0 overflow-hidden bg-gradient-to-br from-sky-100 via-sky-200 to-blue-300">
        {/* Parallax background layer */}
        <div className="parallax-far">
            {/* Animated sun with rays */}
            <div className="sun">
                <div className="sun-rays"></div>
            </div>
            
            {/* Gentle clouds drifting */}
            <div className="cloud cloud-1 sunny"></div>
            <div className="cloud cloud-2 sunny"></div>
            <div className="cloud cloud-3 sunny"></div>
        </div>
        
        {/* Parallax foreground layer */}
        <div className="parallax-near">
            {/* Floating fabric particles in the breeze */}
            <div className="fabric-particles">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={`particle-${i}`} className={`fabric-particle particle-${i + 1}`}></div>
                ))}
            </div>
            
            {/* Enhanced washing line with cinematic perspective - positioned at 50% of page */}
            <div className="washing-line-container">
                <div className="washing-line">
                    <div className="line-post left"></div>
                    <div className="line-wire"></div>
                    <div className="line-post right"></div>
                    
                    {/* Six clothes with different shapes and pegs */}
                    <div className="cloth cloth-1">
                        <div className="cloth-highlight"></div>
                        <div className="peg peg-left"></div>
                        <div className="peg peg-right"></div>
                    </div>
                    <div className="cloth cloth-2">
                        <div className="cloth-highlight"></div>
                        <div className="peg peg-left"></div>
                        <div className="peg peg-right"></div>
                    </div>
                    <div className="cloth cloth-3">
                        <div className="cloth-highlight"></div>
                        <div className="peg peg-left"></div>
                        <div className="peg peg-right"></div>
                    </div>
                    <div className="cloth cloth-4">
                        <div className="cloth-highlight"></div>
                        <div className="peg peg-left"></div>
                        <div className="peg peg-right"></div>
                    </div>
                    <div className="cloth cloth-5 sock-shape">
                        <div className="cloth-highlight"></div>
                        <div className="peg peg-center"></div>
                    </div>
                    <div className="cloth cloth-6 towel-shape">
                        <div className="cloth-highlight"></div>
                        <div className="peg peg-left"></div>
                        <div className="peg peg-right"></div>
                    </div>
                </div>
            </div>
        </div>
        
        {/* Cinematic camera movement effect */}
        <div className="camera-movement"></div>
    </div>
);

const RainyScene: React.FC = () => {
    // Generate layered raindrops with varied effects
    const renderDrops = (count: number, className: string) => {
        return Array.from({ length: count }).map((_, i) => {
             const style = {
                left: `${Math.random() * 100}%`,
                animationDuration: `${0.6 + Math.random() * 0.8}s`,
                animationDelay: `${Math.random() * 3}s`,
            };
            return <div key={`${className}-${i}`} className={`raindrop ${className}`} style={style}></div>;
        });
    }

    // Generate splash effects
    const renderSplashes = (count: number) => {
        return Array.from({ length: count }).map((_, i) => {
            const style = {
                left: `${Math.random() * 100}%`,
                bottom: `${Math.random() * 10}%`,
                animationDelay: `${Math.random() * 4}s`,
            };
            return <div key={`splash-${i}`} className="water-splash" style={style}></div>;
        });
    }

    return (
        <div className="RainyScene absolute inset-0 overflow-hidden bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400">
            {/* Parallax background layer */}
            <div className="parallax-far">
                {/* Gentle rain clouds */}
                <div className="gentle-rain-clouds">
                    <div className="gentle-cloud cloud-1"></div>
                    <div className="gentle-cloud cloud-2"></div>
                    <div className="gentle-cloud cloud-3"></div>
                </div>
                
                {/* Distant gentle rain layers */}
                <div className="rain-layer-far">{renderDrops(25, 'far')}</div>
            </div>
            
            {/* Parallax foreground layer */}
            <div className="parallax-near">
                {/* Closer gentle rain layers */}
                <div className="rain-layer-mid">{renderDrops(20, 'mid')}</div>
                <div className="rain-layer-near">{renderDrops(15, 'near')}</div>
                
                {/* Gentle ground splashes */}
                <div className="ground-splash-layer">
                    {renderSplashes(8)}
                </div>
            </div>
            
            {/* Gentle rain overlay for cozy atmosphere */}
            <div className="gentle-rain-overlay"></div>
            
            {/* Softer camera movement effect */}
            <div className="camera-movement"></div>
        </div>
    );
};


const CloudyScene: React.FC = () => (
    <div className="CloudyScene absolute inset-0 overflow-hidden bg-gradient-to-br from-sky-300 via-gray-300 to-slate-400">
        {/* Parallax background layer */}
        <div className="parallax-far">
            {/* Partially hidden sun with soft rays */}
            <div className="partially-hidden-sun">
                <div className="weak-sun-rays"></div>
            </div>
            
            {/* Mixed cloud layers */}
            <div className="cloud cloud-1 large mixed"></div>
            <div className="cloud cloud-2 large mixed"></div>
            <div className="cloud cloud-3 large mixed"></div>
            <div className="cloud cloud-4 large mixed"></div>
        </div>
        
        {/* Parallax foreground layer */}
        <div className="parallax-near">
            {/* Gentle wind effect with leaves/particles */}
            <div className="wind-particles">
                {Array.from({ length: 12 }).map((_, i) => (
                    <div key={`wind-particle-${i}`} className={`wind-particle particle-${i + 1}`}></div>
                ))}
            </div>
            
            {/* Uncertain laundry - sometimes flapping, sometimes still */}
            <div className="uncertain-laundry">
                <div className="uncertain-cloth cloth-1">
                    <div className="cloth-shadow"></div>
                </div>
                <div className="uncertain-cloth cloth-2">
                    <div className="cloth-shadow"></div>
                </div>
                <div className="uncertain-cloth cloth-3">
                    <div className="cloth-shadow"></div>
                </div>
            </div>
            
            {/* Occasional light breeze indicator */}
            <div className="breeze-indicator">
                <div className="breeze-wave wave-1"></div>
                <div className="breeze-wave wave-2"></div>
                <div className="breeze-wave wave-3"></div>
            </div>
        </div>
        
        {/* Gentle swaying camera movement effect */}
        <div className="camera-movement"></div>
    </div>
);


const DefaultScene: React.FC = () => (
    <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-cyan-100 via-blue-200 to-purple-200">
    </div>
);


const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ recommendation }) => {
    // Debug logging to track recommendation status  
    console.log('AnimatedBackground received recommendation:', {
        status: recommendation?.status,
        timing: recommendation?.timing,
        reason: recommendation?.reason
    });
    
    let SceneComponent;
    switch (recommendation?.status) {
        case RecommendationStatus.GET_THE_WASHING_OUT:
            console.log('Showing SunnyScene for GET_THE_WASHING_OUT');
            SceneComponent = SunnyScene;
            break;
        case RecommendationStatus.ACCEPTABLE_CONDITIONS:
            console.log('Showing CloudyScene for ACCEPTABLE_CONDITIONS');
            SceneComponent = CloudyScene;
            break;
        case RecommendationStatus.INDOOR_DRYING_ONLY:
            console.log('Showing RainyScene for INDOOR_DRYING_ONLY');
            SceneComponent = RainyScene;
            break;
        default:
            console.log('Showing DefaultScene for unknown status:', recommendation?.status);
            SceneComponent = DefaultScene;
    }

    return (
        <div className="fixed inset-0 -z-10 transition-opacity duration-1000">
            <SceneComponent />
        </div>
    );
};

export default AnimatedBackground;