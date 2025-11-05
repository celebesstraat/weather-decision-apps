
import React from 'react';
import Character from './Character';
import { RecommendationStatus } from '../types';

const Loader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      {/* Animated Gusty McGhee character */}
      <div className="mb-4 animate-pulse">
        <Character status={RecommendationStatus.GET_THE_WASHING_OUT} size="large" animate={true} />
      </div>
      
      {/* Loading message with personality */}
      <div className="bg-white/90 rounded-2xl p-6 shadow-lg border border-blue-200/50 max-w-md">
        <div className="relative">
          {/* Speech bubble pointer */}
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-white"></div>
          
          <p className="text-lg font-bold text-slate-800 mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
            Gusty McGhee is checking the weather...
          </p>
          <p className="text-sm text-slate-600 leading-relaxed">
            Analyzing humidity, wind patterns, and sunshine to give you the best laundry advice!
          </p>
        </div>
      </div>

      {/* Modern loading indicator */}
      <div className="mt-6 flex items-center gap-2">
        <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
        <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-3 h-3 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
    </div>
  );
};

export default Loader;
