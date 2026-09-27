import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, Search as SearchIcon, Sparkles, Database, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { CustomSpinner } from '../components/CustomSpinner';
import { apiClient } from '../api/client';
import { SearchBrainRequest, SearchBrainResponse } from '../types/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

export const Search: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    if (searchMutation.data?.answer) {
      navigator.clipboard.writeText(searchMutation.data.answer);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const searchMutation = useMutation<SearchBrainResponse, Error, string>({
    mutationFn: async (searchQuery) => {
      const payload: SearchBrainRequest = { query: searchQuery };
      const [response] = await Promise.all([
        apiClient.post<SearchBrainResponse>('/search/search', payload),
        new Promise((resolve) => setTimeout(resolve, 2000)) // Ensure spinner plays for at least 2 seconds
      ]);
      return response.data;
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    searchMutation.mutate(query);
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto flex flex-col pb-12">
      
      {/* Omnisearch Card Section (Matches Dashboard) */}
      <div className="w-full bg-white rounded-3xl p-7 shadow-[0_2px_16px_rgba(0,0,0,0.03)] border border-black/[0.04] mb-8">
        <form onSubmit={handleSearch} className="flex items-center justify-between bg-white border border-[#e5e7eb] rounded-full p-1.5 pl-5 shadow-sm hover:border-[#d1d5db] transition-all">
          <div className="flex items-center gap-3 flex-1">
            <SearchIcon className="w-5 h-5 text-[#9ca3af]" />
            <input
              className="w-full bg-transparent border-0 outline-none text-[#1a1c1c] text-sm md:text-[15px] placeholder-[#9ca3af] py-1.5 focus:ring-0"
              placeholder="Ask your second brain anything... (e.g. 'What did I learn about distributed systems?')"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={searchMutation.isPending || !query.trim()}
            className="flex items-center gap-2 bg-[#fe5f00] hover:bg-[#e05400] text-white px-6 py-2.5 rounded-full text-[13.5px] font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {searchMutation.isPending ? "Searching..." : "Ask Friday"}
          </button>
        </form>
      </div>



      {searchMutation.isPending && (
        <div className="flex flex-col items-center justify-center py-24">
          <CustomSpinner className="w-32 h-20 opacity-90" />
          <p className="mt-6 text-sm font-bold text-brand-gray-400 animate-pulse">Synthesizing from your brain...</p>
        </div>
      )}

      {searchMutation.isError && (
        <div className="text-error bg-error-container p-4 rounded-2xl mb-8">
          Failed to search: {searchMutation.error.message}
        </div>
      )}

      {searchMutation.isSuccess && searchMutation.data && (
        <>

          <div className="flex flex-col lg:flex-row gap-6 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Left Synthesis Container */}
            <div className="flex-1 bg-white border border-black/[0.06] rounded-3xl overflow-hidden shadow-sm flex flex-col">

              <div className="p-8 relative">
                {searchMutation.data?.answer && (
                  <button 
                    onClick={handleCopy}
                    className="absolute top-6 right-6 bg-white border border-black/[0.06] text-brand-black text-[12px] font-bold px-3 py-1.5 rounded-md flex items-center gap-2 shadow-sm hover:bg-brand-gray-50 transition-colors z-10"
                  >
                    {isCopied ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                    )}
                    {isCopied ? "Copied!" : "Copy"}
                  </button>
                )}
                <div className="text-[15.5px] text-brand-black font-medium leading-relaxed mb-6 pt-4">
                  {searchMutation.data.answer ? (
                    <ReactMarkdown
                      components={{
                        h1: ({node, ...props}: any) => <h1 className="text-2xl font-extrabold mt-6 mb-4 text-brand-black tracking-tight" {...props} />,
                        h2: ({node, ...props}: any) => <h2 className="text-[19px] font-bold mt-8 mb-4 text-brand-black tracking-tight flex items-center gap-2" {...props} />,
                        h3: ({node, ...props}: any) => <h3 className="text-[17px] font-bold mt-6 mb-3 text-brand-black tracking-tight" {...props} />,
                        p: ({node, ...props}: any) => <p className="mb-5 leading-relaxed text-[#404040]" {...props} />,
                        ul: ({node, ...props}: any) => <ul className="list-disc pl-5 mb-5 space-y-2.5 text-[#404040] marker:text-[#9ca3af]" {...props} />,
                        ol: ({node, ...props}: any) => <ol className="list-decimal pl-5 mb-5 space-y-2.5 text-[#404040] marker:text-[#9ca3af] marker:font-semibold" {...props} />,
                        li: ({node, ...props}: any) => <li className="pl-1" {...props} />,
                        a: ({node, ...props}: any) => <a className="text-[#fe5f00] hover:underline font-semibold" target="_blank" rel="noopener noreferrer" {...props} />,
                        strong: ({node, ...props}: any) => <strong className="font-bold text-brand-black" {...props} />,
                        blockquote: ({node, ...props}: any) => <blockquote className="border-l-4 border-[#fe5f00] bg-[#fffaf5] pl-4 py-2 pr-4 my-5 rounded-r-lg text-[#555] italic" {...props} />,
                        code: ({node, inline, className, children, ...props}: any) => {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline ? (
                            <pre className="bg-[#f3f4f6] p-4 rounded-xl overflow-x-auto mb-5 text-[13px] font-mono border border-black/[0.04]">
                              <code className={className} {...props}>
                                {children}
                              </code>
                            </pre>
                          ) : (
                            <code className="bg-[#f3f4f6] text-[#e82c16] px-1.5 py-0.5 rounded-md text-[13px] font-mono font-medium border border-black/[0.04]" {...props}>
                              {children}
                            </code>
                          );
                        }
                      }}
                    >
                      {searchMutation.data.answer}
                    </ReactMarkdown>
                  ) : (
                    "Based on your saved notes and articles, your knowledge base highlights key elements answering your query."
                  )}
                </div>

              </div>
            </div>


          </div>

          {/* Sources Section */}
          {searchMutation.data.sources && searchMutation.data.sources.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-6 border-b border-black/[0.06] pb-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-brand-black">Retrieved Knowledge Sources</h3>
                  <span className="bg-brand-gray-100 text-[11px] font-bold text-brand-gray-500 px-2 py-0.5 rounded-full">{searchMutation.data.sources.length} Chunks</span>
                </div>

              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchMutation.data.sources.map((source, i) => (
                  <div key={i} className="bg-white border border-black/[0.06] rounded-3xl p-6 shadow-sm flex flex-col h-full hover:shadow-card transition-shadow cursor-pointer">
                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-accent-red/10 text-accent-red text-[10px] font-bold px-2 py-1 rounded-full capitalize">
                        {/* Fake matching logic just for visual fidelity */}
                        {i % 3 === 0 ? 'Article' : i % 3 === 1 ? 'Document' : 'Note'} • Similarity {Math.round(source.score * 100)}%
                      </div>
                      <FileText className="w-4 h-4 text-brand-gray-400" />
                    </div>
                    <h4 className="text-[17px] font-extrabold text-brand-black line-clamp-2 mb-3">{source.title}</h4>
                    <p className="text-[13px] text-brand-gray-500 line-clamp-3 leading-relaxed mb-6 flex-1">
                      "...{source.text || ''}..."
                    </p>
                    <div className="flex items-center justify-between border-t border-black/[0.04] pt-4">
                      <span className="text-[11px] font-medium text-brand-gray-400">Chunk #{i + 1} • {source.text?.length || 0} chars</span>
                      <button className="flex items-center gap-1.5 text-[11px] font-bold text-brand-black bg-brand-gray-50 px-3 py-1.5 rounded-full hover:bg-brand-gray-100 transition-colors">
                        Open Source
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17l9.2-9.2M17 17V7H7"/></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          

        </>
      )}

      {!searchMutation.isPending && !searchMutation.isSuccess && !searchMutation.isError && (
        <div className="flex flex-col items-center justify-center py-32 opacity-50">
          <SearchIcon className="w-16 h-16 text-brand-gray-400 mb-6" />
          <h2 className="text-2xl font-bold text-brand-gray-400">Query your Brain</h2>
          <p className="text-base text-brand-gray-400 mt-2 text-center max-w-md">
            Search across all your notes, articles, videos, and documents instantly using AI.
          </p>
        </div>
      )}

    </div>
  );
};
