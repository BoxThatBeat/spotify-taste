# Spotify Taste Match

## What This Is

A web app that compares two people's Spotify accounts and visualizes their shared music taste. Users authorize their Spotify accounts, select a time range, and see grids of shared artists (with artist images) and shared tracks (with album covers). This is designed for in-person use — two people hanging out, curious to see what music they have in common.

## Core Value

Two people can instantly see their shared music taste through visual grids of album covers and artist images.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Two users can authorize their Spotify accounts on the same device
- [ ] Users can select time range for comparison (last 4 weeks, 6 months, or all time)
- [ ] System fetches top artists and top tracks for both users from Spotify API
- [ ] System identifies exact matches between users' top artists
- [ ] System identifies exact matches between users' top tracks
- [ ] Results display as grid of shared artists with artist images and names
- [ ] Results display as grid of shared tracks with album covers and track titles
- [ ] When no shared interests exist, show empty state message
- [ ] OAuth flow is secure (handled server-side, not exposing client secrets)

### Out of Scope

- Similar taste analysis (genre/vibe matching) — v1 is exact matches only
- Saving or sharing results — one-time viewing experience
- Playing music directly — results are visual only, no playback integration
- Multi-device flow — both users authenticate on same device
- Comparison history — no account system or saved comparisons
- Individual taste display when no overlap — just show empty state

## Context

This is a social, in-person experience meant to create a moment between two people. The visual presentation (images/album art) is critical to making the experience engaging and memorable. 

Spotify's API provides top artists and tracks in three time ranges (short_term = 4 weeks, medium_term = 6 months, long_term = all time), which allows users to explore different aspects of their taste overlap.

## Constraints

- **Tech Stack**: Web-based with Node.js backend (required for secure OAuth) and static frontend
- **Authentication**: Spotify OAuth 2.0 flow (requires backend to protect client secret)
- **Data Source**: Spotify Web API top artists/tracks endpoints only
- **Hosting**: Must be deployable to standard web hosting (can include simple Node.js backend)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Exact matches only (no similarity algorithm) | Keep v1 simple and fast; exact matches are unambiguous and immediately understandable | — Pending |
| User-selectable time range | Different time ranges reveal different aspects of taste (current vs long-term favorites) | — Pending |
| Same-device OAuth flow | Simpler UX for in-person use case; no need for linking/invitation system | — Pending |
| Visual-first presentation (grids of images) | Images make shared interests feel real and engaging vs plain text lists | — Pending |
| No result persistence | Keeps scope minimal; users can refresh to compare with someone else | — Pending |

---
*Last updated: 2026-02-18 after initialization*
