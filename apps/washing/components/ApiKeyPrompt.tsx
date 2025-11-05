import React from 'react';

const ApiKeyPrompt: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-slate-100">
      <div className="p-8 bg-white rounded-lg shadow-md max-w-md text-center">
        <h1 className="text-2xl font-bold text-slate-800 mb-4">Welcome to GetTheWashingOut!</h1>
        <p className="text-slate-600 mb-6">
          To get started, you need to add your Gemini API key.
        </p>
        <div className="text-left bg-slate-50 p-4 rounded-md border border-slate-200">
          <p className="font-semibold">Please follow these steps:</p>
          <ol className="list-decimal list-inside mt-2 text-sm text-slate-700">
            <li>Create a file named <code>.env.local</code> in the root of the project.</li>
            <li>Add the following line to the file:</li>
          </ol>
          <pre className="bg-slate-200 text-slate-800 p-2 rounded-md mt-2 text-sm">
            <code>VITE_GEMINI_API_KEY=YOUR_API_KEY_HERE</code>
          </pre>
          <p className="text-xs text-slate-500 mt-4">
            Replace <code>YOUR_API_KEY_HERE</code> with your actual Gemini API key.
          </p>
        </div>
        <p className="text-xs text-slate-400 mt-6">
          Once you've added the key, please restart the application.
        </p>
      </div>
    </div>
  );
};

export default ApiKeyPrompt;
