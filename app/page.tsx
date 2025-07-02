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
  const router = useRouter();

  const handleSearch = () => {
    if (query.trim()) {
      router.push(`/search-results?query=${encodeURIComponent(query)}`);
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
                >
                  Search
                </Button>
              </div>
            </div>
            <div className="mt-3 text-sm">
              <a href="#" className="text-white hover:underline" style={{ color: 'white' }}>Advanced Search</a>
            </div>
          </div>
        </div>
      </section>

      

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
