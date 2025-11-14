'use client';

import { useEffect, useState } from 'react';

export default function Landing() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="bg-slate-900 text-slate-100 font-sans snap-y snap-mandatory overflow-y-scroll h-screen">
      {/* Hero Section - Full Viewport Height */}
      <section className="h-screen flex items-center px-4 py-4 md:py-8 snap-start">
        <div className="w-full max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 items-center h-full">
            {/* Left Column - Title and Text */}
            <div className={`space-y-4 transform transition-all duration-1000 ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-12 opacity-0'}`}>
              <div className="space-y-4">
                <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-pink-400 to-purple-400 leading-tight">
                  Python
                  <br />
                  <span className="bg-gradient-to-r from-pink-400 to-violet-400 bg-clip-text text-transparent">
                    Sandbox
                  </span>
                </h1>
                <p className="text-lg md:text-xl text-slate-300 leading-relaxed max-w-lg">
                  Write, run, and test Python code directly in your browser with optimized support for
                  <span className="text-violet-400 font-bold"> data science</span>,
                  <span className="text-pink-400 font-bold"> visualization</span>, and
                  <span className="text-purple-400 font-bold"> web development</span> libraries
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href="/editor"
                    className="group relative bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-lg shadow-xl transition-all duration-300 ease-in-out transform hover:scale-105 hover:-translate-y-1 hover:shadow-violet-500/25 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 focus:ring-offset-slate-900 text-base overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center">
                      🚀 Start Coding Now
                      <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </a>
                </div>
              </div>

              {/* Tech Stack Pills */}
              <div className="flex flex-wrap gap-2">
                {['Next.js', 'TypeScript', 'Tailwind CSS', 'Monaco Editor'].map((tech, index) => (
                  <span
                    key={tech}
                    className={`px-3 py-1 bg-slate-800/80 border border-slate-700 rounded-full text-xs font-medium text-slate-300 backdrop-blur-sm transform transition-all duration-500 hover:scale-105 hover:border-violet-500/50`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* Right Column - Interactive Demo */}
            <div className={`relative transform transition-all duration-1000 delay-300 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0'}`}>
              <div className="relative">
                {/* 3D Card Effect */}
                <div className="relative transform transition-transform duration-300 hover:scale-105 hover:-rotate-1">
                  <div className="bg-slate-800/60 backdrop-blur-xl rounded-xl border border-slate-700/50 overflow-hidden shadow-2xl">
                    {/* Header */}
                    <div className="p-3 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/80 to-slate-900/80">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-bold text-slate-200">Live Data Analysis</h3>
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                          <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        </div>
                      </div>
                    </div>

                    {/* Code and Output */}
                    <div className="p-4">
                      <div className="grid grid-cols-1 gap-4">
                        {/* Code Section */}
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="text-xs font-medium text-slate-300">Python Code</span>
                          </div>
                          <div className="bg-slate-900/80 rounded p-3 border border-slate-700/50 font-mono text-xs text-slate-300 overflow-x-auto">
                            <div className="text-violet-400">import pandas as pd</div>
                            <div className="text-slate-300">data = &#123;&#39;name&#39;: [&#39;Alice&#39;, &#39;Bob&#39;], &#39;score&#39;: [95, 87]&#125;</div>
                            <div className="text-slate-300">df = pd.DataFrame(data)</div>
                            <div className="text-emerald-400">print</div>
                            <div className="text-slate-300">(<span className="text-orange-300">"Top score:"</span>, df[&#39;score&#39;].max())</div>
                            <div className="text-blue-400">return</div>
                            <div className="text-slate-300">&#123;winner: df.loc[df[&#39;score&#39;].idxmax(), &#39;name&#39;]&#125;</div>
                          </div>
                        </div>

                        {/* Output Section */}
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                            <span className="text-xs font-medium text-slate-300">Execution Result</span>
                          </div>
                          <div className="bg-slate-900/80 rounded p-3 border border-slate-700/50">
                            <div className="space-y-2">
                              <div>
                                <div className="text-xs text-slate-500 mb-1">Stdout:</div>
                                <div className="text-xs text-slate-300 font-mono bg-black/30 p-2 rounded">
                                  Top score: 95
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-slate-500 mb-1">Result:</div>
                                <div className="text-xs text-emerald-400 font-mono bg-black/30 p-2 rounded">
                                  {'{winner: "Alice"}'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Elements for 3D Effect */}
                <div className="absolute -top-4 -right-4 w-6 h-6 bg-violet-500/20 rounded-full blur-xl animate-pulse"></div>
                <div className="absolute -bottom-4 -left-4 w-8 h-8 bg-pink-500/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Full Viewport Height */}
      <section className="h-screen flex items-center px-4 py-4 md:py-6 snap-start">
        <div className="w-full max-w-7xl mx-auto h-full flex flex-col justify-center">
          <div className="text-center mb-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
              Why Python Sandbox?
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Built for data scientists, developers, and learners who need a powerful yet safe Python environment
            </p>
          </div>

          {/* Hexagonal Grid Layout */}
          <div className="relative max-w-5xl mx-auto flex-grow flex flex-col justify-center">
            {/* Row 1 - 3 cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="group bg-slate-800/60 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50 hover:border-violet-500/60 transition-all duration-300 hover:scale-105">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-violet-400 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <div className="text-xs font-mono text-violet-400/60 bg-violet-500/10 px-2 py-0.5 rounded-full">
                    01
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-2 text-slate-100">Professional Editor</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Monaco Editor (same as VS Code) with syntax highlighting, IntelliSense, and advanced code editing features.
                </p>
              </div>

              <div className="group bg-slate-800/60 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50 hover:border-pink-500/60 transition-all duration-300 hover:scale-105">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-pink-400 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="text-xs font-mono text-pink-400/60 bg-pink-500/10 px-2 py-0.5 rounded-full">
                    02
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-2 text-slate-100">Data Science Ready</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Pre-installed pandas, numpy, and matplotlib. Perfect for data analysis, visualization, and machine learning experiments.
                </p>
              </div>

              <div className="group bg-slate-800/60 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50 hover:border-emerald-500/60 transition-all duration-300 hover:scale-105">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-emerald-400 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="text-xs font-mono text-emerald-400/60 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    03
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-2 text-slate-100">Lightning Fast</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Real-time execution with instant feedback. No setup required - just write and run your Python code.
                </p>
              </div>
            </div>

            {/* Row 2 - 2 cards offset */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 md:ml-[16.67%] md:w-[66.67%]">
              <div className="group bg-slate-800/60 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50 hover:border-blue-500/60 transition-all duration-300 hover:scale-105">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-blue-400 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div className="text-xs font-mono text-blue-400/60 bg-blue-500/10 px-2 py-0.5 rounded-full">
                    04
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-2 text-slate-100">Secure & Isolated</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Server-side execution in isolated environments. Your code runs safely without affecting your local machine.
                </p>
              </div>

              <div className="group bg-slate-800/60 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50 hover:border-yellow-500/60 transition-all duration-300 hover:scale-105">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-yellow-400 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <div className="text-xs font-mono text-yellow-400/60 bg-yellow-500/10 px-2 py-0.5 rounded-full">
                    05
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-2 text-slate-100">Flexible Execution</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Choose between Script mode (direct execution) or Function mode (main() wrapper) based on your needs.
                </p>
              </div>
            </div>

            {/* Row 3 - 2 cards centered */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:w-2/3 mx-auto">
              <div className="group bg-slate-800/60 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50 hover:border-purple-500/60 transition-all duration-300 hover:scale-105">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-purple-400 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div className="text-xs font-mono text-purple-400/60 bg-purple-500/10 px-2 py-0.5 rounded-full">
                    06
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-2 text-slate-100">Enterprise Security</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Powered by nsjail sandboxing with resource limits, network isolation, and process restrictions for maximum security.
                </p>
              </div>

              <div className="group bg-slate-800/60 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50 hover:border-cyan-500/60 transition-all duration-300 hover:scale-105">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-cyan-400 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div className="text-xs font-mono text-cyan-400/60 bg-cyan-500/10 px-2 py-0.5 rounded-full">
                    07
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-2 text-slate-100">Rich Library Ecosystem</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  15+ pre-installed libraries including pandas, numpy, matplotlib, scipy, requests, and more for comprehensive Python development.
                </p>
              </div>
            </div>

            {/* Connecting lines for hexagonal effect */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1200 800">
              <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgb(139, 92, 246)" stopOpacity="0.3" />
                  <stop offset="50%" stopColor="rgb(236, 72, 153)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="rgb(139, 92, 246)" stopOpacity="0.3" />
                </linearGradient>
              </defs>
              {/* Hexagonal connections */}
              <path d="M200,150 L400,150 M400,150 L500,250 M500,250 L400,350 M400,350 L200,350 M200,350 L100,250 M100,250 L200,150"
                    stroke="url(#lineGradient)" strokeWidth="2" fill="none" opacity="0.4" />
              <path d="M600,150 L800,150 M800,150 L900,250 M900,250 L800,350 M800,350 L600,350 M600,350 L500,250 M500,250 L600,150"
                    stroke="url(#lineGradient)" strokeWidth="2" fill="none" opacity="0.4" />
              <path d="M350,350 L450,450 M450,450 L550,450 M550,450 L650,350"
                    stroke="url(#lineGradient)" strokeWidth="2" fill="none" opacity="0.4" />
            </svg>
          </div>
        </div>
      </section>
    </div>
  );
}
