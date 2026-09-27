export type ContentType = "note" | "tweet" | "article" | "video" | "document";

export interface UserSummary {
  id: string;
  username: string;
}

export interface Tag {
  _id: string;
  title: string;
}

export interface ContentItem {
  _id: string;
  title: string;
  type: ContentType;
  link?: string;
  textContent?: string;
  isPublic: boolean;
  tags: Tag[];
  userId: string;
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface PaginationMetadata {
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface ApiErrorResponse {
  message: string;
}

export interface TokenExpiredResponse {
  message: "Token expired";
  expired: true;
}

export interface ValidationErrorResponse {
  message: "Validation failed";
  errors: {
    formErrors: string[];
    fieldErrors: Record<string, string[]>;
  };
}

export interface SignupSuccessResponse {
  message: "Account created successfully";
  accessToken: string;
  user: UserSummary;
}

export interface LoginSuccessResponse {
  message: "Logged in successfully";
  accessToken: string;
  user: UserSummary;
}

export interface RefreshSuccessResponse {
  message: "Access token refreshed";
  accessToken: string;
}

export interface CreateContentJsonRequest {
  type: "note" | "tweet" | "article" | "video";
  title?: string;
  link?: string;
  textContent?: string;
  isPublic?: boolean;
  tags?: string[];
}

export interface CreateContentResponse {
  message: "Content created successfully";
  content: Omit<ContentItem, "textContent">;
}

export interface GetContentListResponse {
  message: "Content fetched successfully";
  pagination: PaginationMetadata;
  content: Omit<ContentItem, "textContent">[];
}

export interface GetSingleContentResponse {
  message: "Content fetched successfully";
  content: ContentItem;
}

export interface UpdateContentRequest {
  title?: string;
  link?: string;
  textContent?: string;
  isPublic?: boolean;
  tags?: string[];
}

export interface UpdateContentResponse {
  message: "Content updated successfully";
  content: ContentItem;
}

export interface ToggleShareRequest {
  share: boolean;
}

export interface CreateShareResponse {
  link: string;
  message: "Shareable link created";
}

export interface UpdateShareResponse {
  link?: string;
  message: "Sharing enabled" | "Sharing disabled. Your brain is now private.";
}

export interface PublicBrainResponse {
  username: string;
  content: Omit<ContentItem, "textContent">[];
  hasMore: boolean;
}

export interface SearchBrainRequest {
  query: string;
}

export interface SearchSourceChunk {
  title: string;
  text: string;
  score: number;
}

export interface SearchBrainResponse {
  answer: string;
  sources: SearchSourceChunk[];
}
