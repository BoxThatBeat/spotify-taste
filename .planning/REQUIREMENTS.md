# Requirements: Spotify Taste Match

**Defined:** 2026-02-18
**Core Value:** Two people can instantly see their shared music taste through visual grids of album covers and artist images.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication

- [x] **AUTH-01**: User A can initiate Spotify OAuth authorization ✓ Phase 1
- [x] **AUTH-02**: User B can initiate Spotify OAuth authorization after User A ✓ Phase 1
- [x] **AUTH-03**: System securely stores OAuth tokens server-side (not in frontend) ✓ Phase 1
- [x] **AUTH-04**: System requests user-top-read scope from Spotify ✓ Phase 1
- [x] **AUTH-05**: OAuth flow uses Authorization Code flow with backend ✓ Phase 1
- [x] **AUTH-06**: System validates OAuth state parameter (CSRF protection) ✓ Phase 1
- [x] **AUTH-07**: System maintains separate token storage for both users ✓ Phase 1

### Data Fetching

- [x] **DATA-01**: User can select time range (4 weeks, 6 months, or all time) ✓ Phase 2
- [x] **DATA-02**: System fetches top artists for User A from Spotify API ✓ Phase 2
- [x] **DATA-03**: System fetches top artists for User B from Spotify API ✓ Phase 2
- [x] **DATA-04**: System fetches top tracks for User A from Spotify API ✓ Phase 2
- [x] **DATA-05**: System fetches top tracks for User B from Spotify API ✓ Phase 2
- [x] **DATA-06**: System fetches both users' data in parallel ✓ Phase 2
- [x] **DATA-07**: System handles Spotify API rate limits gracefully ✓ Phase 2
- [x] **DATA-08**: System implements token refresh for 1-hour expiration ✓ Phase 2

### Comparison

- [x] **COMP-01**: System identifies shared artists by exact ID match ✓ Phase 3
- [x] **COMP-02**: System identifies shared tracks by exact ID match ✓ Phase 3
- [x] **COMP-03**: System calculates overall match percentage ✓ Phase 3
- [x] **COMP-04**: System calculates match percentage breakdown (artists % and tracks % separately) ✓ Phase 3
- [x] **COMP-05**: System performs comparison server-side (privacy-preserving) ✓ Phase 3

### Visual Display

- [x] **VIS-01**: Results page displays grid of shared artists with artist images ✓ Phase 4
- [x] **VIS-02**: Results page displays grid of shared tracks with album covers ✓ Phase 4
- [x] **VIS-03**: Each artist grid item shows artist name below image ✓ Phase 4
- [x] **VIS-04**: Each track grid item shows track title below album cover ✓ Phase 4
- [x] **VIS-05**: Results page displays overall match percentage ✓ Phase 4
- [x] **VIS-06**: Results page displays match score breakdown (artists % and tracks %) ✓ Phase 4
- [x] **VIS-07**: When no shared interests exist, display empty state message ✓ Phase 4
- [x] **VIS-08**: Layout is responsive on mobile devices ✓ Phase 4
- [x] **VIS-09**: System handles missing images gracefully with fallback placeholders ✓ Phase 4

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Enhanced Comparison

- **COMP-06**: System highlights unique taste for each user (what they have that other doesn't)
- **COMP-07**: System displays "Music Twin" badge for 90%+ matches
- **COMP-08**: System provides genre-based insights summary

### Shareability

- **SHARE-01**: User can download visual collage of comparison results
- **SHARE-02**: User can share comparison results via link

### Enhanced Data

- **DATA-09**: System handles pagination for users with 50+ top items
- **DATA-10**: System shows artist genres in results

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| User accounts with passwords | Users already authenticated via Spotify; additional auth adds friction and no value |
| Result persistence/saving | Keeping scope minimal; ephemeral experience is intentional |
| Music playback integration | High complexity, requires Premium, limited value for comparison tool |
| Multi-device flow | In-person use case is same-device; cross-device adds complexity |
| Historical comparison tracking | Requires database and account system; out of v1 scope |
| Complex similarity algorithms | Explicitly excluded; exact matches are simpler and more understandable |
| Social network features | Massive scope creep; keep it simple |
| Custom time ranges | Spotify API only provides 3 fixed ranges |
| Long-term data storage | Privacy concerns, GDPR burden, unnecessary for ephemeral use case |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Complete ✓ |
| AUTH-02 | Phase 1 | Complete ✓ |
| AUTH-03 | Phase 1 | Complete ✓ |
| AUTH-04 | Phase 1 | Complete ✓ |
| AUTH-05 | Phase 1 | Complete ✓ |
| AUTH-06 | Phase 1 | Complete ✓ |
| AUTH-07 | Phase 1 | Complete ✓ |
| DATA-01 | Phase 2 | Complete ✓ |
| DATA-02 | Phase 2 | Complete ✓ |
| DATA-03 | Phase 2 | Complete ✓ |
| DATA-04 | Phase 2 | Complete ✓ |
| DATA-05 | Phase 2 | Complete ✓ |
| DATA-06 | Phase 2 | Complete ✓ |
| DATA-07 | Phase 2 | Complete ✓ |
| DATA-08 | Phase 2 | Complete ✓ |
| COMP-01 | Phase 3 | Complete ✓ |
| COMP-02 | Phase 3 | Complete ✓ |
| COMP-03 | Phase 3 | Complete ✓ |
| COMP-04 | Phase 3 | Complete ✓ |
| COMP-05 | Phase 3 | Complete ✓ |
| VIS-01 | Phase 4 | Complete ✓ |
| VIS-02 | Phase 4 | Complete ✓ |
| VIS-03 | Phase 4 | Complete ✓ |
| VIS-04 | Phase 4 | Complete ✓ |
| VIS-05 | Phase 4 | Complete ✓ |
| VIS-06 | Phase 4 | Complete ✓ |
| VIS-07 | Phase 4 | Complete ✓ |
| VIS-08 | Phase 4 | Complete ✓ |
| VIS-09 | Phase 4 | Complete ✓ |

**Coverage:**
- v1 requirements: 30 total
- Mapped to phases: 30 ✓
- Unmapped: 0

---
*Requirements defined: 2026-02-18*
*Last updated: 2026-02-21 after Phase 4 completion (30/30 v1 requirements complete - v1 MVP feature-complete)*
