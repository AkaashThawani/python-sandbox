'use client';

import React, { useState, FormEvent, useEffect } from 'react';
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
  visualizations?: Visualization[];
  performance?: PerformanceMetrics;
}

interface PerformanceMetrics {
  execution_time: number;
  cpu_time: number;
  memory_peak: number;
  memory_start: number;
  libraries_used: string[];
  code_lines: number;
  output_size: number;
  debug_info?: {
    psutil_available: boolean;
    script_lines: number;
    import_lines_found: number;
  };
}

interface Visualization {
  type: string;
  format: string;
  data: string;
  figure_number?: number;
}

interface DataFrameResult {
  _type: "dataframe";
  data: Record<string, unknown>[];
  columns: string[];
  index: unknown[];
  shape: [number, number];
  dtypes: Record<string, string>;
}

interface SeriesResult {
  _type: "series";
  data: Record<string, unknown>;
  name: string | null;
  dtype: string;
  index: unknown[];
}

interface ImageResult {
  _type: "image";
  format: string;
  data: string;
  size: [number, number];
  mode: string;
}

interface UnserializableResult {
  _type: "unserializable";
  value: string;
  type: string;
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

const analyzeTimeComplexity = (code: string): string => {
  const lines = code.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  let maxNesting = 0;
  let currentNesting = 0;
  let hasRecursion = false;
  let hasSorting = false;
  let hasSearching = false;

  // Keywords that indicate algorithmic complexity
  const complexityIndicators = {
    sorting: /\b(sort|sorted|heapq|bisect)\b/i,
    searching: /\b(binary.*search|linear.*search|find|index)\b/i,
    recursion: /\bdef\s+\w+.*:\s*$/m, // Function definitions (simplified recursion detection)
  };

  for (const line of lines) {
    // Count loop nesting
    if (line.includes('for ') || line.includes('while ')) {
      currentNesting++;
      maxNesting = Math.max(maxNesting, currentNesting);
    }

    // Check for loop endings
    if (line.trim() === '' || line.includes('#')) continue;

    // Detect sorting algorithms
    if (complexityIndicators.sorting.test(line)) {
      hasSorting = true;
    }

    // Detect searching algorithms
    if (complexityIndicators.searching.test(line)) {
      hasSearching = true;
    }

    // Simple recursion detection (function calls itself)
    if (complexityIndicators.recursion.test(code)) {
      // Check if function calls itself (very basic detection)
      const funcMatch = line.match(/def\s+(\w+)/);
      if (funcMatch) {
        const funcName = funcMatch[1];
        if (code.includes(`${funcName}(`)) {
          hasRecursion = true;
        }
      }
    }
  }

  // Determine Big O based on analysis
  if (hasRecursion) {
    return 'O(?)'; // Recursion complexity varies
  }

  if (hasSorting) {
    return 'O(n log n)'; // Most sorting algorithms
  }

  if (hasSearching && maxNesting >= 2) {
    return 'O(log n)'; // Binary search
  }

  // Based on loop nesting
  switch (maxNesting) {
    case 0:
      return 'O(1)'; // Constant time
    case 1:
      return 'O(n)'; // Linear
    case 2:
      return 'O(n²)'; // Quadratic
    case 3:
      return 'O(n³)'; // Cubic
    default:
      return 'O(n^k)'; // Polynomial of higher degree
  }
};

const prepareCodeForExecution = (userCode: string, mode: ExecutionMode): string => {
  // Check if code contains return statements
  const hasReturnStatement = /\breturn\b/.test(userCode.trim());

  if (mode === 'script') {
    // If script mode but has return statements, automatically wrap in function
    if (hasReturnStatement) {
      return wrapCodeInMainFunction(userCode);
    }
    return userCode;
  }
  return wrapCodeInMainFunction(userCode);
};

type ExecutionMode = 'script' | 'function';

// Render different types of results
function renderResult(result: JsonValue): React.ReactElement {
  // Check for special result types
  if (typeof result === 'object' && result !== null && '_type' in result) {
    const typedResult = result as Record<string, unknown>;

    switch (typedResult._type) {
      case 'dataframe':
        return renderDataFrame(typedResult as unknown as DataFrameResult);
      case 'series':
        return renderSeries(typedResult as unknown as SeriesResult);
      case 'image':
        return renderImage(typedResult as unknown as ImageResult);
      case 'unserializable':
        return renderUnserializable(typedResult as unknown as UnserializableResult);
      default:
        break;
    }
  }

  // Default JSON rendering
  return (
    <pre className="bg-black/60 p-3 rounded-md text-xs text-emerald-400 whitespace-pre-wrap break-words overflow-x-auto max-h-60 shadow-inner">
      {typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)}
    </pre>
  );
}

function renderDataFrame(df: DataFrameResult): React.JSX.Element {
  const maxRows = 10; // Limit rows for display
  const displayData = df.data.slice(0, maxRows);
  const hasMoreRows = df.data.length > maxRows;

  return (
    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-600/50">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-300">📊 pandas DataFrame</span>
        <span className="text-xs text-slate-500">Shape: {df.shape[0]} × {df.shape[1]}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse border border-slate-600/50">
          <thead>
            <tr className="bg-slate-700/50">
              <th className="border border-slate-600/50 p-2 text-left text-slate-400 font-medium">Index</th>
              {df.columns.map((col, idx) => (
                <th key={idx} className="border border-slate-600/50 p-2 text-left text-slate-400 font-medium">
                  {col}
                  <div className="text-xs text-slate-500 mt-1">{df.dtypes[col]}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayData.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-slate-700/30">
                <td className="border border-slate-600/50 p-2 text-slate-500 font-mono">
                  {String(df.index[rowIdx])}
                </td>
                {df.columns.map((col, colIdx) => (
                  <td key={colIdx} className="border border-slate-600/50 p-2 text-slate-300 font-mono">
                    {String(row[col])}
                  </td>
                ))}
              </tr>
            ))}
            {hasMoreRows && (
              <tr>
                <td colSpan={df.columns.length + 1} className="border border-slate-600/50 p-2 text-center text-slate-500 italic">
                  ... and {df.data.length - maxRows} more rows
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function renderSeries(series: SeriesResult): React.JSX.Element {
  const maxItems = 10;
  const entries = Object.entries(series.data).slice(0, maxItems);
  const hasMoreItems = Object.keys(series.data).length > maxItems;

  return (
    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-600/50">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-300">
          📈 pandas Series {series.name ? `(${series.name})` : ''}
        </span>
        <span className="text-xs text-slate-500">dtype: {series.dtype}</span>
      </div>

      <div className="space-y-1">
        {entries.map(([index, value], idx) => (
          <div key={idx} className="flex items-center space-x-3 text-xs">
            <span className="text-slate-500 font-mono w-16 flex-shrink-0">{String(index)}</span>
            <span className="text-slate-400">→</span>
            <span className="text-slate-300 font-mono">{String(value)}</span>
          </div>
        ))}
        {hasMoreItems && (
          <div className="text-xs text-slate-500 italic text-center py-2">
            ... and {Object.keys(series.data).length - maxItems} more items
          </div>
        )}
      </div>
    </div>
  );
}

function renderImage(image: ImageResult): React.JSX.Element {
  return (
    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-600/50">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-300">🖼️ PIL Image</span>
        <span className="text-xs text-slate-500">
          {image.size[0]} × {image.size[1]} ({image.mode})
        </span>
      </div>

      <div className="flex justify-center">
        <img
          src={image.data}
          alt="PIL Image"
          className="max-w-full h-auto rounded border border-slate-600/50"
          style={{ maxHeight: '400px' }}
        />
      </div>
    </div>
  );
}

function renderUnserializable(obj: UnserializableResult): React.JSX.Element {
  return (
    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-600/50">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-300">🔧 Unserializable Object</span>
        <span className="text-xs text-slate-500">Type: {obj.type}</span>
      </div>

      <pre className="bg-black/60 p-3 rounded-md text-xs text-slate-300 whitespace-pre-wrap break-words overflow-x-auto max-h-60 shadow-inner">
        {obj.value}
      </pre>
    </div>
  );
}

export default function EditorPage() {
  const [userCode, setUserCode] = useState<string>(defaultFunctionCode);
  const [executionMode, setExecutionMode] = useState<ExecutionMode>('function');
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasUserEdited, setHasUserEdited] = useState<boolean>(false);
  const [editorInstance, setEditorInstance] = useState<{ trigger: (source: string, handlerId: string, payload: unknown) => void } | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showShortcuts, setShowShortcuts] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [splitRatio, setSplitRatio] = useState<number>(70); // Default 70-30 split



  // Load saved code from localStorage on mount
  useEffect(() => {
    const savedCode = localStorage.getItem('python-sandbox-code');
    const savedMode = localStorage.getItem('python-sandbox-mode');
    if (savedCode) {
      setUserCode(savedCode);
      setHasUserEdited(true);
    }
    if (savedMode === 'script' || savedMode === 'function') {
      setExecutionMode(savedMode);
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+Enter: Run code
      if (event.ctrlKey && event.key === 'Enter' && !isLoading) {
        event.preventDefault();
        const form = document.getElementById('code-form') as HTMLFormElement;
        if (form) {
          form.requestSubmit();
        }
        return;
      }

      // Ctrl+S: Save code
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        saveCode();
        return;
      }

      // F11: Toggle fullscreen
      if (event.key === 'F11') {
        event.preventDefault();
        toggleFullscreen();
        return;
      }

      // Ctrl+/: Comment/uncomment (handled by Monaco)
      // Ctrl+D: Duplicate line (handled by Monaco)
      // Ctrl+Z/Ctrl+Y: Undo/Redo (handled by Monaco)
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isLoading, userCode, executionMode]);

  // Mouse event handlers for resizable divider
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const container = document.querySelector('[data-split-container]') as HTMLElement;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const newRatio = ((e.clientX - rect.left) / rect.width) * 100;

      // Constrain between 30% and 80%
      const constrainedRatio = Math.max(30, Math.min(80, newRatio));
      setSplitRatio(constrainedRatio);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleDividerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const saveCode = () => {
    localStorage.setItem('python-sandbox-code', userCode);
    localStorage.setItem('python-sandbox-mode', executionMode);
    // Visual feedback could be added here
    console.log('💾 Code saved to localStorage');
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

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

  const handleEditorDidMount = (editor: { trigger: (source: string, handlerId: string, payload: unknown) => void }) => {
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
      console.log("Execution cancelled by user.");
      return;
    }

    if (!userCode.trim()) {
      console.error("Please enter some Python code to execute.");
      setApiResponse(null);
      return;
    }

    setIsLoading(true);
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
      apiUrl = process.env.NEXT_PUBLIC_FLASK_API_URL || '';
      if (!apiUrl) {
        console.error('API URL not configured. For production, set NEXT_PUBLIC_FLASK_API_URL in your .env file.');
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
        console.error(errorMessage);
        return;
      }
      setApiResponse(data);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // User cancelled the execution - this is expected behavior
        console.log("Execution cancelled by user.");
      } else {
        console.error("Fetch/Network error:", err);
        if (err instanceof Error) {
          console.error(err.message || 'Failed to connect or parse response.');
        } else {
          console.error(String(err) || 'An unknown error occurred.');
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
              {executionMode === 'function' ? 'Function Mode (main() wrapper)' :
               /\breturn\b/.test(userCode.trim()) ? 'Script Mode (auto-function for return)' : 'Script Mode (direct execution)'}
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

      {/* Main content - Side by side layout with vertical editor/metrics */}
      <main
        data-split-container
        className="flex flex-grow overflow-hidden px-4 py-4 bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl"
        style={{ gap: '0' }}
      >
        {/* Left Column: Code Editor + Performance Metrics */}
        <section
          className="flex flex-col h-full"
          style={{ width: `${splitRatio}%` }}
        >
          {/* Editor Section */}
          <div className="flex flex-col flex-1">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-slate-800/80 to-slate-900/80 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <h2 className="text-lg font-bold text-slate-200">Python Code Editor</h2>
              </div>
              <div className="flex items-center space-x-2">
                {/* Help/Shortcuts Button */}
                <button
                  type="button"
                  onClick={() => setShowShortcuts(!showShortcuts)}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold p-3 rounded-xl shadow-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900"
                  title="Keyboard Shortcuts"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>

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
              <div className="flex-grow">
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

          {/* Performance Metrics Section */}
          <div className="flex flex-col h-[15%] border-t border-slate-700/50">
            {/* Performance Content */}
            <div className="flex-grow p-3 overflow-hidden">
              {apiResponse?.performance ? (
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-600/50 h-full overflow-y-auto">
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-3 text-sm h-full">
                    <div className="text-center">
                      <div className="text-slate-400 text-xs">Execution Time</div>
                      <div className="text-emerald-400 font-mono font-bold text-lg">
                        {apiResponse.performance.execution_time.toFixed(3)}s
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-slate-400 text-xs">CPU Time</div>
                      <div className="text-blue-400 font-mono font-bold text-lg">
                        {apiResponse.performance.cpu_time.toFixed(3)}s
                      </div>
                      <div className="text-slate-500 text-xs mt-1">
                        {analyzeTimeComplexity(userCode)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-slate-400 text-xs">Peak Memory</div>
                      <div className="text-purple-400 font-mono font-bold text-lg">
                        {(apiResponse.performance.memory_peak / 1024 / 1024).toFixed(1)} MB
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-slate-400 text-xs">Code Lines</div>
                      <div className="text-orange-400 font-mono font-bold text-lg">
                        {apiResponse.performance.code_lines}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-slate-400 text-xs">Output Size</div>
                      <div className="text-pink-400 font-mono font-bold text-lg">
                        {(apiResponse.performance.output_size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-slate-400 text-xs">Libraries Used</div>
                      <div className="text-cyan-400 font-mono font-bold text-lg">
                        {apiResponse.performance.libraries_used.length}
                      </div>
                    </div>
                  </div>
{/* 
                  {apiResponse.performance.libraries_used.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-600/50">
                      <div className="text-slate-400 text-xs mb-2">📚 Libraries Imported:</div>
                      <div className="flex flex-wrap gap-1">
                        {apiResponse.performance.libraries_used.slice(0, 5).map((lib, idx) => (
                          <span key={idx} className="px-2 py-1 bg-slate-700/50 rounded text-xs text-slate-300 font-mono">
                            {lib}
                          </span>
                        ))}
                        {apiResponse.performance.libraries_used.length > 5 && (
                          <span className="px-2 py-1 bg-slate-700/50 rounded text-xs text-slate-500">
                            +{apiResponse.performance.libraries_used.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )} */}

                  {/* Debug Info */}
                  {apiResponse.performance.debug_info && (
                    <div className="mt-3 pt-3 border-t border-slate-600/50">
                      <div className="text-slate-400 text-xs mb-2">🔧 Debug Info:</div>
                      <div className="text-xs text-slate-500 space-y-1">
                        <div>psutil available: {apiResponse.performance.debug_info.psutil_available ? '✅' : '❌'}</div>
                        <div>Script lines: {apiResponse.performance.debug_info.script_lines}</div>
                        <div>Import lines found: {apiResponse.performance.debug_info.import_lines_found}</div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400">
                  <p className="text-sm">Run code to see performance metrics</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Resizable Divider */}
        <div
          className={`w-1 bg-slate-600 hover:bg-slate-500 cursor-col-resize transition-colors duration-200 select-none ${
            isDragging ? 'bg-slate-400' : ''
          }`}
          onMouseDown={handleDividerMouseDown}
          title="Drag to resize panels"
        />

        {/* Right Column: Execution Output (only user output, no performance metrics) */}
        <section
          className="flex flex-col h-full"
          style={{ width: `${100 - splitRatio}%` }}
        >
          <div className="flex flex-col h-full relative">
            <div className="bg-transparent rounded-none border-0 overflow-hidden flex flex-col h-full">
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
                    <h4 className="text-sm font-semibold text-slate-200 mb-2">
                      📚 Supported Libraries
                    </h4>
                    <div className="text-xs text-slate-400">
                      <div><strong>Data Science:</strong> pandas, numpy, scipy</div>
                      <div><strong>Visualization:</strong> matplotlib, seaborn, plotly</div>
                      <div><strong>Image Processing:</strong> pillow</div>
                      <div><strong>NLP:</strong> nltk</div>
                      <div><strong>Web:</strong> requests, beautifulsoup4, lxml</div>
                      <div><strong>Data Formats:</strong> openpyxl, xlrd</div>
                      <div><strong>Standard Library:</strong> json, os, sys, math, random, datetime, re</div>
                    </div>
                  </div>

                  {isLoading && !apiResponse && (
                    <div className="flex items-center justify-center h-full text-slate-400">
                      <Spinner size="w-8 h-8" />
                      <p className="mt-2 text-sm">Executing code...</p>
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

                      {/* Visualizations (matplotlib plots, etc.) */}
                      {apiResponse.visualizations && apiResponse.visualizations.length > 0 && (
                        <div>
                          <h3 className="text-lg font-medium text-slate-300 mb-2">📊 Visualizations:</h3>
                          <div className="space-y-3">
                            {apiResponse.visualizations.map((viz, index) => (
                              <div key={index} className="bg-slate-800/50 rounded-lg p-3 border border-slate-600/50">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-slate-300">
                                    {viz.type === 'matplotlib' ? `📈 Matplotlib Figure ${viz.figure_number || index + 1}` : viz.type}
                                  </span>
                                  <span className="text-xs text-slate-500 uppercase">{viz.format}</span>
                                </div>
                                <div className="flex justify-center">
                                  <img
                                    src={viz.data}
                                    alt={`Visualization ${index + 1}`}
                                    className="max-w-full h-auto rounded border border-slate-600/50"
                                    style={{ maxHeight: '400px' }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {apiResponse.stdout && (
                        <div>
                          <h3 className="text-lg font-medium text-slate-300 mb-1">📝 Stdout:</h3>
                          <pre className="bg-black/60 p-3 rounded-md text-xs text-slate-300 whitespace-pre-wrap break-words overflow-x-auto max-h-60 shadow-inner">
                            {apiResponse.stdout || <span className="italic text-slate-500">No standard output.</span>}
                          </pre>
                        </div>
                      )}

                      {/* Enhanced Result Display */}
                      {apiResponse.hasOwnProperty('result') && apiResponse.result !== null && apiResponse.result !== undefined && (
                        <div>
                          <h3 className="text-lg font-medium text-slate-300 mb-2">
                            🎯 Result {executionMode === 'function' ? '(from main()):' : '(script output):'}
                          </h3>
                          {renderResult(apiResponse.result) as React.ReactElement}
                        </div>
                      )}

                      {!apiResponse.error && !apiResponse.stdout &&
                       !(apiResponse.visualizations && apiResponse.visualizations.length > 0) &&
                       !(apiResponse.hasOwnProperty('result') && apiResponse.result !== null && apiResponse.result !== undefined) &&
                       !isLoading && (
                        <p className="text-slate-400 italic text-sm">Script executed with no output, visualizations, or result.</p>
                      )}
                    </>
                  )}
                  {!isLoading && !apiResponse && (
                    <p className="text-slate-500 italic text-center py-10">Output will appear here after execution.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800 px-6 py-4 bg-slate-900/80 backdrop-blur-sm">
        <div className="flex items-center justify-center space-x-6 text-sm text-slate-400">
          <span>Made with ❤️ by <a href="https://github.com/AkaashThawani" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:text-violet-300 transition-colors underline">Akaash Thawani</a></span>
          <div className="flex items-center space-x-4">
            <a
              href="https://github.com/AkaashThawani/python-sandbox"
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-400 hover:text-violet-300 transition-colors"
              title="Frontend Repository"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>
            <a
              href="https://github.com/AkaashThawani/flaskAPI"
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-400 hover:text-violet-300 transition-colors"
              title="Backend Repository"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>
          </div>
          <span>• Feel free to reach out!</span>
        </div>
      </footer>

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-200">⌨️ Keyboard Shortcuts</h2>
                <button
                  onClick={() => setShowShortcuts(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Essential Shortcuts */}
              <div>
                <h3 className="text-lg font-semibold text-slate-200 mb-3">🚀 Essential Shortcuts</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                    <span className="text-slate-300">Run Code</span>
                    <div className="flex items-center space-x-1">
                      <kbd className="px-2 py-1 bg-slate-600 text-slate-200 rounded text-xs font-mono">Ctrl</kbd>
                      <span className="text-slate-400">+</span>
                      <kbd className="px-2 py-1 bg-slate-600 text-slate-200 rounded text-xs font-mono">Enter</kbd>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                    <span className="text-slate-300">Save Code</span>
                    <div className="flex items-center space-x-1">
                      <kbd className="px-2 py-1 bg-slate-600 text-slate-200 rounded text-xs font-mono">Ctrl</kbd>
                      <span className="text-slate-400">+</span>
                      <kbd className="px-2 py-1 bg-slate-600 text-slate-200 rounded text-xs font-mono">S</kbd>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                    <span className="text-slate-300">Fullscreen</span>
                    <kbd className="px-2 py-1 bg-slate-600 text-slate-200 rounded text-xs font-mono">F11</kbd>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                    <span className="text-slate-300">Show Shortcuts</span>
                    <kbd className="px-2 py-1 bg-slate-600 text-slate-200 rounded text-xs font-mono">Click Help</kbd>
                  </div>
                </div>
              </div>

              {/* Editor Shortcuts */}
              <div>
                <h3 className="text-lg font-semibold text-slate-200 mb-3">📝 Editor Shortcuts</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                    <span className="text-slate-300">Undo</span>
                    <div className="flex items-center space-x-1">
                      <kbd className="px-2 py-1 bg-slate-600 text-slate-200 rounded text-xs font-mono">Ctrl</kbd>
                      <span className="text-slate-400">+</span>
                      <kbd className="px-2 py-1 bg-slate-600 text-slate-200 rounded text-xs font-mono">Z</kbd>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                    <span className="text-slate-300">Redo</span>
                    <div className="flex items-center space-x-1">
                      <kbd className="px-2 py-1 bg-slate-600 text-slate-200 rounded text-xs font-mono">Ctrl</kbd>
                      <span className="text-slate-400">+</span>
                      <kbd className="px-2 py-1 bg-slate-600 text-slate-200 rounded text-xs font-mono">Y</kbd>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                    <span className="text-slate-300">Comment Line</span>
                    <div className="flex items-center space-x-1">
                      <kbd className="px-2 py-1 bg-slate-600 text-slate-200 rounded text-xs font-mono">Ctrl</kbd>
                      <span className="text-slate-400">+</span>
                      <kbd className="px-2 py-1 bg-slate-600 text-slate-200 rounded text-xs font-mono">/</kbd>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                    <span className="text-slate-300">Duplicate Line</span>
                    <div className="flex items-center space-x-1">
                      <kbd className="px-2 py-1 bg-slate-600 text-slate-200 rounded text-xs font-mono">Ctrl</kbd>
                      <span className="text-slate-400">+</span>
                      <kbd className="px-2 py-1 bg-slate-600 text-slate-200 rounded text-xs font-mono">D</kbd>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                    <span className="text-slate-300">Find</span>
                    <div className="flex items-center space-x-1">
                      <kbd className="px-2 py-1 bg-slate-600 text-slate-200 rounded text-xs font-mono">Ctrl</kbd>
                      <span className="text-slate-400">+</span>
                      <kbd className="px-2 py-1 bg-slate-600 text-slate-200 rounded text-xs font-mono">F</kbd>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                    <span className="text-slate-300">Select All</span>
                    <div className="flex items-center space-x-1">
                      <kbd className="px-2 py-1 bg-slate-600 text-slate-200 rounded text-xs font-mono">Ctrl</kbd>
                      <span className="text-slate-400">+</span>
                      <kbd className="px-2 py-1 bg-slate-600 text-slate-200 rounded text-xs font-mono">A</kbd>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
                <h4 className="text-blue-300 font-semibold mb-2">💡 Pro Tips</h4>
                <ul className="text-sm text-blue-200 space-y-1">
                  <li>• Use <kbd className="px-1 py-0.5 bg-blue-800 text-blue-100 rounded text-xs">Script Mode</kbd> for simple scripts without return statements</li>
                  <li>• Use <kbd className="px-1 py-0.5 bg-blue-800 text-blue-100 rounded text-xs">Function Mode</kbd> for complex programs with return values</li>
                  <li>• Your code is automatically saved when you change modes</li>
                  <li>• Press <kbd className="px-1 py-0.5 bg-blue-800 text-blue-100 rounded text-xs">Ctrl+Enter</kbd> anywhere to run code instantly</li>
                  <li>• All matplotlib plots appear in the Visualizations section</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
