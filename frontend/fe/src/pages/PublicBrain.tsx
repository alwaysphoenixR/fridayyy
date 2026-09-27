import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Globe, FileText, Link as LinkIcon, FileVideo, File } from 'lucide-react';
import { apiClient } from '../api/client';
import { PublicBrainResponse } from '../types/api';
import { Card } from '../components/ui/Card';
import { Logo } from '../components/Logo';
import { CustomSpinner } from '../components/CustomSpinner';

const getIconForType = (type: string) => {
  switch(type) {
    case 'note': return <FileText className="w-5 h-5" />;
    case 'tweet': return <LinkIcon className="w-5 h-5" />;
    case 'video': return <FileVideo className="w-5 h-5" />;
    case 'article': return <FileText className="w-5 h-5" />;
    case 'document': return <File className="w-5 h-5" />;
    default: return <FileText className="w-5 h-5" />;
  }
};

export const PublicBrain: React.FC = () => {
  const { brainLink } = useParams<{ brainLink: string }>();

  const { data, isLoading, isError } = useQuery<PublicBrainResponse>({
    queryKey: ['public-brain', brainLink],
    queryFn: async () => {
      const response = await apiClient.get<PublicBrainResponse>(`/share/brain/${brainLink}`);
      return response.data;
    }
  });

  return (
    <div className="min-h-screen bg-surface-page font-sans">
      <header className="sticky top-0 z-40 h-20 bg-white/90 backdrop-blur-md border-b border-black/[0.06] flex items-center justify-between px-6">
        <div className="flex items-center">
          <Logo className="h-6 w-auto" />
          <span className="ml-3 text-xs text-brand-gray-400 font-semibold tracking-widest uppercase border-l border-black/[0.06] pl-3 h-4 flex items-center">
            Public Brain
          </span>
        </div>
        <Link 
          to="/login" 
          className="bg-brand-black text-white px-5 py-2.5 rounded-full font-semibold shadow-sm transition-colors text-sm flex items-center hover:bg-brand-dark"
        >
          Build Your Own
        </Link>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {isLoading ? (
          <div className="flex justify-center items-center py-24">
            <CustomSpinner className="w-32 h-20 opacity-80" />
          </div>
        ) : isError || !data ? (
          <div className="flex flex-col items-center justify-center py-32 opacity-50">
            <Globe className="w-16 h-16 text-brand-gray-400 mb-6" />
            <h2 className="text-2xl font-bold text-brand-gray-400">Brain Not Found</h2>
            <p className="text-base text-brand-gray-400 mt-2 text-center max-w-md">
              This link is invalid or the owner has disabled public sharing.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-16 text-center">
              <h1 className="text-3xl md:text-5xl font-extrabold text-brand-black mb-4 tracking-tight">
                {data.username}'s Brain
              </h1>
              <p className="text-lg text-brand-gray-500">
                Exploring curated public knowledge and insights.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {data.content.map((item) => (
                <Card key={item._id} className="flex flex-col h-[280px]">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-8 h-8 rounded-full bg-brand-gray-100 flex items-center justify-center text-brand-gray-700">
                      {getIconForType(item.type)}
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-bold text-brand-black mb-2 line-clamp-2">
                    {item.title || 'Untitled'}
                  </h3>
                  
                  {item.link && (
                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-gray-400 hover:underline truncate mb-4 flex items-center gap-1">
                      <LinkIcon className="w-3 h-3" />
                      {item.link}
                    </a>
                  )}
                  
                  <div className="flex-grow"></div>
                  
                  <div className="flex flex-wrap gap-2 mt-4">
                    {item.tags?.map((tag) => (
                      <span key={tag._id} className="text-[10px] font-semibold uppercase tracking-wider bg-brand-gray-100 text-brand-gray-700 px-2 py-1 rounded-sm">
                        {tag.title}
                      </span>
                    ))}
                  </div>
                </Card>
              ))}

              {data.content.length === 0 && (
                <div className="col-span-full py-12 text-center text-on-surface-variant">
                  This user hasn't made any content public yet.
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};
