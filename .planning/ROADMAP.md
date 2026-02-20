# Roadmap: Spotify Taste Match

## Overview

This roadmap delivers a visual music comparison tool through four focused phases. Starting with secure OAuth foundation for two-user authentication, building Spotify API integration with token refresh, implementing server-side comparison logic, and finishing with polished visual grids of shared artists and tracks. Each phase delivers a complete, verifiable capability that enables the next.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: OAuth Foundation** - Two-user sequential Spotify authorization with secure token storage ✓ 2026-02-19
- [ ] **Phase 2: Data Pipeline** - Spotify API integration with parallel fetching and token refresh
- [ ] **Phase 3: Comparison Engine** - Server-side exact match algorithm with percentage calculation
- [ ] **Phase 4: Visual Results** - Responsive grid display with images and empty state handling

## Phase Details

### Phase 1: OAuth Foundation
**Goal**: Both users can securely authorize their Spotify accounts sequentially on the same device
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, AUTH-07
**Success Criteria** (what must be TRUE):
  1. User A can initiate Spotify OAuth and authorize successfully
  2. User B can initiate Spotify OAuth after User A and authorize successfully
  3. System stores both users' access tokens and refresh tokens server-side (never exposed to frontend)
  4. OAuth state parameter prevents CSRF attacks for both authorization flows
  5. System maintains separate token storage for User A and User B without confusion
**Plans**: 4 plans

Plans:
- [x] 01-01-PLAN.md — Project foundation (Node.js, Express, dependencies) ✓ 2026-02-18
- [x] 01-02-PLAN.md — OAuth implementation (routes, session, CSRF protection) ✓ 2026-02-18
- [x] 01-03-PLAN.md — Frontend interface (landing page, authorization UI) ✓ 2026-02-18
- [x] 01-04-PLAN.md — End-to-end verification checkpoint ✓ 2026-02-19

### Phase 2: Data Pipeline
**Goal**: System reliably fetches top artists and tracks for both users from Spotify API
**Depends on**: Phase 1
**Requirements**: DATA-01, DATA-02, DATA-03, DATA-04, DATA-05, DATA-06, DATA-07, DATA-08
**Success Criteria** (what must be TRUE):
  1. User can select time range (4 weeks, 6 months, or all time) for comparison
  2. System fetches both users' top artists and top tracks in parallel for selected time range
  3. System automatically refreshes expired tokens (before 1-hour expiration) without user action
  4. System handles Spotify API rate limits gracefully with retry-after logic (no crashes or silent failures)
**Plans**: 2 plans

Plans:
- [ ] 02-01-PLAN.md — Backend API with token refresh and rate limiting
- [ ] 02-02-PLAN.md — Time range selector UI and fetch trigger

### Phase 3: Comparison Engine
**Goal**: System identifies and quantifies shared music taste between two users
**Depends on**: Phase 2
**Requirements**: COMP-01, COMP-02, COMP-03, COMP-04, COMP-05
**Success Criteria** (what must be TRUE):
  1. System correctly identifies shared artists and shared tracks by exact Spotify ID match
  2. System calculates overall match percentage based on total shared items vs total unique items
  3. System provides breakdown showing artists match percentage and tracks match percentage separately
  4. Comparison happens server-side (full user data never sent to frontend, only matched results)
**Plans**: TBD

Plans:
- [ ] (Plans created during /gsd-plan-phase 3)

### Phase 4: Visual Results
**Goal**: Users see their shared music taste through engaging visual grids of images
**Depends on**: Phase 3
**Requirements**: VIS-01, VIS-02, VIS-03, VIS-04, VIS-05, VIS-06, VIS-07, VIS-08, VIS-09
**Success Criteria** (what must be TRUE):
  1. Results page displays grid of shared artists with artist images and names
  2. Results page displays grid of shared tracks with album covers and track titles
  3. Results page prominently displays overall match percentage and breakdown (artists % and tracks %)
  4. When users have zero shared interests, system displays encouraging empty state message
  5. Layout works correctly on mobile devices (responsive grid, readable text, accessible images)
**Plans**: TBD

Plans:
- [ ] (Plans created during /gsd-plan-phase 4)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. OAuth Foundation | 4/4 | Complete ✓ | 2026-02-19 |
| 2. Data Pipeline | 0/2 | Not started | - |
| 3. Comparison Engine | 0/TBD | Not started | - |
| 4. Visual Results | 0/TBD | Not started | - |

---
*Roadmap created: 2026-02-18*
*Last updated: 2026-02-19 (Phase 2 planned)*
