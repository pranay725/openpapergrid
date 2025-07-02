'use client';

import React, { useState } from "react";
import { useRouter } from 'next/navigation';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  SearchIcon,
  FileTextIcon,
  MessageCircleIcon,
  BarChart2Icon,
  Settings2Icon,
  DownloadIcon,
  DatabaseIcon,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import DotGrid from "@/components/DotGrid";

export default function LandingPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const response = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Something went wrong');
      }
      const data = await response.json();
      setResults(data.results || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full bg-white text-gray-900 font-sans">
      {/* US Gov Banner */}
      <div className="bg-gray-100 text-xs py-1 px-4 border-b border-gray-300">
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          <span className="text-gray-600">🇺🇸</span>
          <span>An open-source alternative to AI research platforms like Elicit, Consensus, Scite.</span>
          <a href="#" className="text-blue-600 hover:underline ml-2">Here's how you deploy →</a>
        </div>
      </div>

      {/* NIH/NLM Style Header */}
      <header className="bg-white border-b border-gray-300">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Logo />
              <div>
                <h1 className="text-2xl font-normal text-gray-900">OpenPaper Grid</h1>
                <p className="text-sm text-gray-600">AI-Powered Biomedical Literature Platform</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              className="text-blue-600 hover:text-blue-700 hover:bg-gray-50 font-normal"
            >
              Log in
            </Button>
          </div>
        </div>
      </header>

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
              OpenPaper Grid®
            </h2>
            <p className="text-lg text-blue-50">
              Self-hosted agent combining OpenAlex metadata with full-text extraction and LLM-powered summarization. 
              Build custom extraction pipelines, chat with papers, and generate evidence-backed insights instantly.
            </p>
          </div>
          
          <div className="w-full">
            <div className="bg-white rounded shadow-lg p-1">
              <div className="flex">
                <Input
                  type="search"
                  placeholder="Search biomedical literature (e.g., 'CRISPR gene editing 2023')"
                  className="flex-1 border-0 text-gray-900 text-base px-4 py-3 rounded-l focus:ring-0 focus:outline-none"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                />
                <Button 
                  size="lg" 
                  className="rounded-none rounded-r bg-blue-600 hover:bg-blue-700 text-white px-6 font-normal"
                  onClick={handleSearch} 
                  disabled={loading}
                >
                  {loading ? 'Searching...' : 'Search'}
                </Button>
              </div>
            </div>
            <div className="mt-3 text-sm">
              <a href="#" className="text-white hover:underline" style={{ color: 'white' }}>Advanced Search</a>
            </div>
          </div>
        </div>
      </section>

      {/* Search Results Section - PubMed Style */}
      {(results || loading || error) && (
        <section className="max-w-7xl mx-auto px-4 py-6">
          <div className="bg-white">
            {loading && (
              <div className="text-center py-8 text-gray-600">
                <p>Loading results...</p>
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">
                <p>Error: {error}</p>
              </div>
            )}
            {results && results.length === 0 && !loading && !error && (
              <div className="text-center py-8 text-gray-600">
                <p>No results found for your query.</p>
              </div>
            )}
            {results && results.length > 0 && (
              <div>
                <div className="border-b border-gray-300 pb-3 mb-4">
                  <h3 className="text-lg font-normal text-gray-700">
                    Results: <span className="font-semibold">{results.length}</span>
                  </h3>
                </div>
                <div className="space-y-4">
                  {results.map((result: any, index: number) => (
                    <div key={result.id} className="border-b border-gray-200 pb-4">
                      <div className="text-sm text-gray-600 mb-1">
                        {index + 1}. {result.primary_location?.source?.display_name || 'Unknown Journal'}. 
                        {result.publication_year && ` ${result.publication_year}`}
                        {result.biblio?.volume && `;${result.biblio.volume}`}
                        {result.biblio?.issue && `(${result.biblio.issue})`}
                        {result.biblio?.first_page && `:${result.biblio.first_page}`}
                        {result.biblio?.last_page && `-${result.biblio.last_page}`}.
                      </div>
                      <h4 className="text-base font-normal mb-1">
                        <a href={result.doi || '#'} className="text-blue-600 hover:underline">
                          {result.title}
                        </a>
                      </h4>
                      <p className="text-sm text-gray-700 mb-2">
                        {result.authorships?.slice(0, 3).map((auth: any) => auth.author.display_name).join(', ')}
                        {result.authorships?.length > 3 && ', et al.'}
                      </p>
                      {result.abstract && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {typeof result.abstract === 'string' 
                            ? result.abstract 
                            : result.abstract.inverted_index 
                              ? Object.keys(result.abstract.inverted_index).sort((a, b) => {
                                  const minA = Math.min(...result.abstract.inverted_index[a]);
                                  const minB = Math.min(...result.abstract.inverted_index[b]);
                                  return minA - minB;
                                }).slice(0, 50).map(word => word + ' ').join('')
                              : ''}...
                        </p>
                      )}
                      <div className="mt-2 text-sm">
                        {result.open_access?.oa_url && (
                          <a href={result.open_access.oa_url} className="text-blue-600 hover:underline mr-4">
                            Free full text
                          </a>
                        )}
                        <span className="text-gray-500">PMID: {result.ids?.pmid || 'N/A'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Main Features Section - Combined */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Built for Life Sciences Research</h2>
          <p className="text-gray-600">Open-source alternative to proprietary AI research platforms</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Search & Discovery */}
          <div className="text-center">
            <div className="mb-4">
              <div className="w-16 h-16 mx-auto bg-blue-50 rounded-full flex items-center justify-center">
                <SearchIcon className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-3">Search & Discovery</h3>
            <p className="text-sm text-gray-600 mb-3">Boolean queries over 38M+ papers</p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• PubMed-style search syntax</li>
              <li>• OpenAlex metadata integration</li>
              <li>• Advanced filtering options</li>
            </ul>
          </div>

          {/* Extract & Analyze */}
          <div className="text-center">
            <div className="mb-4">
              <div className="w-16 h-16 mx-auto bg-blue-50 rounded-full flex items-center justify-center">
                <FileTextIcon className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-3">Extract & Analyze</h3>
            <p className="text-sm text-gray-600 mb-3">AI-powered data extraction</p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• Custom JSON extraction schemas</li>
              <li>• Source-backed citations</li>
              <li>• Chat with single or multiple papers</li>
            </ul>
          </div>

          {/* Deploy & Control */}
          <div className="text-center">
            <div className="mb-4">
              <div className="w-16 h-16 mx-auto bg-blue-50 rounded-full flex items-center justify-center">
                <DatabaseIcon className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-3">Deploy & Control</h3>
            <p className="text-sm text-gray-600 mb-3">Self-hosted & private</p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• Keep your API keys private</li>
              <li>• n8n workflow customization</li>
              <li>• Export data anytime</li>
            </ul>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8">
            View on GitHub →
          </Button>
          <p className="text-sm text-gray-600 mt-4">
            Deploy with Docker, Vercel, or Fly.io in minutes
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-300 mt-20">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Logo />
              <span className="text-sm text-gray-600">OpenPaper Grid</span>
            </div>
            
            <div className="flex items-center gap-6 text-sm">
              <a href="#" className="text-blue-600 hover:underline">Documentation</a>
              <a href="#" className="text-blue-600 hover:underline">GitHub</a>
              <a href="#" className="text-blue-600 hover:underline">Discord</a>
              <a href="#" className="text-blue-600 hover:underline">API</a>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200 text-xs text-gray-500 text-center">
            <p>© 2025 OpenPaper Grid. Open source under MIT License.</p>
            <p className="mt-1">Built with Next.js, Supabase, n8n, and OpenAlex</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
