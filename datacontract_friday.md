Markdown
# Second Brain API Data Contract (v1)

- **Base URL:** `http://localhost:8000/api/v1`
- **Content-Type:** `application/json` (except document upload which requires `multipart/form-data`)
- **Authentication:** 
  - Access Token: Passed via `Authorization: Bearer <accessToken>` header.
  - Refresh Token: Stored automatically in `HttpOnly`, `SameSite=Strict` cookie (`refreshToken`).
  - CORS requirement: Frontend HTTP clients **must** configure `withCredentials: true` / `credentials: "include"`.

---

## 1. Global Schemas

### Standard Error Response (400, 401, 404, 409, 422, 500)
```typescript
interface ApiErrorResponse {
  message: string;
}
Auth Expired Error (401)
Trigger for frontend Axios interceptor to invoke /auth/refresh-token.

TypeScript
interface TokenExpiredResponse {
  message: "Token expired";
  expired: true;
}
Zod Validation Error Response (400)
TypeScript
interface ValidationErrorResponse {
  message: "Validation failed";
  errors: {
    formErrors: string[];
    fieldErrors: Record<string, string[]>;
  };
}
2. Core Entities
TypeScript
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
  textContent?: string; // Omitted in list views, included in detail view
  isPublic: boolean;
  tags: Tag[]; // Array of Tag objects (or empty array)
  userId: string;
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string; // ISO 8601 string
  updatedAt: string; // ISO 8601 string
  __v: number;
}

export interface PaginationMetadata {
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}
3. Auth Domain (/auth)
3.1 Register User
Method / Endpoint: POST /auth/signup

Auth: Public

Request Body:

TypeScript
interface SignupRequest {
  username: string; // min: 3 characters
  password: string; // min: 8 characters
}
Responses:

201 Created: Sets refreshToken cookie.

TypeScript
interface SignupSuccessResponse {
  message: "Account created successfully";
  accessToken: string;
  user: UserSummary;
}
3.2 Login User
Method / Endpoint: POST /auth/login

Auth: Public

Request Body:

TypeScript
interface LoginRequest {
  username: string;
  password: string;
}
Responses:

200 OK: Sets refreshToken cookie.

TypeScript
interface LoginSuccessResponse {
  message: "Logged in successfully";
  accessToken: string;
  user: UserSummary;
}
3.3 Refresh Access Token
Method / Endpoint: POST /auth/refresh-token

Auth: Requires refreshToken in Cookie.

Request Body: None.

Responses:

200 OK: Rotates and sets new refreshToken cookie.

TypeScript
interface RefreshSuccessResponse {
  message: "Access token refreshed";
  accessToken: string;
}
3.4 Logout
Method / Endpoint: POST /auth/logout

Auth: Bearer Token required.

Responses:

401 Unauthorized (If token expired): Requires token refresh first.

200 OK: Clears refreshToken cookie.

4. Content Domain (/content)
(Note: Based on your Postman collection, these are mounted at /content/content)

4.1 Create Content
Method / Endpoint: POST /content/content

Auth: Bearer Token required.

Payload Rules:

Types note, tweet, article, video: Send as application/json.

Type document: Must send as multipart/form-data.

JSON Body (note, tweet, article, video):
TypeScript
interface CreateContentJsonRequest {
  type: "note" | "tweet" | "article" | "video";
  title?: string; // Optional
  link?: string; // Required for tweets/videos/articles
  textContent?: string; // Content for notes
  isPublic?: boolean; 
  tags?: string[]; 
}
FormData (document):
type: "document" (Text)

title: string (Text, optional)

isPublic: "true" | "false" (Text, optional)

file: Binary file (.pdf only)

Responses:

201 Created:

TypeScript
interface CreateContentResponse {
  message: "Content created successfully";
  content: Omit<ContentItem, "textContent">;
}
4.2 List Content (Paginated)
Method / Endpoint: GET /content/content?page=1&limit=20

Auth: Bearer Token required.

Responses:

200 OK:

TypeScript
interface GetContentListResponse {
  message: "Content fetched successfully";
  pagination: PaginationMetadata;
  content: Omit<ContentItem, "textContent">[];
}
4.3 Get Single Content
Method / Endpoint: GET /content/content/:id

Auth: Bearer Token required.

Responses:

200 OK:

TypeScript
interface GetSingleContentResponse {
  message: "Content fetched successfully";
  content: ContentItem; // Includes full textContent
}
4.4 Update Content (Partial)
Method / Endpoint: PATCH /content/content/:id

Auth: Bearer Token required.

Request Body:

TypeScript
interface UpdateContentRequest {
  title?: string;
  link?: string;
  textContent?: string;
  isPublic?: boolean;
  tags?: string[];
}
Responses:

200 OK:

TypeScript
interface UpdateContentResponse {
  message: "Content updated successfully";
  content: ContentItem;
}
4.5 Delete Content
Method / Endpoint: DELETE /content/content/:id

Auth: Bearer Token required.

Responses:

200 OK: {"message": "Content deleted successfully"}

5. Public Brain Domain (/share)
5.1 Toggle Brain Sharing
Method / Endpoint: POST /share/brain/share

Auth: Bearer Token required.

Request Body:

TypeScript
interface ToggleShareRequest {
  share: boolean;
}
Responses:

201 Created (When enabled first time):

TypeScript
interface CreateShareResponse {
  link: string; // 64-character hex hash
  message: "Shareable link created";
}
200 OK (When updated):

TypeScript
interface UpdateShareResponse {
  link?: string; // Present if share === true
  message: "Sharing enabled" | "Sharing disabled. Your brain is now private.";
}
5.2 Access Public Brain
Method / Endpoint: GET /share/brain/:brainLink

Auth: Public

Responses:

200 OK:

TypeScript
interface PublicBrainResponse {
  username: string;
  content: Omit<ContentItem, "textContent">[];
  hasMore: boolean;
}
6. Hybrid RAG Search Domain (/search)
6.1 Query Second Brain
Method / Endpoint: POST /search/search

Auth: Bearer Token required.

Request Body:

TypeScript
interface SearchBrainRequest {
  query: string;
}
Responses:

200 OK:

TypeScript
export interface SearchSourceChunk {
  title: string;
  text: string;
  score: number; // Qdrant semantic/fusion score
}

export interface SearchBrainResponse {
  answer: string; // LLM generated response
  sources: SearchSourceChunk[];
}

---

### Critical Architecture & Deployment Notes

**1. The Jina Embeddings Transition**
Switching to Jina Embeddings (likely `jina-embeddings-v3`) is a massive upgrade for RAG retrieval quality, especially since it natively supports Matryoshka representation learning (letting you truncate dimensions dynamically) and task-specific prefixes. 
*   **Vector Dimension Mismatch:** You *must* update `DENSE_VECTOR_DIMENSIONS` in your `qdrant.js` initialization file. If you were previously using 768 or 256 for Llama/Nomic, Jina defaults to 1024. If you insert a 1024-dimension Jina vector into a 768-dimension Qdrant collection, Qdrant will instantly reject the payload and crash your ingestion pipeline.
*   **The Database Wipe:** You cannot mix embeddings from two different models in the same semantic space. Before deploying, you must drop your existing local/cloud Qdrant collection entirely and let your server recreate it with the new Jina dimensions, then re-embed your existing MongoDB documents.

**2. The Qdrant Cloud Transition**
Since you are moving off a local Docker container to Qdrant Cloud, your `qdrantClient` configuration must strictly enforce remote authentication. 
Ensure your `.env` requires:
```env
QDRANT_HOST=https://your-cluster-url.aws.cloud.qdrant.io
QDRANT_API_KEY=your_qdrant_cloud_api_key
# Ensure QDRANT_PORT is NOT set to 6333 (Cloud uses standard 443 via HTTPS host)