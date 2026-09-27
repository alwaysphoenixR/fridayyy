web application/stitch/projects/17061920480966094572/screens/74378c582a5d45eeafd7625ef79bfa06

\# Design Specification (DESIGN.md) — FRIDAY: Personal Second Brain

&nbsp;

A comprehensive design system and engineering implementation blueprint for building \*\*FRIDAY\*\* with identical typography, Mastercard-inspired clean minimalism, color hierarchy, layouts, and component primitives in Anti-Gravity (or Tailwind CSS \+ React).

&nbsp;

\---

&nbsp;

\#\# 1\. Brand Identity & Visual Language

&nbsp;

\- \*\*Philosophy:\*\* High-clarity cognitive workspace inspired by Mastercard's precision, geometric clarity, and restrained elegance.

\- \*\*Tone:\*\* Crisp, ultra-clean, intellectual, minimalist, focused.

\- \*\*Logo Spec:\*\*

&nbsp;&nbsp;\- Typographic wordmark: \`FRIDAY\` set in \*\*Plus Jakarta Sans\*\* (weight \`900\`, tracking \`+0.05em\`, color \`\#141414\`).

&nbsp;&nbsp;\- Terminal accent: Solid orange circular dot (\`\#FF5F00\`, 8px diameter) immediately following the wordmark.

&nbsp;&nbsp;\- Subtitle badge / kicker: \`SECOND BRAIN\` or \`NEURAL INTERFACE\` in \`text-xs font-semibold tracking-wider text-neutral-500 uppercase\`.

&nbsp;

\---

&nbsp;

\#\# 2\. Color Palette & Token System

&nbsp;

\#\#\# Primary & Monochromatic Scale

\`\`\`css

\--color-brand-black: \#141414;        /\* Primary text, high-emphasis headers, active buttons \*/

\--color-brand-dark: \#1e1e1e;         /\* Elevated dark containers / active states \*/

\--color-brand-gray-900: \#262626;     /\* Deep neutral body elements \*/

\--color-brand-gray-700: \#525252;     /\* Secondary copy, captions \*/

\--color-brand-gray-500: \#737373;     /\* Placeholder text, timestamps \*/

\--color-brand-gray-400: \#a3a3a3;     /\* Subtle borders, muted icons \*/

\--color-brand-gray-200: \#e5e5e5;     /\* Structural divider lines, card borders \*/

\--color-brand-gray-100: \#f3f3f3;     /\* Input fields, subtle pill backgrounds \*/

\--color-brand-gray-50: \#f9f9f9;      /\* Global page surface canvas \*/

\--color-surface-white: \#ffffff;      /\* Cards, floating modals, dropdowns \*/

\`\`\`

&nbsp;

\#\#\# Brand Accent Highlights

\`\`\`css

\--color-accent-orange: \#ff5f00;      /\* Primary CTA highlights, active indicators, AI action \*/

\--color-accent-orange-hover: \#e55500;

\--color-accent-orange-subtle: \#fff4ed; /\* Accent pill background / tag container \*/

\--color-accent-red: \#eb001b;         /\* System error, delete action, live warning tag \*/

\--color-accent-green: \#10b981;       /\* Operational status, 200 OK badges \*/

\`\`\`

&nbsp;

\#\#\# Semantic Surface Hierarchy

| Level | Token | Hex | Usage |

|---|---|---|---|

| Background | \`surface-page\` | \`\#F9F9F9\` | Entire app window backdrop |

| Card Container | \`surface-card\` | \`\#FFFFFF\` | Content items, synthesis cards, modals |

| Nested Container | \`surface-subtle\` | \`\#F3F3F3\` | Text inputs, disabled pills, code blocks |

| Border Default | \`border-subtle\` | \`rgba(0, 0, 0, 0.06)\` | Clean borders separating sections |

| Shadow Default | \`shadow-soft\` | \`0 4px 20px \-2px rgba(0, 0, 0, 0.04)\` | Floating elevation |

| Shadow Modal | \`shadow-modal\` | \`0 24px 48px \-12px rgba(0, 0, 0, 0.14)\` | Add Content dialog |

&nbsp;

\---

&nbsp;

\#\# 3\. Typography & Text Hierarchy

&nbsp;

\*\*Primary Font Family:\*\* \`'Plus Jakarta Sans', system-ui, \-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif\`&nbsp;&nbsp;

\*\*Monospace Font Family:\*\* \`'JetBrains Mono', 'Fira Code', monospace\` (for endpoints, hashes, and token stats)

&nbsp;

\#\#\# Type Scale

\- \*\*Display 1 (Page Title):\*\* \`font-extrabold tracking-tight text-3xl md:text-4xl text-\[\#141414\]\` (e.g., "Executive Cognitive Engine")

\- \*\*Heading 2 (Card / Section Title):\*\* \`font-bold text-xl md:text-2xl text-\[\#141414\] leading-snug\`

\- \*\*Heading 3 (Content Title):\*\* \`font-semibold text-lg text-\[\#141414\]\`

\- \*\*Body Regular:\*\* \`font-normal text-sm md:text-base text-\[\#525252\] leading-relaxed\`

\- \*\*Caption / Meta:\*\* \`font-medium text-xs text-\[\#737373\] tracking-wide\`

\- \*\*Technical Badges / Pills:\*\* \`font-semibold text-xs tracking-wider uppercase\`

\- \*\*API Spec Stamp:\*\* \`font-mono text-xs text-\[\#737373\]\`

&nbsp;

\---

&nbsp;

\#\# 4\. Spacing & Border Radii Guidelines

&nbsp;

\- \*\*Corner Radii:\*\*

&nbsp;&nbsp;\- Buttons, Pills & Badges: \`rounded-full\` (\`9999px\`) for iconic Mastercard pill feel.

&nbsp;&nbsp;\- Cards & Content Blocks: \`rounded-2xl\` (\`16px\` or \`20px\`).

&nbsp;&nbsp;\- Search Omnibar & Modals: \`rounded-3xl\` (\`24px\`).

\- \*\*Inner Rhythm:\*\*

&nbsp;&nbsp;\- Base container padding: \`p-6\` to \`p-8\` (24px \- 32px).

&nbsp;&nbsp;\- Component gap: \`gap-3\` (12px) for pill tags, \`gap-6\` (24px) for dashboard grid cards.

&nbsp;&nbsp;\- Page margins: max width \`1440px\` centered with persistent margins.

&nbsp;

\---

&nbsp;

\#\# 5\. Structural Layout & Frame Blueprint

&nbsp;

The application uses a persistent top header with a two-column desktop frame:

&nbsp;

\`\`\`

┌─────────────────────────────────────────────────────────────────────────────────────────────────┐

│ HEADER: \[ FRIDAY • SECOND BRAIN \]    \[ Brain | Search | Library \]     \[ API: Connected \] \[+ Quick Capture\] \[Avatar\] │

├─────────────────────────┬───────────────────────────────────────────────────────────────────────┤

│ SIDEBAR (w-64 fixed)    │ MAIN APPLICATION CANVAS (flex-1, p-8, bg-\[\#F9F9F9\])                   │

│                         │                                                                       │

│ INTELLIGENCE CORE       │  Omnisearch Hero Bar (⌘K quick trigger)                               │

│ • Brain / Dashboard     │  ─────────────────────────────────────────────────────────────        │

│ • AI Search             │  Content Filtering: \[ALL 48\] \[Notes\] \[Articles\] \[Tweets\] \[Videos\]     │

│ • Ask Friday            │  ─────────────────────────────────────────────────────────────        │

│                         │  Content Grid (3 columns or 2 columns):                               │

│ LIBRARY                 │  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐             │

│ • All Content           │  │ \[Card\] Note    │ │ \[Card\] Article │ │ \[Card\] Tweet   │             │

│ • Notes                 │  │ Dynamic Prog.. │ │ Mastercard Ag..│ │ RAG Chunking.. │             │

│ • Articles              │  └────────────────┘ └────────────────┘ └────────────────┘             │

│ • Tweets                │                                                                       │

│ • Videos / Docs         │  Background Indexer Quota Bar (Bottom status strip)                   │

│ ─────────────────────── │                                                                       │

│ • Public Brain (Active) │                                                                       │

│ • Settings / Logout     │                                                                       │

└─────────────────────────┴───────────────────────────────────────────────────────────────────────┘

\`\`\`

&nbsp;

\---

&nbsp;

\#\# 6\. Core Component Specifications

&nbsp;

\#\#\# A. Persistent Navigation Header

\- \*\*Height:\*\* \`h-20\` (80px), \`border-b border-black/\[0.06\] bg-white/90 backdrop-blur-md sticky top-0 z-40\`.

\- \*\*Left:\*\* \`FRIDAY\` logo (font size 22px, weight 900\) \+ orange dot \+ \`text-xs text-neutral-400 font-semibold tracking-widest pl-3 uppercase\`.

\- \*\*Center Nav Tabs:\*\* Pill container (\`bg-neutral-100 p-1 rounded-full flex gap-1\`).

&nbsp;&nbsp;\- Active: \`bg-white text-\[\#141414\] font-semibold shadow-xs px-4 py-1.5 rounded-full\`.

&nbsp;&nbsp;\- Inactive: \`text-neutral-500 font-medium px-4 py-1.5 hover:text-black rounded-full\`.

\- \*\*Right:\*\*&nbsp;

&nbsp;&nbsp;\- Status indicator: \`• API: /api/v1 Connected\` with pulsing amber/green dot.

&nbsp;&nbsp;\- Primary CTA: \`+ Quick Capture\` pill button (\`bg-\[\#FF5F00\] text-white px-5 py-2.5 rounded-full font-semibold shadow-sm hover:bg-\[\#E55500\]\`).

&nbsp;&nbsp;\- User avatar: 36px circular headshot.

&nbsp;

\#\#\# B. Persistent Sidebar

\- \*\*Width:\*\* \`w-64\`, \`border-r border-black/\[0.06\] bg-white p-6 flex flex-col justify-between\`.

\- \*\*Group Labels:\*\* \`text-\[11px\] font-bold text-neutral-400 tracking-wider uppercase mb-3\`.

\- \*\*Nav Links:\*\* \`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all\`.

&nbsp;&nbsp;\- Active: \`bg-\[\#141414\] text-white font-semibold\`.

&nbsp;&nbsp;\- Inactive: \`text-neutral-600 hover:bg-neutral-100 hover:text-black\`.

\- \*\*Footer items:\*\* Public Brain toggle (\`bg-neutral-50 p-2.5 rounded-xl flex items-center justify-between border border-black/\[0.04\]\`), Settings, and Logout button (\`POST /api/v1/auth/logout\`).

&nbsp;

\#\#\# C. Omnisearch Bar (\`POST /api/v1/search/search\`)

\- \*\*Container:\*\* \`bg-white border border-black/\[0.08\] shadow-sm rounded-full p-2 pl-6 flex items-center gap-4\`.

\- \*\*Input:\*\* \`w-full text-base text-\[\#141414\] placeholder-neutral-400 focus:outline-none bg-transparent\`.

\- \*\*Kbd Badge:\*\* \`⌘ K Quick Trigger\` in \`text-xs bg-neutral-100 text-neutral-500 px-2.5 py-1 rounded-full\`.

\- \*\*Submit Button:\*\* \`bg-\[\#FF5F00\] text-white font-semibold px-6 py-3 rounded-full flex items-center gap-2 hover:bg-\[\#e55500\] transition-colors\`.

\- \*\*Suggested Query Chips:\*\* Rounded pills (\`bg-white border border-neutral-200 text-xs px-3.5 py-1.5 rounded-full text-neutral-700 hover:border-black\`).

&nbsp;

\#\#\# D. Content Grid Cards (\`GET /api/v1/content/content\`)

\- \*\*Card Wrapper:\*\* \`bg-white rounded-2xl border border-black/\[0.06\] p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between\`.

\- \*\*Header:\*\*

&nbsp;&nbsp;\- Type Pill: \`rounded-full text-xs font-semibold px-3 py-1\` (Note: neutral; Article: warm amber; Tweet: cool gray).

&nbsp;&nbsp;\- Status: \`Public\` or \`Private\` badge with subtle lock icon.

&nbsp;&nbsp;\- Action: 3-dot overflow menu for Edit (\`PATCH\`) and Delete (\`DELETE\`).

\- \*\*Body:\*\*

&nbsp;&nbsp;\- Title: \`text-lg font-bold text-\[\#141414\] mb-2 hover:text-\[\#FF5F00\]\`.

&nbsp;&nbsp;\- Description: \`text-sm text-neutral-600 line-clamp-3 leading-relaxed\`.

\- \*\*Footer:\*\*

&nbsp;&nbsp;\- External Link / Source: \`text-xs text-neutral-400 hover:underline flex items-center gap-1\`.

&nbsp;&nbsp;\- Timestamp / Token Count: \`text-xs text-neutral-400 font-mono\`.

&nbsp;

\#\#\# E. AI Synthesis & RAG Results (\`/app/search\`)

\- \*\*Loading Pipeline State:\*\* 3 horizontal progression indicators with checkmarks:

&nbsp;&nbsp;1\. \*Searching your brain...\*

&nbsp;&nbsp;2\. \*Finding relevant knowledge...\*

&nbsp;&nbsp;3\. \*Generating answer...\*

\- \*\*Synthesis Container:\*\* \`bg-neutral-900 text-white rounded-3xl p-8 shadow-xl\`.

&nbsp;&nbsp;\- Pillar Blocks: \`bg-neutral-800/80 rounded-2xl p-6 border border-neutral-700/60 mb-4\`.

&nbsp;&nbsp;\- Highlight Bar: Left border highlight \`border-l-4 border-\[\#FF5F00\]\`.

\- \*\*Retrieved Chunks Matrix:\*\*

&nbsp;&nbsp;\- 3-column source grid showing cosine similarity percentage badges (e.g., \`96% Match\`), snippet previews, and direct \`"Open Source"\` action links.

&nbsp;

\#\#\# F. Add Content Modal (\`POST /api/v1/content/content\`)

\- \*\*Backdrop:\*\* \`bg-black/40 backdrop-blur-sm fixed inset-0 flex items-center justify-center z-50\`.

\- \*\*Dialog Box:\*\* \`bg-white rounded-3xl w-full max-w-2xl p-8 shadow-2xl border border-black/\[0.08\]\`.

\- \*\*Type Selector Tabs:\*\* 5 pills with icons: \*\*Note, Article, Tweet, Video, Document\*\*.

\- \*\*Input Fields:\*\* Rounded containers (\`rounded-xl bg-neutral-50 border border-neutral-200 px-4 py-3 text-sm focus:border-black focus:bg-white\`).

\- \*\*Access Toggle:\*\* Radio switch between \`Public\` and \`Private\` (governs \`isPublic: boolean\`).

\- \*\*CTA Actions:\*\* \`Cancel\` (ghost) vs \`Save to Brain\` (\`bg-\[\#141414\] text-white px-6 py-3 rounded-full font-semibold\`).

&nbsp;

\#\#\# G. Public Brain Sharing Screen (\`/shared/:brainLink\`)

\- \*\*Owner Bar:\*\* URL box with one-click \`Copy Public Link\` button \+ read-only notice badge.

\- \*\*Header Profile:\*\* User avatar, name, and total entries count (\`42 Entries • 1.8k References\`).

\- \*\*Visitor Mode:\*\* Clean read-only view. Edit/Delete actions strictly hidden.

&nbsp;

\#\#\# H. Authentication Screen (\`/login\` & \`/signup\`)

\- \*\*Layout:\*\* Centered single-column card with max-width \`440px\`.

\- \*\*Tabs:\*\* Pill toggle between \`Log In\` and \`Create Account\`.

\- \*\*Fields:\*\* Strictly \*\*Username\*\* and \*\*Password\*\* (No email field per backend API contract).

\- \*\*Architecture Callout Card:\*\* Footnote explaining in-memory token storage, automatic silent rotation on 401, and \`withCredentials: true\`.

&nbsp;

\---

&nbsp;

\#\# 7\. Anti-Gravity / Tailwind Implementation Tokens (Theme Object)

&nbsp;

\`\`\`json

{

&nbsp;&nbsp;"theme": {

&nbsp;&nbsp;&nbsp;&nbsp;"extend": {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"colors": {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"brand": {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"black": "\#141414",

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"dark": "\#1e1e1e",

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"orange": "\#FF5F00",

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"orangeHover": "\#E55500",

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"red": "\#EB001B",

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"surface": "\#F9F9F9",

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"card": "\#FFFFFF",

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"subtle": "\#F3F3F3"

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;}

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;},

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"fontFamily": {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"sans": \["Plus Jakarta Sans", "system-ui", "sans-serif"\],

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"mono": \["JetBrains Mono", "monospace"\]

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;},

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"borderRadius": {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"pill": "9999px",

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"card": "16px",

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"container": "24px"

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;},

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"boxShadow": {

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"card": "0 2px 8px \-1px rgba(0, 0, 0, 0.04), 0 1px 3px \-1px rgba(0, 0, 0, 0.02)",

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"elevated": "0 12px 32px \-4px rgba(0, 0, 0, 0.08)"

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;}

&nbsp;&nbsp;&nbsp;&nbsp;}

&nbsp;&nbsp;}

}

\`\`\`

&nbsp;

&nbsp;