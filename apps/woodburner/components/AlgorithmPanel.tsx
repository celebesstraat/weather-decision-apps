
import React, { useState } from 'react';
import ChartBarIcon from './icons/ChartBarIcon';
import SparklesIcon from './icons/SparklesIcon';

const AlgorithmPanel: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white/20 backdrop-blur-2xl p-6 rounded-3xl shadow-xl h-full">
      <h3 className="text-2xl font-bold text-slate-700 mb-1 flex items-center">
        <SparklesIcon className="w-6 h-6 mr-2 text-cyan-600" />
        DryCast!
      </h3>
      <p className="text-sm text-slate-600 font-medium mb-4 italic">Powered by our DryCast Algorithm</p>

      <div className="space-y-4 text-slate-700">
        <p>
          Our DryCast algorithm provides pinpoint accuracy by analyzing weather conditions specifically optimized for the UK's temperate maritime climate. We understand that in Britain's high-humidity environment, wind becomes the critical factor that makes or breaks a good drying day.
        </p>

        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-left p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-200 border border-white/20 hover:border-white/40"
        >
          <span className="font-semibold text-slate-700">
            {isExpanded ? 'Hide Details' : 'Click for Details'}
          </span>
          <ChartBarIcon 
            className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
          />
        </button>

        {isExpanded && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div>
              <h4 className="font-bold flex items-center mb-3">
                How It Works
              </h4>
              <ul className="list-disc list-inside space-y-3 pl-2 text-sm">
                <li>
                  <span className="font-semibold">Climate-Tuned Scoring:</span> Our algorithm is specifically calibrated for UK conditions, where humidity runs consistently high (60-95%). Wind speed gets equal priority with humidity (30% each), recognizing that a good breeze is often the difference between success and soggy laundry.
                </li>
                <li>
                  <span className="font-semibold">Temperature Optimization:</span> Unlike generic weather apps, we know that 15-25°C is your sweet spot, with peak drying at 20°C. Anything below 5°C or above 30°C gets heavily penalized - because we understand British weather realities.
                </li>
                <li>
                  <span className="font-semibold">Sophisticated Wind Analysis:</span> We don't just look at "windy" or "calm". Our algorithm recognizes that 3-15km/h is your optimal range, accounts for the frequent breezes that help overcome high humidity, and warns against winds over 30km/h that might damage clothes.
                </li>
                <li>
                  <span className="font-semibold">Strict Rain Policy:</span> Any rainfall, no matter how light, instantly disqualifies an hour. In Britain's changeable weather, we take no chances with precipitation.
                </li>
                <li>
                  <span className="font-semibold">DryCast Windows:</span> We identify continuous 2+ hour blocks of optimal conditions (60%+ scores), then rank them by quality. You get the longest, most reliable period for hanging out washing - not just scattered good hours.
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlgorithmPanel;
