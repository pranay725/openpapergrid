'use client';

import React, { useState } from "react";
import { useRouter } from 'next/navigation';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  SearchIcon,
  FileTextIcon,
  DatabaseIcon,
  SparklesIcon,
} from "lucide-react";
import { Header } from "@/components/Header";
import DotGrid from "@/components/DotGrid";

export default function LandingPage() {
  const [query, setQuery] = useState('');
  const [showQueryBuilder, setShowQueryBuilder] = useState(false);
  const [queryDescription, setQueryDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const router = useRouter();
  
  // Auto-resize textarea
  React.useEffect(() => {
    const textarea = document.querySelector('textarea[placeholder*="CRISPR"]') as HTMLTextAreaElement;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.max(48, Math.min(textarea.scrollHeight, 120));
      textarea.style.height = newHeight + 'px';
    }
  }, [query]);

  const handleSearch = () => {
    if (query.trim()) {
      router.push(`/search-results?query=${encodeURIComponent(query)}`);
    }
  };

  return (
    <main className="min-h-screen w-full bg-white text-gray-900 font-sans">
      <Header />

      {/* PubMed Style Hero/Search Section */}
      <section className="relative bg-gradient-to-b from-blue-600 to-blue-700 text-white min-h-[400px] flex items-center overflow-hidden">
        {/* Dot Grid Background */}
        <div className="absolute inset-0 opacity-50">
          <DotGrid
            dotSize={6}
            gap={25}
            baseColor="#ffffff20"
            activeColor="#ffffff"
            proximity={150}
            shockRadius={300}
            shockStrength={8}
            resistance={750}
            returnDuration={1.2}
            className="p-0"
          />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-16 w-full">
          <div className="max-w-4xl mb-8">
            <h2 className="text-3xl font-normal mb-4">
              PubMed Boolean search—now turbo-charged with AI.
            </h2>
            <p className="text-lg text-blue-50">
              Paste the Boolean query you already use. We scan the literature and hand back AI-extracted tables, 
              summaries, and citations—all in one click.
            </p>
          </div>
          
          <div className="w-full">
            <p className="text-sm text-white/90 mb-2">
              No account needed. Start searching immediately.
            </p>
            <div className="relative">
              {/* AI Query Builder Modal */}
              {showQueryBuilder && (
                <div className="absolute bottom-full left-0 right-0 mb-4 bg-white rounded-lg shadow-xl p-6 border border-gray-200 z-50">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 flex items-center gap-2">
                        <SparklesIcon className="h-4 w-4 text-blue-600" />
                        AI Query Builder
                      </h4>
                      <button
                        onClick={() => {
                          setShowQueryBuilder(false);
                          setQueryDescription('');
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    <div>
                      <label className="text-sm text-gray-700 block mb-2">
                        Describe what you're looking for:
                      </label>
                      <textarea
                        value={queryDescription}
                        onChange={(e) => setQueryDescription(e.target.value)}
                        placeholder="e.g., papers on using machine learning to predict drug side effects in elderly patients"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 text-sm h-20 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        autoFocus
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={async () => {
                          if (!queryDescription.trim()) return;
                          setIsGenerating(true);
                          
                          try {
                            const response = await fetch('/api/generate-boolean-query', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ description: queryDescription })
                            });
                            
                            if (!response.ok) throw new Error('Failed to generate query');
                            
                            const data = await response.json();
                            setQuery(data.query);
                            setShowQueryBuilder(false);
                            setQueryDescription('');
                          } catch (error) {
                            // Fallback
                            const keywords = queryDescription.toLowerCase()
                              .split(' ')
                              .filter(word => word.length > 3)
                              .slice(0, 3);
                            setQuery(`(${keywords.join(' OR ')})`);
                            setShowQueryBuilder(false);
                          } finally {
                            setIsGenerating(false);
                          }
                        }}
                        disabled={!queryDescription.trim() || isGenerating}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {isGenerating ? 'Generating...' : 'Generate & Use'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="bg-white rounded shadow-lg">
                <div className="flex items-stretch">
                  <textarea
                    placeholder='e.g. (CRISPR OR "base editing") AND sickle-cell'
                    className="flex-1 border-0 text-gray-900 text-sm px-4 py-3 rounded-l focus:ring-0 focus:outline-none resize-none min-h-[48px] max-h-[120px]"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSearch();
                      }
                    }}
                    rows={1}
                    style={{
                      lineHeight: '1.5',
                      overflow: 'auto'
                    }}
                  />
                  <button
                    className="px-6 bg-blue-600 hover:bg-blue-700 text-white font-normal rounded-r transition-colors min-h-[48px]"
                    onClick={handleSearch} 
                  >
                    Search →
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-4">
              {/* Boolean Examples */}
              <div className="flex flex-wrap gap-2 items-center">
                <button
                  onClick={() => setQuery('(CRISPR OR "CRISPR-Cas9" OR "CRISPR/Cas9" OR "gene editing" OR "genome editing" OR "base editing" OR "prime editing") AND ("translational research" OR "clinical translation" OR "therapeutic application" OR "clinical application" OR "translational medicine" OR "bench to bedside") NOT (review OR editorial OR commentary)')}
                  className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-sm rounded-full transition-colors"
                >
                  CRISPR in translational research
                </button>
                <button
                  onClick={() => setQuery('("digital pathology" OR "computational pathology" OR "whole slide imaging" OR WSI OR "artificial intelligence pathology" OR "AI pathology" OR "machine learning pathology" OR "deep learning pathology") AND ("clinical trial" OR "clinical study" OR "randomized controlled trial" OR RCT OR "prospective study" OR "clinical validation")')}
                  className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-sm rounded-full transition-colors"
                >
                  Digital pathology in clinical trials
                </button>
                <button
                  onClick={() => setQuery('("CAR-T" OR "chimeric antigen receptor T cells" OR "CAR T-cell therapy") AND ("solid tumor" OR "solid tumour" OR "solid cancer") AND ("clinical trial" OR "clinical study")')}
                  className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-sm rounded-full transition-colors"
                >
                  CAR-T for solid tumors
                </button>
                <button
                  onClick={() => setShowQueryBuilder(true)}
                  className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-sm rounded-full transition-colors inline-flex items-center gap-1.5 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  <SparklesIcon className="h-3.5 w-3.5 relative z-10" />
                  <span className="relative z-10">Describe your research → Get Boolean query</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Features Section - Combined */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Why switch?</h2>
          <p className="text-gray-600 text-sm">Three reasons users move over in their first search.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Zero Learning Curve */}
          <div className="text-center">
            <div className="mb-4">
              <div className="w-16 h-16 mx-auto bg-blue-50 rounded-full flex items-center justify-center">
                <SearchIcon className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-3">Zero Learning Curve</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• Use the AND / OR / NOT syntax you already know</li>
              <li>• Search 250M papers across 250k sources</li>
            </ul>
          </div>

          {/* Get Answers Fast */}
          <div className="text-center">
            <div className="mb-4">
              <div className="w-16 h-16 mx-auto bg-blue-50 rounded-full flex items-center justify-center">
                <FileTextIcon className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-3">Get Answers Fast</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• AI distills key findings & stats in seconds</li>
              <li>• Every claim links back to its citation</li>
            </ul>
          </div>

          {/* Own Every Result */}
          <div className="text-center">
            <div className="mb-4">
              <div className="w-16 h-16 mx-auto bg-blue-50 rounded-full flex items-center justify-center">
                <DatabaseIcon className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-3">Own Every Result</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• One-click export to CSV / JSON</li>
              <li>• 100% open-source—no lock-in</li>
            </ul>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <button 
            className="text-blue-600 hover:text-blue-700 hover:underline text-base font-semibold"
            onClick={() => {
              const searchSection = document.querySelector('textarea[placeholder*="CRISPR"]') as HTMLTextAreaElement;
              if (searchSection) {
                searchSection.scrollIntoView({ behavior: 'smooth' });
                searchSection.focus();
              }
            }}
          >
            Try your PubMed query above—see the difference ➜
          </button>
        </div>
      </section>

      {/* 30-second demo */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-6">Watch how it works</h3>
          <div className="bg-gray-100 rounded-lg p-8 mb-4">
            <p className="text-gray-500">[ 15-second demo video ]</p>
          </div>
          <p className="text-sm text-gray-600">Query → results → AI extraction → CSV export.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-300">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center text-sm text-gray-600">
            OpenPaper Grid © 2025 • Contact <a href="mailto:madan@decibio.com" className="text-blue-600 hover:underline">madan@decibio.com</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
