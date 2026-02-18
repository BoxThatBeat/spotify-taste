# Project Research Summary

**Project:** Spotify Taste Match  
**Domain:** OAuth-based music comparison web application  
**Researched:** 2026-02-18  
**Confidence:** HIGH  

## Executive Summary

Spotify Taste Match is a visual-first comparison tool that lets two users on the same device compare their music taste through OAuth authorization and shared artist/track discovery. Research shows this domain is well-established with proven patterns: **backend-required architecture** (Node.js/Express for secure OAuth), **Authorization Code flow** (not PKCE, since we need sequential two-user authorization with session state), and **visual grid presentation** with album art/artist images as the core user experience.

The recommended approach prioritizes **security-first OAuth implementation** before feature development. The critical architectural decision is handling two sequential OAuth flows with server-side session management—this is non-negotiable since Spotify's client secret must never reach the frontend. The stack is straightforward: Node.js 20.x LTS + Express 5.x + spotify-web-api-node for the backend, with vanilla JavaScript sufficient for the frontend (React optional but likely overkill for static grid rendering). Deployment on Render or Vercel with serverless functions provides the needed OAuth callback infrastructure.

Key risks center on **OAuth complexity for two users** (state management, token storage, sequential authorization flow) and **rate limiting** in Development Mode (30-second rolling window, 25 user maximum). Mitigation strategies include robust session management from day one, parallel API fetching for both users' data, and planning for Extended Quota Mode if scaling beyond initial testing. The research indicates a 4-phase roadmap: OAuth foundation, API integration, comparison logic, and visual presentation—each building on the previous with clear success criteria.

## Key Findings

### Recommended Stack

The technology stack for Spotify OAuth web apps in 2026 is mature and well-documented. **Node.js 20.x LTS with Express 5.x** provides the backend foundation, specifically chosen because Spotify's official examples use Express and it's lightweight enough for OAuth proxying while extensible for future features. The `spotify-web-api-node` library (v5.x) is the de facto standard for Spotify integration, providing comprehensive API coverage, built-in token refresh, and TypeScript definitions.

**Core technologies:**
- **Node.js 20.x LTS + Express 5.x**: Backend runtime and framework — handles OAuth callbacks, protects client secret, manages session state for two users. Express 5.x is now default on npm with official LTS support.
- **spotify-web-api-node 5.x**: Spotify API wrapper — official recommendation from Spotify examples, handles token refresh automatically, supports all three OAuth flows, 3.2k GitHub stars.
- **express-session 1.18.x + MemoryStore**: Session management — stores OAuth tokens server-side for both users, prevents token exposure to client, sufficient for MVP scale.
- **dotenv 16.x**: Environment variable management — zero-dependency secure credential loading, 20M+ weekly downloads.
- **Vanilla JavaScript ES6+ (or React 18.x with Vite 5.x)**: Frontend — vanilla JS recommended for MVP since project scope is static grid rendering with no complex reactivity needs. React is overkill unless team has strong preference.
- **Render or Vercel**: Deployment platform — Render for traditional Express server (free tier: 750 hrs/month), Vercel for serverless functions approach. Both support automatic HTTPS and GitHub integration.

**Critical version requirements:** Node.js 20.x LTS (supported through April 2026), Express 5.x (now stable), spotify-web-api-node 5.x (active maintenance with 2024 updates).

**Anti-recommendations:** Implicit Grant flow (deprecated by Spotify), Create React App (unmaintained), client-side only architecture (insecure), storing tokens in localStorage without proper XSS protection.

### Expected Features

The feature landscape is dominated by three pillars: profile visualization, comparison mechanics, and social sharing. Research shows users tolerate friction in comparison mechanics if the visual result is compelling and shareable. The most successful apps (musictaste.space, Receiptify) excel at creating *shareable* outputs that become social currency.

**Must have (table stakes):**
- **Spotify OAuth login** — Required for API access, users understand this is necessary. Must use Authorization Code Flow with backend.
- **Time range selection** — Three built-in API ranges: `short_term` (~4 weeks), `medium_term` (~6 months), `long_term` (~years). Users expect this.
- **Top artists and tracks display** — Core comparison data types. API returns up to 50 items each with images, names, IDs.
- **Visual grids with imagery** — Album art and artist photos are essential. Raw text lists feel incomplete.
- **Match percentage calculation** — Single number for compatibility (e.g., "82% match"). Simple formula: `(shared items / total unique items) * 100`.
- **Empty state handling** — When users have 0% overlap, show positive framing: "Your tastes are unique!" or suggest discovery.
- **Mobile responsive design** — 60%+ of music comparison happens on phones in social settings.
- **Clear privacy messaging** — Explain data access, confirm it's not stored (if true), link to Spotify permissions.

**Should have (competitive differentiators):**
- **Compatibility score breakdown** — "Artists: 92%, Tracks: 80%" adds perceived depth without much complexity (10 min to implement).
- **Unique taste highlighting** — "You love these artists your friend hasn't discovered" creates conversation starters (20 min implementation).
- **"Music Twin" special treatment** — Badge or special message for 90%+ matches, users love finding their "music twin" (5 min implementation).
- **Genre-based insights** — "You both love indie rock" summary. Spotify API still returns genres despite deprecation (2-4 hours implementation).
- **Visual collage download** — Generate shareable image of comparison grid. High viral potential but 1-2 days implementation effort.

**Defer (v2+ or anti-features):**
- **User accounts with passwords** — Anti-feature. Users already authenticated via Spotify, don't add friction.
- **Long-term listening history storage** — Privacy concerns, GDPR burden, storage costs. Fetch fresh from Spotify each time.
- **Complex similarity algorithms** — Project explicitly excludes. Users understand "shared artists" better than computed similarity.
- **Social network features** — Massive scope creep. Keep it ephemeral: compare, see results, done.
- **In-app music playback** — Requires Premium, high complexity, limited value. Link to Spotify instead.
- **Historical comparison tracking** — Requires persistence infrastructure. Only valuable with repeat users.

**API limitations to note:** Max 50 items per endpoint, 3 fixed time ranges (no custom ranges), rate limits in Development Mode (30-second rolling window), genre data deprecated but still returned.

### Architecture Approach

The standard architecture for Spotify OAuth web apps separates frontend (browser), backend (Node.js), and Spotify API with clear component boundaries. The critical pattern is **Sequential OAuth Flow with State Preservation**: handling two separate OAuth authorizations in sequence while maintaining server-side session state. This is the core architectural complexity for this project.

**Major components:**
1. **OAuth Handler (Backend)** — Express routes managing Authorization Code flow for two users sequentially. Generates random state parameter (CSRF protection), stores in session, validates on callback, exchanges authorization code for tokens. Routes: `/login/userA`, `/login/userB`, `/callback`.
2. **Session Store (Backend)** — express-session with MemoryStore (MVP) or Redis (production). Stores OAuth state, current user identifier ('userA'/'userB'), access tokens, refresh tokens, and expiration times for both users. Critical for keeping authorization flows separate and secure.
3. **Spotify API Client (Backend)** — Wraps `spotify-web-api-node` with token refresh logic. Makes authenticated requests to `/me/top/artists` and `/me/top/tracks` endpoints. Handles 401 errors (token expiration) by automatically refreshing and retrying. Implements rate limit retry-after logic for 429 errors.
4. **Comparison Engine (Backend)** — Pure function comparing two datasets. Finds exact matches by artist/track ID using Set intersection. Returns only matched items with images to frontend (privacy-preserving—doesn't send full datasets to client).
5. **Results Presenter (Frontend)** — Renders matched items in CSS Grid format. Displays album art, artist images, match percentage, and breakdown by category. Handles missing images with fallback placeholders.

**Key patterns identified:**
- **Sequential OAuth with state**: userA authorizes → backend stores tokens → redirects to userB authorization → both authorized → redirect to results page.
- **Server-side comparison**: Fetch and compare data on backend, send only matched results to frontend (reduces data exposure, handles rate limits centrally).
- **Token management with refresh**: Store access + refresh tokens, check expiration before API calls, automatically refresh when needed (tokens expire after 1 hour).
- **Parallel data fetching**: Use `Promise.all()` to fetch both users' data simultaneously (2x faster than sequential, same rate limit impact).

**Data flow:** Frontend initiates → Backend `/login/userA` → Spotify OAuth → Callback → Store tokens → `/login/userB` → Spotify OAuth → Callback → Store tokens → Frontend calls `/api/compare` → Backend fetches both users' data in parallel → Comparison engine finds matches → Frontend renders grid.

### Critical Pitfalls

Research identified 13 pitfalls across critical/moderate/minor severity. The top 5 most relevant for this project:

1. **Client Secret Exposure in Frontend Code** — **CRITICAL.** Developers often embed client secret in frontend, exposing it in browser dev tools. This allows attackers to impersonate your app, share rate limits, and violates Spotify ToS. **Prevention:** Use Authorization Code flow with backend token exchange (this project's approach). Never include client_secret in frontend code or environment variables accessible to client. Detection: search codebase for `client_secret`, check browser Network tab.

2. **Missing or Incorrect Redirect URI Configuration** — **CRITICAL.** OAuth fails completely if redirect URIs don't match exactly between code and Spotify Developer Dashboard (case-sensitive, protocol-sensitive, even trailing slashes matter). Different behavior between localhost (`http://localhost:3000/callback`) and production (`https://yourdomain.com/callback`). **Prevention:** Add all redirect URIs to Dashboard before testing. Use exact match in code. For two-user flow, same redirect URI works for both users (differentiate with state parameter).

3. **Not Implementing Token Refresh Before Expiration** — **CRITICAL.** Access tokens expire after 1 hour. Apps without proactive refresh will suddenly fail API requests mid-session. For two-user flow, both tokens need independent tracking and refreshing. **Prevention:** Store expiration time with tokens, check before each API call (refresh 10 min before expiry), implement reactive fallback (if 401, refresh and retry once). Use `spotify-web-api-node`'s built-in refresh mechanism.

4. **Poor State Management for Two-User Flow** — **CRITICAL for this project.** Managing two OAuth flows, two token sets, and two datasets without clear state management leads to bugs where tokens get mixed up, wrong user's data appears, or comparison uses same user twice. **Prevention:** Use clear user identifiers in session (`tokens.userA`, `tokens.userB`), encode user number in OAuth state parameter (`state = 'user1_' + randomString()`), add visual indicators in UI (colors, labels), prevent re-authorization confusion.

5. **Ignoring Rate Limits in Development Mode** — **HIGH.** Spotify's Development Mode has strict rate limits (30-second rolling window, 25 user maximum). Two-user comparison requires 2x API calls, making limit hits more likely. Parallel requests or pagination can quickly trigger 429 errors. **Prevention:** Use batch endpoints where possible (`limit=50` instead of multiple requests), implement retry-after logic (check `Retry-After` header on 429), fetch both users' data in parallel not sequentially (faster, same limit impact), plan for Extended Quota Mode application if scaling beyond 25 users.

**Additional moderate pitfalls:** Not handling pagination (API returns max 50 items, need to follow `next` field for more), synchronous API requests causing slow UX (use `Promise.all()` for parallelization), missing/null image URLs breaking UI (check for empty `images[]` array, provide fallback placeholders).

**Phase-specific warnings:** Phase 1 (OAuth Setup) is critical—wrong flow choice, redirect URI mismatches, or poor state management require major rewrites. Phase 2 (API Integration) faces rate limiting and token refresh challenges. Phase 3 (UI) needs image handling and pagination logic.

## Implications for Roadmap

Based on architectural dependencies and pitfall mitigation strategies, a **4-phase approach** is strongly recommended:

### Phase 1: OAuth Foundation (Two-User Sequential Flow)
**Rationale:** OAuth must work perfectly before any other features. The two-user sequential authorization flow is the project's core complexity—getting session state management right from the start prevents costly rewrites. This phase addresses the #1 and #2 critical pitfalls (client secret exposure, redirect URI configuration).

**Delivers:** 
- Express server with session middleware (express-session + MemoryStore)
- `/login/userA` and `/login/userB` routes initiating OAuth
- `/callback` route handling Spotify redirects with state validation
- Authorization code → token exchange for both users
- Server-side session storing tokens for userA and userB separately

**Addresses features:** Spotify OAuth login (table stakes)

**Avoids pitfalls:** 
- Client secret stays on backend (never exposed to frontend)
- Redirect URI exact matching tested for localhost and production
- State parameter used for CSRF protection and user identification
- Clear session structure prevents user confusion

**Success criteria:** Both users can authorize sequentially on same device, tokens stored separately in session, no token mixing or state confusion.

### Phase 2: Spotify API Integration
**Rationale:** Once OAuth works, integrate with Spotify Web API using authenticated requests. This phase implements token refresh logic (#3 critical pitfall) before fetching real user data. Must handle rate limiting (#5 critical pitfall) with two-user parallel fetching.

**Delivers:**
- Spotify API client wrapper using `spotify-web-api-node`
- Token refresh logic (proactive and reactive)
- `/api/top-artists` and `/api/top-tracks` endpoints for both users
- Parallel data fetching with `Promise.all()` for performance
- Rate limit retry-after handling (429 errors)
- Time range selection (short/medium/long term)

**Uses stack elements:** 
- `spotify-web-api-node` library for API abstraction
- Built-in token refresh mechanism
- Error handling for 401 (expired token) and 429 (rate limit)

**Addresses features:** Top artists/tracks display, time range selection (table stakes)

**Avoids pitfalls:**
- Token refresh implemented before 1-hour expiration
- Rate limits handled with retry-after logic
- Parallel fetching (not sequential) for performance
- Required scope `user-top-read` included from start

**Success criteria:** Both users' top artists/tracks fetched successfully, tokens refresh automatically, rate limits handled gracefully, parallel requests reduce wait time.

### Phase 3: Comparison Logic & Results API
**Rationale:** With data fetching working, implement comparison algorithm. Server-side comparison keeps full datasets private (only sends matches to frontend). This phase is pure business logic—easily testable, no OAuth/API complexity.

**Delivers:**
- Comparison service with exact match algorithm (Set intersection by ID)
- `/api/compare` endpoint returning matched artists/tracks
- Match percentage calculation (shared / total unique)
- Compatibility score breakdown (artists %, tracks %)
- Empty state detection (0% match handling)

**Implements:** Comparison Engine architecture component

**Addresses features:** 
- Match percentage score (table stakes)
- Compatibility score breakdown (differentiator)
- Empty state handling (table stakes)

**Avoids pitfalls:**
- Server-side comparison protects user privacy
- Only matched items sent to frontend (reduces payload)
- Pure functions = easily unit testable

**Success criteria:** Comparison accurately identifies shared artists/tracks, calculates match percentage correctly, handles edge cases (0% match, 100% match, missing data).

### Phase 4: Visual Grid Presentation
**Rationale:** Final phase focuses on UI/UX polish. With working data pipeline, implement visual grid display with album art and artist images. Handles moderate pitfalls: missing images (#9), pagination for large datasets (#7).

**Delivers:**
- Landing page with "Start Comparison" flow
- Results page with CSS Grid layout for matched items
- Album art and artist image display (largest available size)
- Fallback placeholders for missing images
- Time range selector UI
- Unique taste highlighting ("You love X, they haven't discovered yet")
- "Music Twin" badge for 90%+ matches
- Mobile responsive design

**Addresses features:**
- Visual grids with imagery (table stakes)
- Mobile responsive design (table stakes)
- Unique taste highlighting (differentiator)
- "Music Twin" special treatment (differentiator)

**Avoids pitfalls:**
- Check for empty `images[]` array, provide fallbacks
- Lazy load images for performance
- Handle pagination if needed (follow `next` field)

**Success criteria:** Grid displays correctly on desktop and mobile, images load with fallbacks for missing ones, match percentage prominently displayed, UI is polished and shareable.

### Phase Ordering Rationale

- **Sequential dependencies:** OAuth → API integration → Comparison → UI. Cannot fetch data without OAuth, cannot compare without data, cannot display without comparison.
- **Risk mitigation:** Most critical pitfalls (#1-4) are addressed in Phases 1-2, preventing project-blocking issues early.
- **Architectural alignment:** Follows data flow from ARCHITECTURE.md: authorization → data fetch → comparison → presentation.
- **Testing strategy:** Each phase has clear success criteria and can be tested independently before proceeding.
- **Complexity frontloading:** Hardest technical challenges (OAuth state management, token refresh) tackled first when code is cleanest and easiest to refactor.

### Research Flags

**Phases likely needing deeper research during planning:**
- **Phase 1 (OAuth):** Standard pattern, but two-user sequential flow needs careful state management design. Recommend reviewing `spotify-web-api-node` examples and Express session docs during planning.
- **Phase 2 (API Integration):** Well-documented Spotify API, but rate limiting in Development Mode may require monitoring during implementation. Consider Extended Quota Mode application timeline.

**Phases with standard patterns (skip deep research):**
- **Phase 3 (Comparison Logic):** Pure algorithm, no external dependencies. Standard Set intersection pattern.
- **Phase 4 (Visual Grid):** CSS Grid layout and image display are well-established frontend patterns. No Spotify-specific complexity.

**Optional advanced features for future consideration (post-MVP):**
- Visual collage download (1-2 days effort, high viral potential)
- Genre-based insights (2-4 hours, adds depth)
- Playlist generation from matches (requires additional scope, medium effort)

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| **Stack** | **HIGH** | Verified with official Spotify documentation (Feb 2026), Spotify examples repository uses Express + spotify-web-api-node, Node.js LTS schedule confirmed through April 2026. All recommended technologies actively maintained. |
| **Features** | **MEDIUM-HIGH** | Table stakes verified against multiple live apps (musictaste.space, Receiptify) and Spotify API documentation. Differentiators based on observation of successful patterns but not A/B tested. Anti-features informed by Spotify API limitations. |
| **Architecture** | **HIGH** | Sequential OAuth flow is standard pattern for multi-user authorization. Architecture patterns verified with official Spotify Authorization Code Flow docs. Component boundaries align with separation of concerns best practices. Session management approach is production-proven. |
| **Pitfalls** | **HIGH** | All critical pitfalls sourced from official Spotify documentation (authorization, rate limits, token refresh, scopes). Two-user flow state management is logical extension of single-user pattern. Phase-specific warnings derived from architectural dependencies. |

**Overall confidence:** **HIGH**

Research is comprehensive and well-sourced. All critical technical decisions have official documentation backing. The main uncertainties are product decisions (which differentiators to prioritize), not technical feasibility.

### Gaps to Address

**During planning/implementation:**

1. **Extended Quota Mode timeline** — Development Mode limits app to 25 users. If planning public launch, research Extended Quota Mode requirements (as of May 2025: requires 250k+ MAU and company entity, not individuals). Address in Phase 2 or before public beta.

2. **Exact match score calculation preference** — Research found two interpretations: "75% match" could mean "75% of combined items are shared" vs "75% of User A's items appear in User B's". Validate preferred calculation with mockups during Phase 3 planning.

3. **Image export feature feasibility** — Visual collage download has high viral potential but 1-2 days implementation. Decide during roadmap if this is MVP or v2. Impacts Phase 4 scope significantly.

4. **Session timeout handling** — Research confirms session-based state management but didn't specify optimal timeout for comparison flow. Default express-session is 24 hours; consider 30-60 minute timeout for security. Test during Phase 1.

5. **Production deployment choice** — Render (traditional server) vs Vercel (serverless functions) both work but have architectural differences. Decide based on team preference for serverless vs always-running server. Does not block development—can deploy to either.

**Not blocking, address during execution:**
- Optimal grid size for visual display (5x5 vs 4x6 vs scrollable)
- Time range label naming (Spotify's terms vs user-friendly names)
- Empty state threshold (at what % match does "low compatibility" message appear?)

## Sources

### Primary (HIGH confidence)
- **Spotify Web API - Authorization Code Flow** — Official documentation verified 2026-02-18, covers OAuth flow, state parameter, token exchange
- **Spotify Web API - Refreshing Tokens** — Official tutorial for token refresh mechanism
- **Spotify Web API - Scopes** — Official documentation for required permissions (`user-top-read` for top items)
- **Spotify Web API - Rate Limits** — Official documentation for Development Mode vs Extended Quota Mode
- **Spotify Web API - Get User's Top Items** — Official endpoint reference for `/me/top/artists` and `/me/top/tracks`
- **spotify-web-api-node GitHub** — 3.2k stars, official recommendation, actively maintained (2024 updates)
- **Express.js Official Documentation** — v5.x release notes, session middleware
- **Node.js LTS Schedule** — v20.x LTS through April 2026

### Secondary (MEDIUM confidence)
- **musictaste.space** — Live app observed Feb 2026, feature set and UX patterns documented
- **Receiptify** — Live app observed, visual collage generation feature confirmed
- **Chosic Spotify Playlist Analyzer** — Live app observed, analytics feature set
- **Render Documentation** — Deployment platform comparison, free tier specifications
- **Vercel Documentation** — Serverless functions architecture patterns

### Tertiary (LOW confidence)
- **State of JS 2025 survey** — Framework popularity trends (not Spotify-specific)
- **GitHub topics search "spotify-comparison"** — No active public repositories found (proprietary implementations)

---

*Research completed: 2026-02-18*  
*Ready for roadmap: **YES***  
*Recommended phases: 4 (OAuth → API → Comparison → UI)*  
*Estimated MVP timeline: 2-3 weeks for experienced developer*
