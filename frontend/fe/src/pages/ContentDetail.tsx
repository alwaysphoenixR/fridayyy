import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Trash2, Edit3, Check, Loader2, Link as LinkIcon, Copy } from 'lucide-react';
import { apiClient } from '../api/client';
import { GetSingleContentResponse, UpdateContentRequest, UpdateContentResponse } from '../types/api';

export const ContentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editText, setEditText] = useState('');

  const { data, isLoading, isError } = useQuery<GetSingleContentResponse>({
    queryKey: ['content', id],
    queryFn: async () => {
      const response = await apiClient.get<GetSingleContentResponse>(`/content/content/${id}`);
      return response.data;
    }
  });

  const updateMutation = useMutation<UpdateContentResponse, Error, UpdateContentRequest>({
    mutationFn: async (payload) => {
      const response = await apiClient.patch<UpdateContentResponse>(`/content/content/${id}`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content', id] });
      queryClient.invalidateQueries({ queryKey: ['content'] }); // also invalidate list
      setIsEditing(false);
    }
  });

  const deleteMutation = useMutation<void, Error, void>({
    mutationFn: async () => {
      await apiClient.delete(`/content/content/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content'] });
      navigate('/dashboard');
    }
  });

  const handleEditInit = () => {
    if (data?.content) {
      setEditTitle(data.content.title);
      setEditText(data.content.textContent || '');
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    updateMutation.mutate({
      title: editTitle,
      textContent: editText,
    });
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this content?")) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex justify-center items-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF5F00]" />
      </div>
    );
  }

  if (isError || !data?.content) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full p-8">
        <div className="text-red-500 bg-red-50 px-6 py-4 rounded-2xl font-medium">
          Content not found or network error.
        </div>
        <button 
          onClick={() => navigate('/dashboard')} 
          className="mt-6 text-[#141414] font-semibold hover:text-[#FF5F00] transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const content = data.content;

  return (
    <main className="flex-1 w-full max-w-6xl mx-auto py-4 md:py-8">
      {/* NavigationAndActionsToolbar */}
      <nav aria-label="Breadcrumb & Actions" className="flex flex-wrap items-center justify-between gap-4 pb-8 border-b border-black/[0.04] mb-8">
        {/* Left: Back Navigation Link */}
        <div>
          <button 
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#141414] hover:text-[#FF5F00] transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Dashboard</span>
          </button>
        </div>
        
        {/* Right: Action Buttons Group */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {!isEditing ? (
            <>
              <button 
                onClick={handleEditInit}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#141414]/10 text-[#141414] text-xs sm:text-sm font-semibold hover:border-[#141414]/30 hover:bg-neutral-50 active:scale-95 transition-all shadow-sm"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#141414]/80" />
                <span>Edit Knowledge</span>
              </button>
              <button 
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-rose-200 text-rose-600 text-xs sm:text-sm font-semibold hover:bg-rose-50 hover:border-rose-300 active:scale-95 transition-all shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Delete</span>
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => setIsEditing(false)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#141414]/10 text-[#141414] text-xs sm:text-sm font-semibold hover:border-[#141414]/30 hover:bg-neutral-50 active:scale-95 transition-all shadow-sm"
              >
                <span>Cancel</span>
              </button>
              <button 
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#141414] text-white text-xs sm:text-sm font-bold hover:bg-black active:scale-95 transition-all shadow-sm disabled:opacity-50"
              >
                {updateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Save Changes</span>
              </button>
            </>
          )}
        </div>
      </nav>

      {/* DocumentHeaderBlock */}
      <header className="mb-8 space-y-4">
        {isEditing ? (
          <input 
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full text-4xl sm:text-5xl md:text-6xl font-black text-[#141414] tracking-tight leading-none bg-[#F9F9F9] border-b-2 border-black/[0.1] focus:border-[#FF5F00] outline-none pb-2 transition-colors"
            placeholder="Document Title"
          />
        ) : (
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-[#141414] tracking-tight leading-none break-words">
            {content.title || 'Untitled Node'}
          </h1>
        )}

        {/* Source Link Pill */}
        {content.link && !isEditing && (
          <div className="pt-2">
            <div className="inline-flex items-center max-w-full rounded-full bg-[#FFF5EE] border border-[#FFD8C2] px-4 py-2 text-xs sm:text-sm text-[#FF5F00] shadow-sm transition-colors hover:bg-[#FFEFE5] group">
              <LinkIcon className="w-4 h-4 flex-shrink-0 text-[#FF5F00] mr-2" />
              <a 
                className="truncate font-medium underline underline-offset-2 decoration-[#FF5F00]/50 hover:decoration-[#FF5F00]" 
                href={content.link} 
                rel="noopener noreferrer" 
                target="_blank" 
                title={content.link}
              >
                {content.link}
              </a>
              <button 
                aria-label="Copy document URL" 
                className="ml-2.5 p-1 rounded-full text-[#FF5F00]/70 hover:text-[#FF5F00] hover:bg-[#FF5F00]/10 transition" 
                onClick={() => {
                  navigator.clipboard?.writeText(content.link || '');
                  alert('URL copied!');
                }}
                type="button"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* DocumentReadingCard */}
      <section className="bg-white rounded-3xl border border-black/[0.07] p-8 sm:p-12 md:p-16 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] transition-all duration-300">
        {isEditing ? (
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full min-h-[400px] text-lg text-[#141414] bg-neutral-50 p-6 rounded-2xl focus:outline-none focus:bg-white focus:ring-1 focus:ring-black/[0.1] resize-y leading-relaxed"
            placeholder="Start writing..."
          />
        ) : (
          <article className="max-w-none text-[#141414] font-normal leading-relaxed text-[17px] whitespace-pre-wrap">
            {content.textContent || (
              <span className="text-[#a1a1aa] italic">No content available.</span>
            )}
          </article>
        )}

        {/* Footer Metadata */}
        <footer className="mt-12 pt-8 border-t border-black/[0.05] flex flex-wrap items-center justify-between gap-4 text-xs text-[#71717A]">
          <div className="flex items-center gap-4 font-medium uppercase tracking-wider">
            <span>{content.type} Node</span>
            <span className="text-neutral-300">|</span>
            <span>{content.isPublic ? 'Public' : 'Private'}</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {content.tags?.map((tag: any) => (
              <span key={tag._id || tag} className="text-[10px] font-bold px-3 py-1.5 bg-[#f3f3f3] text-[#71717A] rounded-md uppercase tracking-wider">
                {tag.title || tag}
              </span>
            ))}
          </div>
        </footer>
      </section>

    </main>
  );
};
