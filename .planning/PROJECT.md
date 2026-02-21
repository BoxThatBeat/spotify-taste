# Spotify Taste Match

## What This Is

A web app that compares two people's Spotify accounts and visualizes their shared music taste. Users authorize their Spotify accounts, select a time range, and see grids of shared artists (with artist images) and shared tracks (with album covers). This is designed for in-person use — two people hanging out, curious to see what music they have in common.

## Core Value

Two people can instantly see their shared music taste through visual grids of album covers and artist images.

## Requirements

### Validated

- ✓ Two users can authorize their Spotify accounts on the same device — v1.0
- ✓ Users can select time range for comparison (last 4 weeks, 6 months, or all time) — v1.0
- ✓ System fetches top artists and top tracks for both users from Spotify API — v1.0
- ✓ System identifies exact matches between users' top artists — v1.0
- ✓ System identifies exact matches between users' top tracks — v1.0
- ✓ Results display as grid of shared artists with artist images and names — v1.0
- ✓ Results display as grid of shared tracks with album covers and track titles — v1.0
- ✓ When no shared interests exist, show empty state message — v1.0
- ✓ OAuth flow is secure (handled server-side, not exposing client secrets) — v1.0

### Active

(None — define requirements for next milestone via `/gsd-new-milestone`)

### Out of Scope

- Similar taste analysis (genre/vibe matching) — v1 is exact matches only
- Saving or sharing results — one-time viewing experience
- Playing music directly — results are visual only, no playback integration
- Multi-device flow — both users authenticate on same device
- Comparison history — no account system or saved comparisons
- Individual taste display when no overlap — just show empty state

## Context

**v1.0 MVP Shipped (2026-02-21):**
- 1,565 lines of JavaScript/HTML/CSS across 47 files
- Tech stack: Node.js, Express 5.x, Spotify Web API, vanilla JavaScript frontend
- Complete OAuth flow with CSRF protection and token management
- Server-side comparison using Jaccard similarity index
- Responsive CSS Grid layout for visual results

This is a social, in-person experience meant to create a moment between two people. The visual presentation (images/album art) is critical to making the experience engaging and memorable. 

Spotify's API provides top artists and tracks in three time ranges (short_term = 4 weeks, medium_term = 6 months, long_term = all time), which allows users to explore different aspects of their taste overlap.

**Known considerations for next milestone:**
- Deployment strategy (hosting backend + frontend)
- Result sharing/saving capabilities (v2 requirements)
- Genre-based insights (v2 requirements)
- User feedback collection mechanisms

## Constraints

- **Tech Stack**: Web-based with Node.js backend (required for secure OAuth) and static frontend
- **Authentication**: Spotify OAuth 2.0 flow (requires backend to protect client secret)
- **Data Source**: Spotify Web API top artists/tracks endpoints only
- **Hosting**: Must be deployable to standard web hosting (can include simple Node.js backend)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Exact matches only (no similarity algorithm) | Keep v1 simple and fast; exact matches are unambiguous and immediately understandable | ✓ Good (v1.0) |
| User-selectable time range | Different time ranges reveal different aspects of taste (current vs long-term favorites) | ✓ Good (v1.0) |
| Same-device OAuth flow | Simpler UX for in-person use case; no need for linking/invitation system | ✓ Good (v1.0) |
| Visual-first presentation (grids of images) | Images make shared interests feel real and engaging vs plain text lists | ✓ Good (v1.0) |
| No result persistence | Keeps scope minimal; users can refresh to compare with someone else | ✓ Good (v1.0) |
| CommonJS module system | Required for spotify-web-api-node compatibility | ✓ Good (v1.0) |
| Express 5.x | Modern async/await support for OAuth flow | ✓ Good (v1.0) |
| ngrok tunnel for development | HTTPS requirement for Spotify OAuth redirect URIs | ✓ Good (v1.0) |
| JavaScript native Set for comparison | Node 20 compatibility (Set.intersection not available) | ✓ Good (v1.0) |
| Jaccard similarity index | Mathematically sound match percentage calculation | ✓ Good (v1.0) |
| CSS Grid with auto-fit | Responsive layout without media query complexity | ✓ Good (v1.0) |

---
*Last updated: 2026-02-21 after v1.0 milestone completion*
