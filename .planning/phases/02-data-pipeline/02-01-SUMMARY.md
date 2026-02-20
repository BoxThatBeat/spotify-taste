---
phase: 02-data-pipeline
plan: 01
subsystem: api
tags: [spotify-api, token-refresh, rate-limiting, express]

# Dependency graph
requires:
  - phase: 01-oauth-foundation
    provides: OAuth tokens and session storage for both users
provides:
  - Backend API endpoint for fetching Spotify top artists and tracks
  - Automatic token refresh with 5-minute expiry buffer
  - Rate limit handling with exponential backoff
  - Parallel data fetching for both users (4 concurrent API calls)
affects: [03-comparison-engine, 02-02-ui-time-selector]

# Tech tracking
tech-stack:
  added: []
  patterns: [token-refresh-middleware, exponential-backoff-retry, parallel-api-fetching]

key-files:
  created: [routes/spotify-data.js]
  modified: [server.js]

key-decisions:
  - "5-minute buffer before token expiry for proactive refresh"
  - "Exponential backoff for rate limit retries (1s, 2s, 4s with max 3 attempts)"
  - "Parallel fetching: both users fetch artists and tracks concurrently (4 API calls)"
  - "Full error details in development mode for easier debugging"

patterns-established:
  - "Token refresh: Check expiresAt before API calls, refresh if needed, update session"
  - "Rate limit handling: Retry with Retry-After header, exponential backoff on subsequent failures"
  - "Error responses: Include technical details in development, stack traces for debugging"

# Metrics
duration: 2 min
completed: 2026-02-20
---

# Phase 2 Plan 1: Data Pipeline Summary

**Backend API endpoint with automatic token refresh, parallel fetching, and graceful rate limit handling using spotify-web-api-node**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-20T01:11:35Z
- **Completed:** 2026-02-20T01:13:56Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- GET `/api/fetch-data` endpoint accepts timeRange query parameter (short_term, medium_term, long_term)
- Automatic token refresh when tokens expired (5-minute buffer before actual expiry)
- Parallel data fetching: 4 concurrent Spotify API calls (both users' top artists + top tracks)
- Rate limit retry logic with exponential backoff (max 3 retries, respects Retry-After header)
- Normalized JSON response with displayName, topArtists, topTracks for both users
- Full error details in development mode for debugging

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Spotify data fetching route with token refresh** - `f295fec` (feat)
2. **Task 2: Mount Spotify data route in Express app** - `619b26b` (feat)

**Plan metadata:** (pending - will be created after this summary)

## Files Created/Modified

- `routes/spotify-data.js` - GET /api/fetch-data endpoint with token refresh, rate limiting, and parallel fetching (263 lines)
- `server.js` - Mount Spotify data routes after auth routes

## Decisions Made

**Token refresh timing:**
- Used 5-minute buffer before actual token expiry to proactively refresh
- Rationale: Prevents mid-request token expiration, gives time for 4 concurrent API calls

**Rate limit strategy:**
- Exponential backoff: 1s → 2s → 4s with max 3 retries
- Respects Retry-After header from Spotify if present
- Rationale: Balances responsiveness with API rate limit compliance

**Parallel fetching pattern:**
- Promise.all for both users (outer level)
- Promise.all for artists + tracks per user (inner level)
- Result: 4 concurrent API calls complete faster than sequential
- Rationale: Minimize user wait time for in-person comparison use case

**Error handling:**
- Full technical details in response body (not generic messages)
- Stack traces in development mode
- Rationale: User explicitly requested debuggability over polish (from 02-CONTEXT.md)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - implementation proceeded smoothly.

## User Setup Required

None - no external service configuration required beyond existing Spotify OAuth credentials from Phase 1.

## Next Phase Readiness

**Ready for:**
- 02-02-PLAN.md: Frontend time range selector UI can now call this endpoint
- Phase 3 (Comparison Engine): API returns structured data ready for comparison logic

**Implementation notes for next phase:**
- Response format: `{userA: {displayName, topArtists: [], topTracks: []}, userB: {...}, timeRange: "..."}`
- Each artist: `{id, name, images, genres}`
- Each track: `{id, name, album: {images}, artists: [{name}]}`
- Error handling: 400 (missing auth/invalid params), 401 (expired session), 503 (rate limited), 500 (other)

---
*Phase: 02-data-pipeline*
*Completed: 2026-02-20*
