'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import Editor from '@monaco-editor/react';
import Spinner from '../spinner';

type JsonPrimitive = string | number | boolean | null;
type JsonObject = { [key: string]: JsonValue };
type JsonArray = JsonValue[];
type JsonValue = JsonPrimitive | JsonObject | JsonArray;

interface ApiResponse {
  stdout: string;
  result?: JsonValue;
  error?: string;
}

const defaultScriptCode = `import pandas as pd

# Script Mode - Direct execution without main() wrapper
print("Hello from Script Mode!")
data = {'name': ['Alice', 'Bob', 'Charlie'], 'score': [95, 87, 92]}
df = pd.DataFrame(data)
print("DataFrame:")
print(df)
print(f"\\nHighest score: {df['score'].max()}")`;

const defaultFunctionCode = `import pandas as pd

# Function Mode - Code wrapped in main() function
print("Hello from Function Mode!")
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

const prepareCodeForExecution = (userCode: string, mode: ExecutionMode): string => {
  if (mode === 'script') {
    return userCode;
  }
  return wrapCodeInMainFunction(userCode);
};

type ExecutionMode = 'script' | 'function';

export default function EditorPage() {
  const [userCode, setUserCode] = useState<string>(defaultFunctionCode);
  const [executionMode, setExecutionMode] = useState<ExecutionMode>('function');
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [hasUserEdited, setHasUserEdited] = useState<boolean>(false);
  const [editorInstance, setEditorInstance] = useState<any | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const handleModeChange = (newMode: ExecutionMode) => {
    if (!hasUserEdited) {
      // If user hasn't edited, load appropriate default snippet
      setUserCode(newMode === 'script' ? defaultScriptCode : defaultFunctionCode);
    }
    setExecutionMode(newMode);
  };

  const handleUndo = () => {
    if (editorInstance) {
      editorInstance.trigger('keyboard', 'undo', null);
    }
  };

  const handleRedo = () => {
    if (editorInstance) {
      editorInstance.trigger('keyboard', 'redo', null);
    }
  };

  const handleEditorDidMount = (editor: any) => {
    setEditorInstance(editor);
  };

  const handleCodeChange = (value: string | undefined) => {
    const code = value || '';
    setUserCode(code);
    if (!hasUserEdited && code !== defaultFunctionCode && code !== defaultScriptCode) {
      setHasUserEdited(true);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // If currently loading, cancel the execution
    if (isLoading && abortController) {
      abortController.abort();
      setAbortController(null);
      setIsLoading(false);
      setNetworkError("Execution cancelled by user.");
      return;
    }

    if (!userCode.trim()) {
      setNetworkError("Please enter some Python code to execute.");
      setApiResponse(null);
      return;
    }

    setIsLoading(true);
    setNetworkError(null);
    setApiResponse(null);

    // Auto-detect API URL: prioritize localhost for local development
    let apiUrl: string;

    // Check if we're running locally first
    const isLocalDev = typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' ||
       window.location.hostname === '127.0.0.1' ||
       window.location.hostname.includes('.local'));

    if (isLocalDev) {
      // Local development - always use localhost
      apiUrl = 'http://localhost:5000/execute';
      console.log('🔧 Using local API:', apiUrl);
    } else {
      // Production - use .env or show error
      apiUrl = process.env.NEXT_PUBLIC_FLASK_API_URL + '/execute';
      if (!apiUrl) {
        setNetworkError('API URL not configured. For production, set NEXT_PUBLIC_FLASK_API_URL in your .env file.');
        setIsLoading(false);
        return;
      }
      console.log('🌐 Using production API:', apiUrl);
    }

    const scriptToSend = prepareCodeForExecution(userCode, executionMode);
    const controller = new AbortController();
    setAbortController(controller);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ script: scriptToSend }),
        signal: controller.signal,
      });
      const data: ApiResponse = await response.json();
      if (!response.ok) {
        const errorMessage = `API Error (Status ${response.status}): ${data.error || response.statusText || 'Unknown API error'}`;
        setApiResponse(data);
        setNetworkError(errorMessage);
        return;
      }
      setApiResponse(data);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // User cancelled the execution - this is expected behavior
        setNetworkError("Execution cancelled by user.");
      } else {
        console.error("Fetch/Network error:", err);
        if (err instanceof Error) {
          setNetworkError(err.message || 'Failed to connect or parse response.');
        } else {
          setNetworkError(String(err) || 'An unknown error occurred.');
        }
      }
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-900 text-slate-100 font-sans">
      {/* Header */}
      <header className="w-full border-b border-slate-800 px-6 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-slate-400 hover:text-white transition-colors">
              ← Back to Home
            </Link>
            <div className="text-sm text-slate-500">
              {executionMode === 'function' ? 'Function Mode (main() wrapper)' : 'Script Mode (direct execution)'}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-slate-400">Mode:</span>
            <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
              <button
                type="button"
                onClick={() => handleModeChange('script')}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  executionMode === 'script'
                    ? 'bg-violet-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Script
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('function')}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  executionMode === 'function'
                    ? 'bg-violet-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Function
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content - Side by side layout */}
      <main className="flex flex-grow overflow-hidden px-4 py-4 gap-4">
        {/* Left Column: Code Editor */}
        <section className="w-[60%] md:w-[65%] flex flex-col h-full">
          <div className="flex flex-col h-full relative">
            <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden shadow-2xl flex flex-col h-full">
              {/* Header */}
              <div className="p-4 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/80 to-slate-900/80 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <h2 className="text-lg font-bold text-slate-200">Python Code Editor</h2>
                </div>
                <div className="flex items-center space-x-2">
                  {/* Undo Button */}
                  <button
                    type="button"
                    onClick={handleUndo}
                    className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white font-bold p-3 rounded-xl shadow-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-900"
                    title="Undo"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  {/* Run/Stop Button */}
                  <button
                    type="submit"
                    form="code-form"
                    className={`font-bold p-3 rounded-xl shadow-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                      isLoading
                        ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white focus:ring-red-400'
                        : 'bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white focus:ring-violet-400'
                    }`}
                    title={isLoading ? "Stop Execution" : "Run Code"}
                  >
                    {isLoading ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    )}
                  </button>

                  {/* Redo Button */}
                  <button
                    type="button"
                    onClick={handleRedo}
                    className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white font-bold p-3 rounded-xl shadow-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-900"
                    title="Redo"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Editor Content */}
              <form id="code-form" onSubmit={handleSubmit} className="flex-grow flex flex-col">
                <div className="flex-grow p-4">
                  <Editor
                    height="100%"
                    language="python"
                    value={userCode}
                    onChange={handleCodeChange}
                    onMount={handleEditorDidMount}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: true },
                      fontSize: 14,
                      lineNumbers: 'on',
                      roundedSelection: false,
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      tabSize: 4,
                      insertSpaces: true,
                      wordWrap: 'on',
                      folding: true,
                      lineDecorationsWidth: 10,
                      lineNumbersMinChars: 3,
                      renderWhitespace: 'selection',
                      bracketPairColorization: { enabled: true },
                      guides: {
                        bracketPairs: true,
                        indentation: true
                      }
                    }}
                    loading={
                      <div className="flex items-center justify-center h-full text-slate-400">
                        <Spinner size="w-6 h-6 mr-2" />
                        Loading editor...
                      </div>
                    }
                  />
                </div>
              </form>
            </div>
          </div>
        </section>

        {/* Right Column: Execution Output */}
        <section className="w-[40%] md:w-[35%] flex flex-col h-full">
          <div className="flex flex-col h-full relative transform transition-transform duration-300 hover:scale-[1.02]">
            <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden shadow-2xl flex flex-col h-full">
              {/* Header */}
              <div className="p-4 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/80 to-slate-900/80 flex-shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                  <h2 className="text-lg font-bold text-slate-200">Execution Output</h2>
                </div>
              </div>

              {/* Output Content */}
              <div className="flex-grow p-4 overflow-hidden">
                <div className="h-full space-y-4 overflow-y-auto custom-scrollbar">
                  {/* Supported Libraries Info */}
                  <div className="bg-slate-700/30 rounded-lg p-3 border border-slate-600/50">
                    <h4 className="text-sm font-semibold text-slate-200 mb-2">📚 Supported Libraries</h4>
                    <div className="text-xs text-slate-300 space-y-1">
                      <div><strong>Data Science:</strong> pandas, numpy, scipy</div>
                      <div><strong>Visualization:</strong> matplotlib, seaborn, plotly</div>
                      <div><strong>Image Processing:</strong> pillow</div>
                      <div><strong>NLP:</strong> nltk</div>
                      <div><strong>Web:</strong> requests, beautifulsoup4, lxml</div>
                      <div><strong>Data Formats:</strong> openpyxl, xlrd</div>
                      <div><strong>Standard Library:</strong> json, os, sys, math, random, datetime, re</div>
                    </div>
                  </div>

                  {isLoading && !apiResponse && !networkError && (
                    <div className="flex items-center justify-center h-full text-slate-400">
                      <Spinner size="w-8 h-8" />
                      <p className="mt-2 text-sm">Executing code...</p>
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
                          <h3 className="text-lg font-medium text-slate-300 mb-1">
                            Result {executionMode === 'function' ? '(from main()):' : '(script output):'}
                          </h3>
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
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
