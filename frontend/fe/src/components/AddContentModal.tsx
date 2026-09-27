import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { CreateContentJsonRequest, CreateContentResponse, ApiErrorResponse, ValidationErrorResponse, ContentType } from '../types/api';
import { PlusCircle, X, File, Loader2 } from 'lucide-react';
import { AxiosError } from 'axios';

interface AddContentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddContentModal: React.FC<AddContentModalProps> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  
  const [type, setType] = useState<ContentType>('note');
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [textContent, setTextContent] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  
  const [errorMsg, setErrorMsg] = useState('');

  const createMutation = useMutation<CreateContentResponse, AxiosError<ApiErrorResponse | ValidationErrorResponse>, void>({
    mutationFn: async () => {
      if (type === 'document') {
        if (!file) throw new Error("File is required for document upload");
        
        const formData = new FormData();
        formData.append('type', 'document');
        if (title) formData.append('title', title);
        formData.append('isPublic', isPublic ? 'true' : 'false');
        formData.append('file', file);
        
        const response = await apiClient.post<CreateContentResponse>('/content/content', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        return response.data;
      } else {
        const payload: CreateContentJsonRequest = {
          type,
          title,
          link: link || undefined,
          textContent: textContent || undefined,
          isPublic,
          tags: [], // Using empty tags as the design didn't include a tags input
        };
        const response = await apiClient.post<CreateContentResponse>('/content/content', payload);
        return response.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content'] });
      resetForm();
      onClose();
    },
    onError: (error) => {
      if (error instanceof Error && error.message === "File is required for document upload") {
        setErrorMsg(error.message);
        return;
      }
      if (error.response?.data) {
        const data = error.response.data;
        if ('errors' in data) {
          const messages = Object.values(data.errors.fieldErrors).flat();
          setErrorMsg(messages.join(', ') || data.message);
        } else {
          setErrorMsg(data.message);
        }
      } else {
        setErrorMsg('Network error occurred. Please try again.');
      }
    }
  });

  const resetForm = () => {
    setType('note');
    setTitle('');
    setLink('');
    setTextContent('');
    setIsPublic(false);
    setFile(null);
    setErrorMsg('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    createMutation.mutate();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl p-7 flex flex-col gap-5 relative animate-in fade-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#ffdbce] flex items-center justify-center text-[#fe5f00]">
              <PlusCircle className="w-[18px] h-[18px]" />
            </div>
            <h2 className="text-lg font-bold text-black">Ingest Memory Object</h2>
          </div>
          <button 
            className="w-8 h-8 rounded-full hover:bg-[#f3f3f3] flex items-center justify-center text-[#747878] transition-colors" 
            onClick={handleClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm font-semibold border border-red-100">
            {errorMsg}
          </div>
        )}

        {/* Type Selectors */}
        <div className="grid grid-cols-5 gap-1.5 p-1 bg-[#f3f3f3] rounded-2xl">
          {(['note', 'article', 'tweet', 'video', 'document'] as ContentType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`py-2 rounded-xl text-center text-xs transition-all ${
                type === t 
                  ? 'font-bold bg-[#141414] text-white shadow-sm' 
                  : 'font-semibold text-[#444748] hover:text-black'
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Form Inputs */}
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-[#555] uppercase tracking-wider">Title / Descriptor</label>
            <input 
              className="px-4 py-2.5 rounded-xl border border-[#e2e2e2] bg-[#f9f9f9] text-black text-sm outline-none focus:border-[#fe5f00] focus:bg-white transition-colors" 
              placeholder="e.g. Distributed Event Stream Consistency" 
              type="text"
              required={type !== 'document'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          
          {type !== 'document' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-[#555] uppercase tracking-wider">Source URL / Reference (Optional)</label>
              <input 
                className="px-4 py-2.5 rounded-xl border border-[#e2e2e2] bg-[#f9f9f9] text-black text-sm outline-none focus:border-[#fe5f00] focus:bg-white transition-colors" 
                placeholder="https://..." 
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                required={type === 'article' || type === 'tweet' || type === 'video'}
              />
            </div>
          )}

          {type === 'document' ? (
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-[#555] uppercase tracking-wider">Upload File</label>
              <div className="border-2 border-dashed border-[#e2e2e2] rounded-xl p-6 flex flex-col items-center justify-center bg-[#f9f9f9] hover:bg-[#f3f3f3] transition-colors cursor-pointer relative focus-within:border-[#fe5f00]">
                 <input 
                   type="file" 
                   onChange={(e) => setFile(e.target.files?.[0] || null)}
                   className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                   required
                 />
                 <File className="w-8 h-8 text-[#9ca3af] mb-2" />
                 <p className="text-[13px] font-semibold text-[#555]">
                   {file ? file.name : 'Click to select or drag & drop'}
                 </p>
                 {!file && <span className="text-[11px] text-[#8c8f90] mt-1">PDF, Markdown, or Images</span>}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-[#555] uppercase tracking-wider">Content Body / Summary</label>
              <textarea 
                className="px-4 py-2.5 rounded-xl border border-[#e2e2e2] bg-[#f9f9f9] text-black text-sm outline-none focus:border-[#fe5f00] focus:bg-white resize-none transition-colors" 
                placeholder="Record insight, paste text extract, or specify context..." 
                rows={3}
                required={type === 'note'}
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                className="w-4 h-4 rounded text-[#fe5f00] focus:ring-0 border-gray-300"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              <span className="text-xs text-[#555] font-medium">Publish to Public Brain</span>
            </label>
            <div className="flex items-center gap-2">
              <button 
                className="px-4 py-2 rounded-full text-xs font-semibold text-[#555] hover:bg-[#f3f3f3] transition-all" 
                type="button"
                onClick={handleClose}
              >
                Cancel
              </button>
              <button 
                className="px-5 py-2 rounded-full text-xs font-bold bg-[#fe5f00] hover:bg-[#e05400] text-white shadow-md transition-all flex items-center gap-1.5 disabled:opacity-70" 
                type="submit"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save to Memory
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
