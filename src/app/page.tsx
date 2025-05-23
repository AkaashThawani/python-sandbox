'use client';

import { useState, FormEvent } from 'react';
import Spinner from './spinner'; // Adjusted path as per your last message

interface ApiResponse {
  stdout: string;
  result?: any;
  error?: string;
}

const defaultUserCodePlaceholder = `import pandas as pd

# Your Python code here...
print("Analyzing data...")
data = {'col1': [1, 2, 3], 'col2': ['A', 'B', 'C']}
df = pd.DataFrame(data)
print(df.head())

# Return a JSON-serializable dictionary for the 'Result' section
return {"data_shape": df.shape, "columns": df.columns.tolist()}`;

const wrapCodeInMainFunction = (userCode: string): string => {
  const trimmedCode = userCode.trim();
  if (!trimmedCode) return "def main():\n    pass\n";
  const lines = trimmedCode.split('\n');
  const indentedLines = lines.map(line => `    ${line}`).join('\n');
  return `def main():\n${indentedLines}\n`;
};

export default function Home() {
  const [userCode, setUserCode] = useState<string>(defaultUserCodePlaceholder);
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [networkError, setNetworkError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userCode.trim()) {
      setNetworkError("Please enter some Python code to execute.");
      setApiResponse(null);
      return;
    }
    setIsLoading(true);
    setNetworkError(null);
    setApiResponse(null);

    const apiUrl = process.env.NEXT_PUBLIC_FLASK_API_URL;
    if (!apiUrl) {
      setNetworkError("API URL is not configured. Please set NEXT_PUBLIC_FLASK_API_URL.");
      setIsLoading(false);
      return;
    }

    const scriptToSend = wrapCodeInMainFunction(userCode);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ script: scriptToSend }),
      });
      const data: ApiResponse = await response.json();
      if (!response.ok) {
        let errorMessage = `API Error (Status ${response.status}): ${data.error || response.statusText || 'Unknown API error'}`;
        setApiResponse(data); 
        setNetworkError(errorMessage);
        return;
      }
      setApiResponse(data);
    } catch (err: any) {
      setNetworkError(err.message || 'Failed to connect or parse response.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Removed min-h-screen to allow content to define height, added flex-col for overall structure
    <div className="h-screen flex flex-col bg-slate-900 text-slate-100 p-4 md:p-6 font-sans">
      <header className="w-full mx-auto text-center py-4 md:py-6 shrink-0"> {/* Added mx-auto and shrink-0 */}
        <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-400">
          Python Sandbox
        </h1>
        <p className="mt-2 text-sm md:text-base  max-w-2xl mx-auto">
         Securely run Python snippets with pandas & numpy. More libraries and features coming soon! Your code is wrapped in main().
        </p>
      </header>

      {/* Main content area now takes remaining height */}
      <main className="w-full max-w-7xl mx-auto flex flex-col md:flex-row md:space-x-6 space-y-6 md:space-y-0 flex-grow overflow-hidden"> {/* Added mx-auto, flex-grow, overflow-hidden */}
        
        {/* Left Column: Code Input and Controls - Takes full available height */}
        <section className="md:w-1/2 bg-slate-800/70 backdrop-blur-md shadow-2xl rounded-xl p-6 border border-slate-700 flex flex-col h-full">
          <form onSubmit={handleSubmit} className="space-y-4 flex-grow flex flex-col"> {/* Reduced space-y */}
            <div className="flex-grow flex flex-col"> {/* This div will make textarea grow */}
              <label htmlFor="userCode" className="block text-sm font-semibold text-slate-300 mb-2 shrink-0">
                Python Code Editor
              </label>
              <div className="relative group flex-grow"> {/* Textarea wrapper takes remaining space */}
                <textarea
                  id="userCode"
                  aria-label="Python code input area"
                  value={userCode}
                  onChange={(e) => setUserCode(e.target.value)}
                  className="w-full h-full p-4 bg-slate-900 border border-slate-700 rounded-lg shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-slate-50 font-mono text-sm transition-colors duration-150 placeholder-slate-500 resize-none"
                />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button 
                    type="button" 
                    onClick={() => setUserCode('')}
                    className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded text-slate-300"
                    title="Clear code"
                    aria-label="Clear code input"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md transition-all duration-150 ease-in-out transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 focus:ring-offset-slate-900 shrink-0"
            >
              {isLoading ? (
                <>
                  <Spinner size="w-5 h-5 mr-2" />
                  Executing...
                </>
              ) : (
                'Run Script'
              )}
            </button>
          </form>
        </section>

        {/* Right Column: Output Area - Also takes full available height */}
        <section className="md:w-1/2 bg-slate-800/70 backdrop-blur-md shadow-2xl rounded-xl p-6 border border-slate-700 flex flex-col h-full overflow-hidden"> {/* Added overflow-hidden */}
          <h2 className="text-xl md:text-2xl font-semibold text-slate-200 border-b border-slate-700 pb-3 mb-4 shrink-0">
            Execution Output
          </h2>
          
          <div className="flex-grow space-y-4 overflow-y-auto pr-2 custom-scrollbar">
            {isLoading && !apiResponse && !networkError && (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <Spinner size="w-8 h-8" />
                <p className="mt-2 text-sm">Waiting for results...</p>
              </div>
            )}

            {networkError && !apiResponse?.error && (
              <div className="p-4 bg-red-900/50 border border-red-700 text-red-200 rounded-lg">
                <h3 className="font-bold text-md mb-1 text-red-100">Execution Error:</h3>
                <pre className="whitespace-pre-wrap break-words text-sm">{networkError}</pre>
              </div>
            )}

            {apiResponse && (
              <>
                {apiResponse.error && (
                  <div className="p-4 bg-amber-700/30 border border-amber-600 text-amber-200 rounded-lg">
                      <h3 className="font-bold text-md mb-1 text-amber-100">API Error:</h3>
                      <pre className="whitespace-pre-wrap break-words text-sm font-mono">{apiResponse.error}</pre>
                  </div>
                )}
                {apiResponse.stdout && (
                  <div>
                    <h3 className="text-lg font-medium text-slate-300 mb-1">Stdout:</h3>
                    <pre className="bg-black/60 p-3 rounded-md text-xs text-slate-300 whitespace-pre-wrap break-words overflow-x-auto max-h-60 shadow-inner">
                      {apiResponse.stdout || <span className="italic text-slate-500">No standard output.</span>}
                    </pre>
                  </div>
                )}
                {apiResponse.hasOwnProperty('result') && apiResponse.result !== null && apiResponse.result !== undefined && (
                  <div>
                    <h3 className="text-lg font-medium text-slate-300 mb-1">Result (from main()):</h3>
                    <pre className="bg-black/60 p-3 rounded-md text-xs text-emerald-400 whitespace-pre-wrap break-words overflow-x-auto max-h-60 shadow-inner">
                      {typeof apiResponse.result === 'object' 
                        ? JSON.stringify(apiResponse.result, null, 2) 
                        : String(apiResponse.result)}
                    </pre>
                  </div>
                )}
                {!apiResponse.error && !apiResponse.stdout && !(apiResponse.hasOwnProperty('result') && apiResponse.result !== null && apiResponse.result !== undefined) && !isLoading && (
                    <p className="text-slate-400 italic text-sm">Script executed with no output or result.</p>
                )}
              </>
            )}
            {!isLoading && !apiResponse && !networkError && (
                 <p className="text-slate-500 italic text-center py-10">Output will appear here after execution.</p>
            )}
          </div>
        </section>
      </main>
      

    </div>
  );
}