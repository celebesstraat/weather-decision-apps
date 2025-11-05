import React, { useState } from 'react';
import { diagnoseWeatherService } from '../services/weatherService';

interface ErrorDisplayProps {
  message: string;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message }) => {
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [diagnostics, setDiagnostics] = useState<{
    status: string;
    details: string[];
    errors: string[];
  } | null>(null);
  const [runningDiagnostics, setRunningDiagnostics] = useState(false);

  const runDiagnostics = async () => {
    setRunningDiagnostics(true);
    try {
      const result = await diagnoseWeatherService();
      setDiagnostics(result);
      setShowDiagnostics(true);
    } catch (error) {
      console.error('Diagnostics failed:', error);
      setDiagnostics({
        status: 'unavailable',
        details: ['Diagnostics test failed'],
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
      setShowDiagnostics(true);
    }
    setRunningDiagnostics(false);
  };

  return (
    <div className="text-center bg-red-100/80 backdrop-blur-sm p-4 rounded-2xl mt-6 max-w-xl mx-auto">
      <div className="text-red-600 mb-3">
        <p className="font-medium">{message}</p>
      </div>
      
      <button 
        onClick={runDiagnostics}
        disabled={runningDiagnostics}
        className="text-sm text-red-800 underline hover:no-underline disabled:opacity-50"
      >
        {runningDiagnostics ? 'Running diagnostics...' : 'Run diagnostics'}
      </button>
      
      {showDiagnostics && diagnostics && (
        <div className="mt-4 p-3 bg-white/50 rounded-lg text-left">
          <h4 className="font-medium text-red-800 mb-2">Diagnostic Results</h4>
          <div className="text-sm text-red-700 space-y-1">
            <p><strong>Status:</strong> {diagnostics.status}</p>
            
            {diagnostics.details.map((detail, index) => (
              <p key={`detail-${index}`} className="text-gray-700">{detail}</p>
            ))}
            
            {diagnostics.errors.map((error, index) => (
              <p key={`error-${index}`} className="text-red-600">{error}</p>
            ))}
          </div>
          
          <button 
            onClick={() => setShowDiagnostics(false)}
            className="mt-2 text-xs text-red-700 underline hover:no-underline"
          >
            Hide diagnostics
          </button>
        </div>
      )}
      
      <div className="mt-3 text-xs text-red-500">
        If this error persists, please try again later or check your internet connection.
      </div>
    </div>
  );
};

export default ErrorDisplay;
