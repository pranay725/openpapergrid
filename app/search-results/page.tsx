'use client';

import React, { useState, useEffect } from "react";
import { useSearchParams } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchIcon } from "lucide-react";

export default function SearchResultsPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('query') || '';

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = async (searchQuery: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/search?query=${encodeURIComponent(searchQuery)}`);
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

  useEffect(() => {
    if (initialQuery) {
      fetchResults(initialQuery);
    }
  }, [initialQuery]);

  const handleSearch = () => {
    if (query.trim()) {
      fetchResults(query.trim());
    }
  };

  return (
    <main className="min-h-screen w-full bg-gray-50 text-gray-800 font-sans">
      {/* Header */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between border-b border-gray-200 bg-white shadow-sm">
        <h1 className="text-2xl font-bold text-blue-700">OpenPaperGrid</h1>
        <Button variant="ghost" className="text-blue-700 hover:bg-blue-50 hover:text-blue-800">
          Log In
        </Button>
      </header>

      {/* Search Bar on Results Page */}
      <section className="max-w-4xl mx-auto px-4 pt-8 pb-4">
        <div className="flex w-full border border-gray-300 rounded-md overflow-hidden shadow-md">
          <Input
            type="search"
            placeholder="Search PubMed-style (e.g., 'CRISPR gene editing')"
            className="flex-1 border-none text-lg py-3 px-4 focus:ring-0 text-gray-900"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
          />
          <Button size="lg" className="rounded-none bg-blue-700 hover:bg-blue-800 text-lg px-6" onClick={handleSearch} disabled={loading}>
            {loading ? 'Searching...' : <><SearchIcon className="h-5 w-5 mr-2" /> Search</>}
          </Button>
        </div>
      </section>

      {/* Search Results Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 mb-16">
        <Card className="shadow-lg">
          <CardContent className="p-6 min-h-[300px]">
            {loading && (
              <div className="flex items-center justify-center h-full text-gray-600">
                <p>Loading results...</p>
              </div>
            )}
            {error && (
              <div className="flex items-center justify-center h-full text-red-600">
                <p>Error: {error}</p>
              </div>
            )}
            {results && results.length === 0 && !loading && !error && (
              <div className="flex items-center justify-center h-full text-gray-600">
                <p>No results found for your query.</p>
              </div>
            )}
            {results && results.length > 0 && (
              <div className="space-y-6">
                {results.map((result: any) => (
                  <div key={result.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                    <h3 className="text-xl font-semibold text-blue-700 hover:underline cursor-pointer">
                      {result.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {result.authorships?.map((auth: any) => auth.author.display_name).join(', ')}
                      {result.publication_year && ` (${result.publication_year})`}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {result.primary_location?.source?.display_name}
                    </p>
                    {result.abstract && (
                      <p className="text-sm text-gray-700 mt-2 line-clamp-3">
                        {result.abstract.inverted_index ? 
                          Object.keys(result.abstract.inverted_index).sort((a, b) => {
                            const minA = Math.min(...result.abstract.inverted_index[a]);
                            const minB = Math.min(...result.abstract.inverted_index[b]);
                            return minA - minB;
                          }).map(word => word + ' ').join('')
                          : result.abstract}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
