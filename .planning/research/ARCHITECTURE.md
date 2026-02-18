# Architecture Research

**Domain:** Spotify OAuth Web Application (Two-User Comparison)
**Researched:** 2026-02-18
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Browser)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │  Login   │  │ Results  │  │  Grid    │  │  Images  │    │
│  │  Flow    │  │  Page    │  │  View    │  │  Display │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
│       │             │             │             │           │
│       └─────────────┴─────────────┴─────────────┘           │
│                         │                                    │
│                         ↓                                    │
├─────────────────────────────────────────────────────────────┤
│                   Backend API (Node.js)                      │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              OAuth Routes                           │    │
│  │  /login/userA → /callback → /login/userB           │    │
│  └─────────────────────┬───────────────────────────────┘    │
│  ┌─────────────────────┴───────────────────────────────┐    │
│  │         Session/State Management                    │    │
│  │  (stores tokens, state, user identifiers)          │    │
│  └─────────────────────┬───────────────────────────────┘    │
│  ┌─────────────────────┴───────────────────────────────┐    │
│  │          Spotify API Client                         │    │
│  │  (fetches top tracks/artists for both users)       │    │
│  └─────────────────────┬───────────────────────────────┘    │
│  ┌─────────────────────┴───────────────────────────────┐    │
│  │          Comparison Engine                          │    │
│  │  (finds exact matches between datasets)            │    │
│  └─────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│                   Spotify Web API                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   OAuth      │  │  Top Items   │  │   Artist/    │      │
│  │  Endpoints   │  │   Endpoint   │  │  Album Data  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Frontend Router** | Initiates login flow, displays results | React Router / Next.js routing |
| **OAuth Handler** | Manages authorization code flow for 2 users | Express routes with session middleware |
| **Session Store** | Temporarily stores tokens and comparison state | express-session with MemoryStore or Redis |
| **Spotify API Client** | Wraps Spotify Web API calls with auth | axios/fetch with bearer token headers |
| **Comparison Engine** | Matches artists/tracks by ID | Pure function comparing two datasets |
| **Results Presenter** | Renders matched items in grid format | React components with image display |

## Recommended Project Structure

```
src/
├── client/                # Frontend application
│   ├── components/        # React components
│   │   ├── LoginButton.tsx
│   │   ├── ComparisonGrid.tsx
│   │   └── ArtistCard.tsx
│   ├── pages/            # Route pages
│   │   ├── index.tsx     # Landing page
│   │   └── results.tsx   # Comparison results
│   └── utils/            # Client utilities
│       └── api.ts        # Backend API calls
├── server/               # Backend application
│   ├── routes/           # Express routes
│   │   ├── auth.ts       # OAuth flow endpoints
│   │   └── api.ts        # Spotify data endpoints
│   ├── services/         # Business logic
│   │   ├── spotifyClient.ts  # Spotify API wrapper
│   │   └── comparison.ts     # Matching logic
│   ├── middleware/       # Express middleware
│   │   └── session.ts    # Session configuration
│   └── types/            # TypeScript types
│       └── spotify.ts    # API response types
└── shared/               # Shared code
    └── types/            # Common types
```

### Structure Rationale

- **client/server split:** Clear separation between frontend and backend concerns. Backend protects client secret.
- **services/:** Business logic separated from route handlers for testability and reusability.
- **middleware/:** Session management centralized for consistent state handling across OAuth flow.
- **shared/types/:** TypeScript types used by both client and server to ensure consistency.

## Architectural Patterns

### Pattern 1: Sequential OAuth Flow with State Preservation

**What:** Handle two separate OAuth authorizations in sequence while maintaining session state.

**When to use:** When comparing data from multiple Spotify users without persisting their data long-term.

**Trade-offs:** 
- Pros: Simple state management, no database required, clear user flow
- Cons: Users must complete both authorizations in same session, session expires if left idle

**Example:**
```typescript
// server/routes/auth.ts
app.get('/login/:userId', (req, res) => {
  const { userId } = req.params; // 'userA' or 'userB'
  const state = generateRandomString(16);
  
  // Store state and userId in session
  req.session.oauthState = state;
  req.session.currentUser = userId;
  
  const authUrl = `https://accounts.spotify.com/authorize?${new URLSearchParams({
    response_type: 'code',
    client_id: process.env.SPOTIFY_CLIENT_ID,
    scope: 'user-top-read',
    redirect_uri: process.env.REDIRECT_URI,
    state: state
  })}`;
  
  res.redirect(authUrl);
});

app.get('/callback', async (req, res) => {
  const { code, state } = req.query;
  
  // Verify state matches
  if (state !== req.session.oauthState) {
    return res.status(403).send('State mismatch');
  }
  
  // Exchange code for tokens
  const tokens = await exchangeCodeForTokens(code);
  
  // Store tokens keyed by user
  const userId = req.session.currentUser;
  req.session.tokens = req.session.tokens || {};
  req.session.tokens[userId] = tokens;
  
  // If userA just logged in, redirect to userB login
  if (userId === 'userA') {
    return res.redirect('/login/userB');
  }
  
  // Both users authorized, redirect to results
  res.redirect('/results');
});
```

### Pattern 2: Server-Side Comparison with Client-Side Rendering

**What:** Fetch and compare data on backend, send only matched results to frontend.

**When to use:** When privacy matters (don't send full datasets to client) and when comparison logic is complex.

**Trade-offs:**
- Pros: Reduces data sent to client, protects user privacy, backend handles API rate limits
- Cons: Requires backend round-trip for results, can't do client-side filtering

**Example:**
```typescript
// server/routes/api.ts
app.get('/api/compare', async (req, res) => {
  const { tokens } = req.session;
  
  if (!tokens?.userA || !tokens?.userB) {
    return res.status(401).json({ error: 'Both users must be authorized' });
  }
  
  // Fetch data for both users in parallel
  const [userAData, userBData] = await Promise.all([
    spotifyClient.getTopItems(tokens.userA.access_token, 'artists', 50),
    spotifyClient.getTopItems(tokens.userB.access_token, 'artists', 50)
  ]);
  
  // Compare datasets
  const matches = comparisonService.findMatches(
    userAData.items,
    userBData.items
  );
  
  // Send only matched items with images
  res.json({
    matches: matches.map(artist => ({
      id: artist.id,
      name: artist.name,
      images: artist.images,
      genres: artist.genres
    }))
  });
});
```

### Pattern 3: Token Management with Refresh

**What:** Store access tokens and refresh tokens, automatically refresh when expired.

**When to use:** Always for Authorization Code flow (Spotify tokens expire in 1 hour).

**Trade-offs:**
- Pros: Seamless user experience, handles long sessions
- Cons: Adds complexity, requires secure token storage

**Example:**
```typescript
// server/services/spotifyClient.ts
class SpotifyClient {
  async makeAuthenticatedRequest(tokenData, endpoint) {
    try {
      return await fetch(`https://api.spotify.com/v1${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`
        }
      });
    } catch (error) {
      if (error.status === 401) {
        // Token expired, refresh it
        const newTokens = await this.refreshToken(tokenData.refresh_token);
        // Retry with new token
        return await fetch(`https://api.spotify.com/v1${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${newTokens.access_token}`
          }
        });
      }
      throw error;
    }
  }
  
  async refreshToken(refreshToken) {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(
          `${CLIENT_ID}:${CLIENT_SECRET}`
        ).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    });
    
    return await response.json();
  }
}
```

## Data Flow

### Authorization Flow (Two Users)

```
User A clicks "Compare" button
    ↓
Frontend → Backend /login/userA
    ↓
Backend generates state, stores in session
    ↓
Backend redirects to Spotify OAuth
    ↓
User A authorizes → Spotify redirects to /callback
    ↓
Backend validates state, exchanges code for tokens
    ↓
Backend stores User A tokens in session
    ↓
Backend redirects to /login/userB
    ↓
User B authorizes → Spotify redirects to /callback
    ↓
Backend validates state, exchanges code for tokens
    ↓
Backend stores User B tokens in session
    ↓
Backend redirects to /results page
    ↓
Frontend loads, calls /api/compare
```

### Comparison Data Flow

```
Frontend → GET /api/compare
    ↓
Backend retrieves both tokens from session
    ↓
Backend → Spotify API (parallel requests)
    ├── GET /me/top/artists?limit=50 (User A token)
    └── GET /me/top/artists?limit=50 (User B token)
    ↓
Backend receives both datasets
    ↓
Comparison engine finds exact matches by artist ID
    ↓
Backend filters matched items (id, name, images, genres)
    ↓
Backend → Frontend (JSON with matched items)
    ↓
Frontend renders grid with artist cards
```

### Key Data Flows

1. **OAuth State Management:** State parameter generated → stored in session → validated on callback → cleared after use. Prevents CSRF attacks.

2. **Token Storage:** Authorization code → exchanged for access_token + refresh_token → stored in session keyed by userId → retrieved for API calls → refreshed when expired.

3. **Image URLs:** Spotify returns arrays of image objects with different sizes → Backend passes through to frontend → Frontend selects appropriate size for display (largest available for grids).

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | MemoryStore sessions, single Node.js process, no caching. Simple deployment (Vercel, Heroku). |
| 1k-100k users | Redis for session storage (sessions persist across restarts), add response caching (comparison results for 5 minutes), horizontal scaling with load balancer. |
| 100k+ users | Add CDN for static assets, database for analytics (optional), queue system for background API fetches, consider rate limit pooling across instances. |

### Scaling Priorities

1. **First bottleneck:** Session storage in MemoryStore doesn't persist across restarts. **Fix:** Switch to Redis session store. Simple drop-in replacement for express-session.

2. **Second bottleneck:** Spotify API rate limits (180 requests per minute per app). **Fix:** Implement response caching (comparison results don't change rapidly) and request batching where possible.

## Anti-Patterns

### Anti-Pattern 1: Storing Client Secret in Frontend

**What people do:** Include SPOTIFY_CLIENT_SECRET in frontend environment variables or directly in client code.

**Why it's wrong:** Exposes secret to all users (visible in browser DevTools), allows anyone to impersonate your app, violates Spotify's terms of service.

**Do this instead:** Always handle OAuth token exchange on backend. Frontend only receives authorization codes, backend exchanges them using client secret.

### Anti-Pattern 2: Using Implicit Grant Flow

**What people do:** Use Implicit Grant flow (deprecated) for "simpler" frontend-only auth.

**Why it's wrong:** Flow is deprecated by Spotify, less secure (no refresh tokens, tokens in URL), tokens visible in browser history.

**Do this instead:** Use Authorization Code flow with backend token exchange. For SPAs without backend, use Authorization Code with PKCE extension (not applicable here since we need backend for two-user flow).

### Anti-Pattern 3: Not Validating OAuth State Parameter

**What people do:** Skip state parameter validation in OAuth callback.

**Why it's wrong:** Vulnerable to CSRF attacks where attacker tricks user into authorizing attacker's account.

**Do this instead:** Always generate random state, store in session, validate match on callback. Reject requests with mismatched state.

### Anti-Pattern 4: Persisting Tokens in Database

**What people do:** Store access/refresh tokens in database for multi-user comparison apps.

**Why it's wrong:** For ephemeral comparisons, this is over-engineering and creates privacy/security liability. Tokens can be misused if database is compromised.

**Do this instead:** For single-session comparisons, use in-memory session storage with TTL. Tokens auto-expire when session ends. If you need persistent data, store only comparison results (with user consent), not tokens.

### Anti-Pattern 5: Client-Side Only Architecture

**What people do:** Attempt to do everything in frontend (React/Vue SPA) without backend.

**Why it's wrong:** Cannot securely protect client secret, cannot handle two-user OAuth flow properly (state management issues), token refresh complex in frontend-only context.

**Do this instead:** Build proper backend (even serverless functions work) to handle OAuth, token management, and Spotify API calls.

### Anti-Pattern 6: Not Handling Token Expiration

**What people do:** Store access token, use it indefinitely without checking expiration.

**Why it's wrong:** Tokens expire after 1 hour. App breaks with 401 errors.

**Do this instead:** Store access token + refresh token + expiration time. Check expiration before API calls, refresh proactively, or catch 401 errors and refresh reactively.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Spotify OAuth | Server-to-server redirect flow | Must use backend to protect client secret. Frontend initiates, backend handles callback. |
| Spotify Web API | REST API with Bearer token | Rate limited to 180 req/min. Use `/me/top/artists` and `/me/top/tracks` endpoints with `user-top-read` scope. |
| Session Store | Express middleware (express-session) | For MVP: MemoryStore. Production: Redis with connection pooling. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Frontend ↔ Backend | REST API (JSON) | Frontend calls `/login/:userId`, `/api/compare`. Backend returns data or redirects. |
| Backend ↔ Spotify API | HTTPS with OAuth 2.0 | Backend makes authenticated requests with user-specific access tokens. |
| Routes ↔ Services | Direct function calls | Routes handle HTTP concerns, services contain business logic. |
| Session ↔ State | Middleware injects session into req | Session available on all route handlers via `req.session`. |

## Multi-User OAuth Architecture Details

### Session State Structure

For two-user comparison, session must track:

```typescript
interface SessionData {
  // OAuth flow tracking
  oauthState?: string;        // Random state for CSRF protection
  currentUser?: 'userA' | 'userB';  // Which user is currently authorizing
  
  // Token storage
  tokens?: {
    userA?: {
      access_token: string;
      refresh_token: string;
      expires_in: number;
      token_type: 'Bearer';
      scope: string;
    };
    userB?: {
      access_token: string;
      refresh_token: string;
      expires_in: number;
      token_type: 'Bearer';
      scope: string;
    };
  };
  
  // Optional: cache comparison results
  comparisonResults?: {
    matches: SpotifyArtist[];
    timestamp: number;
  };
}
```

### Security Considerations

1. **Session Security:**
   - Use `httpOnly` cookies (prevents XSS access to session ID)
   - Set `secure: true` in production (HTTPS only)
   - Configure `sameSite: 'lax'` (CSRF protection)
   - Set reasonable session TTL (30 minutes for comparison flow)

2. **State Parameter:**
   - Generate cryptographically random string (16+ chars)
   - Store in session, validate on callback
   - Single-use: clear after validation

3. **Token Storage:**
   - Never send tokens to frontend
   - Tokens stay in backend session
   - Clear tokens when comparison complete or session expires

### Required Scopes

For this application, request only what you need:

```typescript
const scopes = [
  'user-top-read',      // Required for /me/top/artists and /me/top/tracks
  'user-read-private'   // Optional: for user profile (display names)
];
```

### Spotify API Endpoints Used

| Endpoint | Purpose | Response |
|----------|---------|----------|
| `GET /me/top/artists?limit=50&time_range=medium_term` | Fetch user's top artists | Array of artist objects with id, name, images, genres |
| `GET /me/top/tracks?limit=50&time_range=medium_term` | Fetch user's top tracks | Array of track objects with id, name, album, artists |

**Time Range Options:**
- `short_term`: ~4 weeks
- `medium_term`: ~6 months (recommended for stable comparisons)
- `long_term`: several years

## Build Order Implications

Based on dependencies between components:

**Phase 1: Backend OAuth Foundation**
- Set up Express server with session middleware
- Implement `/login/:userId` route
- Implement `/callback` route with state validation
- Implement token exchange logic
- Test with single user, then two users sequentially

**Phase 2: Spotify API Integration**
- Create Spotify API client service
- Implement token refresh logic
- Fetch top artists/tracks for single user
- Test error handling (expired tokens, rate limits)

**Phase 3: Comparison Logic**
- Build comparison service (pure functions)
- Implement exact match by artist ID
- Implement exact match by track ID
- Add `/api/compare` endpoint that uses service

**Phase 4: Frontend Display**
- Create landing page with "Compare" button
- Implement results page that calls `/api/compare`
- Build grid components for matched items
- Add image loading and error states

**Phase 5: Polish & Error Handling**
- Add loading states during OAuth redirects
- Handle session expiration gracefully
- Add error pages for failed auth
- Implement rate limit retry logic

**Why this order:**
- OAuth must work before API calls (dependency)
- API client needed before comparison (data dependency)
- Comparison logic can be tested independently
- Frontend builds on working backend (integration)

## Sources

- Spotify Web API - Authorization Code Flow: https://developer.spotify.com/documentation/web-api/tutorials/code-flow (Official documentation, HIGH confidence)
- Spotify Web API - Apps Concept: https://developer.spotify.com/documentation/web-api/concepts/apps (Official documentation, HIGH confidence)
- Spotify Web API - Scopes: https://developer.spotify.com/documentation/web-api/concepts/scopes (Official documentation, HIGH confidence)
- Spotify Web API - Refreshing Tokens: https://developer.spotify.com/documentation/web-api/tutorials/refreshing-tokens (Official documentation, HIGH confidence)

---
*Architecture research for: Spotify Taste Match - Two User Comparison Web App*
*Researched: 2026-02-18*
