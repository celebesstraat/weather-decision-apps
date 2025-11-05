
import React from 'react';

const Loader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      {/* Loading message */}
      <div className="bg-white/90 rounded-2xl p-6 shadow-lg border border-blue-200/50 max-w-md">
        <p className="text-lg font-bold text-slate-800 mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
          Checking the weather...
        </p>
        <p className="text-sm text-slate-600 leading-relaxed">
          Analyzing humidity, wind patterns, and sunshine to give you the best laundry advice!
        </p>
      </div>

      {/* Modern loading indicator */}
      <div className="mt-6 flex items-center gap-3">
        <div className="w-6 h-6 bg-blue-500 rounded-full animate-bouncy-dot"></div>
        <div className="w-6 h-6 bg-blue-500 rounded-full animate-bouncy-dot" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-6 h-6 bg-blue-500 rounded-full animate-bouncy-dot" style={{ animationDelay: '0.4s' }}></div>
      </div>

      <style>{`
        @keyframes bouncy-dot {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 1;
          }
          30% {
            transform: translateY(-10px);
            opacity: 0.7;
          }
        }

        .animate-bouncy-dot {
          animation: bouncy-dot 0.7s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Loader;
