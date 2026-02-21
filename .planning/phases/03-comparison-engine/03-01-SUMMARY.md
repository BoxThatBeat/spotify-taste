---
phase: 03-comparison-engine
plan: 01
subsystem: api
tags: [comparison-engine, jaccard-index, set-operations, spotify-api, express]

# Dependency graph
requires:
  - phase: 02-data-pipeline
    provides: Backend API with token refresh and Spotify data fetching
provides:
  - Server-side comparison engine using Set-based exact ID matching
  - Jaccard similarity index for match percentage calculation
  - POST /api/compare endpoint returning shared artists and tracks
  - Privacy-preserving comparison (only shared results sent to frontend)
affects: [04-visual-results]

# Tech tracking
tech-stack:
  added: []
  patterns: [set-based-matching, jaccard-similarity, privacy-preserving-comparison]

key-files:
  created: [routes/comparison.js]
  modified: [server.js]

key-decisions:
  - "Use JavaScript native Set with filter + has pattern for O(1) intersection (Node 20 compatibility)"
  - "Calculate Jaccard index: |A ∩ B| / (|A| + |B| - |A ∩ B|) × 100 for mathematically sound percentages"
  - "Fetch fresh data in compare endpoint rather than caching for simplicity"
  - "Return only shared items to frontend, never expose full user libraries"

patterns-established:
  - "Comparison flow: validate auth → fetch both users → extract IDs to Sets → calculate intersections → enrich with metadata → return results"
  - "Empty set handling: check union > 0 before division to prevent NaN"
  - "Three-level match reporting: overall (all items), artists match, tracks match"

# Metrics
duration: 5 min
completed: 2026-02-21
---

# Phase 3 Plan 1: Comparison Engine Summary

**Server-side comparison engine using Set-based exact ID matching and Jaccard similarity index for privacy-preserving music taste analysis**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-21T00:17:37Z
- **Completed:** 2026-02-21T00:22:50Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- POST /api/compare endpoint with timeRange parameter (short_term, medium_term, long_term)
- Set-based exact ID matching with O(1) lookup performance using native JavaScript Set
- Jaccard similarity index calculation: |A ∩ B| / (|A| + |B| - |A ∩ B|) × 100
- Three-level match breakdown: overall percentage, artists match, tracks match
- Privacy-preserving: comparison happens server-side, only shared items sent to frontend
- Enriched shared items include full metadata (artist images, track info, album covers)
- Integrated token refresh pattern from spotify-data.js
- Empty set handling prevents division by zero errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Create comparison logic and API endpoint** - `64087b1` (feat)
2. **Task 2: Mount comparison routes in Express app** - `cf2fece` (feat)

**Plan metadata:** (pending - will be created after this summary)

## Files Created/Modified

- `routes/comparison.js` - POST /compare endpoint with Set-based comparison logic, Jaccard index calculation, and metadata enrichment (257 lines)
- `server.js` - Mount comparison routes at /api prefix after spotify-data routes

## Decisions Made

**Comparison algorithm:**
- Used JavaScript native Set with filter + has pattern for Node 20 compatibility
- Rationale: Set.intersection() not available in Node 20 LTS, filter + has provides O(1) lookup

**Match percentage calculation:**
- Jaccard similarity index: |A ∩ B| / (|A| + |B| - |A ∩ B|) × 100
- Rationale: Mathematically sound metric for set similarity, produces intuitive 0-100% values, accounts for union size properly

**Data fetching strategy:**
- Re-fetch data in compare endpoint rather than caching
- Rationale: Simplicity for v1, ensures fresh data for selected time range, no cache invalidation complexity

**Privacy preservation:**
- All comparison logic server-side, only shared items returned to frontend
- Rationale: Users' full libraries never exposed, only intersection results visible

## Deviations from Plan

None - plan executed exactly as written. All implementation followed the Complete Comparison Function pattern from 03-RESEARCH.md, including all 5 common pitfall guards (empty sets, reference vs value comparison, correct Jaccard formula, metadata enrichment, fresh data fetching).

## Issues Encountered

None - implementation proceeded smoothly following established patterns from Phase 2.

## User Setup Required

None - no external service configuration required beyond existing Spotify OAuth credentials from Phase 1.

## Next Phase Readiness

**Ready for:**
- 03-02-PLAN.md: Frontend can now call POST /api/compare to trigger comparison
- Phase 4 (Visual Results): API returns complete data structure ready for visual grid display

**Implementation notes for next phase:**
- Request format: `POST /api/compare` with body `{timeRange: "short_term" | "medium_term" | "long_term"}`
- Response format:
  ```json
  {
    "sharedArtists": [{id, name, images, genres}, ...],
    "sharedTracks": [{id, name, album: {images}, artists: [{name}]}, ...],
    "matchPercentage": 45,
    "breakdown": {
      "artistsMatch": 50,
      "tracksMatch": 40
    },
    "counts": {
      "sharedArtists": 10,
      "sharedTracks": 15,
      "totalUniqueArtists": 40,
      "totalUniqueTracks": 60
    }
  }
  ```
- Error handling: 400 (users not authorized), 401 (session expired), 500 (comparison failure)
- All percentages are 0-100 whole numbers (rounded)

---
*Phase: 03-comparison-engine*
*Completed: 2026-02-21*
