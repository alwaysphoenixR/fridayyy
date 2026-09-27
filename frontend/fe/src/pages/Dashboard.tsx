import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FileText,
  Link as LinkIcon,
  FileVideo,
  Search,
  Plus,
  Share2,
  Copy,
  MoreVertical,
  Globe,
  Lock,
  BrainCircuit,
} from "lucide-react";
import { CustomSpinner } from "../components/CustomSpinner";
import { apiClient } from "../api/client";
import {
  GetContentListResponse,
  ContentItem,
  ToggleShareRequest,
  CreateShareResponse,
  UpdateShareResponse,
} from "../types/api";
import { useAuth } from "../contexts/AuthContext";
import { AddContentModal } from "../components/AddContentModal";

const getIconForType = (type: string) => {
  switch (type.toLowerCase()) {
    case "note":
      return <FileText className="w-[17px] h-[17px] text-[#e82c16]" />;
    case "tweet":
      return <LinkIcon className="w-[17px] h-[17px] text-[#555]" />;
    case "video":
      return <FileVideo className="w-[17px] h-[17px] text-[#555]" />;
    case "article":
      return <FileText className="w-[17px] h-[17px] text-[#555]" />;
    case "document":
      return <FileText className="w-[17px] h-[17px] text-[#555]" />;
    default:
      return <FileText className="w-[17px] h-[17px] text-[#555]" />;
  }
};

const getTextColorForType = (type: string) => {
  if (type.toLowerCase() === "note") return "text-[#e82c16]";
  return "text-[#1a1c1c]";
};

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const limit = 20;

  const [searchParams, setSearchParams] = useSearchParams();
  const filterType = searchParams.get("filter") || "ALL";
  const [visibilityFilter, setVisibilityFilter] = useState<"ALL" | "PUBLIC" | "PRIVATE">("ALL");

  const handleVisibilityToggle = (filter: "PUBLIC" | "PRIVATE") => {
    if (visibilityFilter === filter) {
      setVisibilityFilter("ALL");
    } else {
      setVisibilityFilter(filter);
    }
  };

  const { data, isLoading, isError, error } = useQuery<GetContentListResponse>({
    queryKey: ["content", page],
    queryFn: async () => {
      const response = await apiClient.get<GetContentListResponse>(
        `/content/content?page=${page}&limit=${limit}`,
      );
      return response.data;
    },
  });

  const shareMutation = useMutation<
    CreateShareResponse | UpdateShareResponse,
    Error,
    boolean
  >({
    mutationFn: async (share) => {
      const payload: ToggleShareRequest = { share };
      const response = await apiClient.post<
        CreateShareResponse | UpdateShareResponse
      >("/share/brain/share", payload);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.link) {
        setShareLink(data.link);
        navigator.clipboard.writeText(
          `${window.location.origin}/share/brain/${data.link}`,
        );
        alert("Brain share link copied to clipboard!");
      } else {
        setShareLink(null);
      }
    },
  });

  const handleToggleShare = () => {
    shareMutation.mutate(!shareLink);
  };

  const filteredContent =
    data?.content.filter((item) => {
      const typeMatch = filterType === "ALL" || item.type.toLowerCase() === filterType.toLowerCase();
      const visibilityMatch =
        visibilityFilter === "ALL" ||
        (visibilityFilter === "PUBLIC" && item.isPublic) ||
        (visibilityFilter === "PRIVATE" && !item.isPublic);
      return typeMatch && visibilityMatch;
    }) || [];

  const handleAskFriday = () => {
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="w-full flex-1 max-w-[1600px] mx-auto flex flex-col gap-7">

      {/* Section Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <h1 className="text-[19px] font-bold text-black tracking-tight">
            {filterType === "ALL"
              ? "All Content"
              : filterType.charAt(0).toUpperCase() + filterType.slice(1) + "s"}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#ebebeb] p-1 rounded-full gap-0.5 border border-black/[0.04]">
            <button
              type="button"
              onClick={() => handleVisibilityToggle("PUBLIC")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                visibilityFilter === "PUBLIC"
                  ? "bg-white text-black shadow-sm"
                  : "text-[#5a5c5d] hover:text-black"
              }`}
            >
              <Globe className={`w-[15px] h-[15px] ${visibilityFilter === "PUBLIC" ? "text-[#fe5f00]" : ""}`} />
              <span>Public</span>
            </button>
            <button
              type="button"
              onClick={() => handleVisibilityToggle("PRIVATE")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                visibilityFilter === "PRIVATE"
                  ? "bg-white text-black shadow-sm"
                  : "text-[#5a5c5d] hover:text-black"
              }`}
            >
              <Lock className={`w-[15px] h-[15px] ${visibilityFilter === "PRIVATE" ? "text-[#fe5f00]" : ""}`} />
              <span>Private</span>
            </button>
          </div>
          <button
            onClick={handleToggleShare}
            className={`flex items-center gap-1.5 border px-4 py-2 rounded-full text-xs font-semibold shadow-sm transition-all ${
              shareLink
                ? "bg-brand-black text-white border-brand-black hover:bg-black"
                : "bg-white text-[#1a1c1c] border-[#e5e7eb] hover:border-[#d1d5db] hover:bg-[#f9f9f9]"
            }`}
          >
            {shareLink ? (
              <>
                <Lock className="w-[15px] h-[15px] text-[#fe5f00]" />
                <span>Make Brain Private</span>
              </>
            ) : (
              <>
                <Share2 className="w-[15px] h-[15px] text-[#fe5f00]" />
                <span>Make Brain Public</span>
              </>
            )}
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 bg-[#141414] hover:bg-black text-white px-5 py-2.5 rounded-full text-xs font-bold tracking-tight shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Content</span>
          </button>
        </div>
      </div>

      {/* Content Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-24">
          <CustomSpinner className="w-32 h-20 opacity-80" />
        </div>
      ) : isError ? (
        <div className="text-red-500 bg-red-50 p-4 rounded-xl">
          Failed to load content: {error.message}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {filteredContent.map((item) => (
            <div
              key={item._id}
              className="bg-white rounded-3xl p-6 border border-black/[0.06] shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all min-h-[260px] relative group cursor-pointer"
              onClick={() => navigate(`/content/${item._id}`)}
            >
              <div>
                {/* Top Row: Type Pill + Status + Menu */}
                <div className="flex items-center justify-between mb-5">
                  <div
                    className={`flex items-center gap-2 text-xs font-semibold ${getTextColorForType(item.type)}`}
                  >
                    {getIconForType(item.type)}
                    <span className="capitalize">{item.type}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#f3f4f6] text-[#6b7280]">
                      {item.isPublic ? "Public" : "Private"}
                    </span>
                    <button
                      className="w-6 h-6 flex items-center justify-center text-[#9ca3af] hover:text-black rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Menu toggle logic could go here
                      }}
                    >
                      <MoreVertical className="w-[17px] h-[17px]" />
                    </button>
                  </div>
                </div>

                {/* Title & Body */}
                <h3
                  className={`text-[17px] font-bold text-black mb-2 tracking-tight line-clamp-2 ${item.type.toLowerCase() === "note" ? "uppercase" : ""}`}
                >
                  {item.title || "Untitled"}
                </h3>
                <p className="text-xs text-[#8c8f90] leading-relaxed line-clamp-3">
                  {(item as ContentItem).textContent || ""}
                </p>
              </div>

              {/* Link Footer */}
              <div className="pt-6">
                {item.link ? (
                  <a
                    className="flex items-center gap-1.5 text-xs text-[#fe5f00] font-medium hover:underline truncate"
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <LinkIcon className="w-[15px] h-[15px]" />
                    <span className="truncate">
                      {new URL(item.link).hostname.replace("www.", "")}
                    </span>
                  </a>
                ) : (
                  <div className="h-4"></div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <AddContentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
};
