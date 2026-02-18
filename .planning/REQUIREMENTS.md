# Requirements: Spotify Taste Match

**Defined:** 2026-02-18
**Core Value:** Two people can instantly see their shared music taste through visual grids of album covers and artist images.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication

- [ ] **AUTH-01**: User A can initiate Spotify OAuth authorization
- [ ] **AUTH-02**: User B can initiate Spotify OAuth authorization after User A
- [ ] **AUTH-03**: System securely stores OAuth tokens server-side (not in frontend)
- [ ] **AUTH-04**: System requests user-top-read scope from Spotify
- [ ] **AUTH-05**: OAuth flow uses Authorization Code flow with backend
- [ ] **AUTH-06**: System validates OAuth state parameter (CSRF protection)
- [ ] **AUTH-07**: System maintains separate token storage for both users

### Data Fetching

- [ ] **DATA-01**: User can select time range (4 weeks, 6 months, or all time)
- [ ] **DATA-02**: System fetches top artists for User A from Spotify API
- [ ] **DATA-03**: System fetches top artists for User B from Spotify API
- [ ] **DATA-04**: System fetches top tracks for User A from Spotify API
- [ ] **DATA-05**: System fetches top tracks for User B from Spotify API
- [ ] **DATA-06**: System fetches both users' data in parallel
- [ ] **DATA-07**: System handles Spotify API rate limits gracefully
- [ ] **DATA-08**: System implements token refresh for 1-hour expiration

### Comparison

- [ ] **COMP-01**: System identifies shared artists by exact ID match
- [ ] **COMP-02**: System identifies shared tracks by exact ID match
- [ ] **COMP-03**: System calculates overall match percentage
- [ ] **COMP-04**: System calculates match percentage breakdown (artists % and tracks % separately)
- [ ] **COMP-05**: System performs comparison server-side (privacy-preserving)

### Visual Display

- [ ] **VIS-01**: Results page displays grid of shared artists with artist images
- [ ] **VIS-02**: Results page displays grid of shared tracks with album covers
- [ ] **VIS-03**: Each artist grid item shows artist name below image
- [ ] **VIS-04**: Each track grid item shows track title below album cover
- [ ] **VIS-05**: Results page displays overall match percentage
- [ ] **VIS-06**: Results page displays match score breakdown (artists % and tracks %)
- [ ] **VIS-07**: When no shared interests exist, display empty state message
- [ ] **VIS-08**: Layout is responsive on mobile devices
- [ ] **VIS-09**: System handles missing images gracefully with fallback placeholders

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
| AUTH-01 | TBD | Pending |
| AUTH-02 | TBD | Pending |
| AUTH-03 | TBD | Pending |
| AUTH-04 | TBD | Pending |
| AUTH-05 | TBD | Pending |
| AUTH-06 | TBD | Pending |
| AUTH-07 | TBD | Pending |
| DATA-01 | TBD | Pending |
| DATA-02 | TBD | Pending |
| DATA-03 | TBD | Pending |
| DATA-04 | TBD | Pending |
| DATA-05 | TBD | Pending |
| DATA-06 | TBD | Pending |
| DATA-07 | TBD | Pending |
| DATA-08 | TBD | Pending |
| COMP-01 | TBD | Pending |
| COMP-02 | TBD | Pending |
| COMP-03 | TBD | Pending |
| COMP-04 | TBD | Pending |
| COMP-05 | TBD | Pending |
| VIS-01 | TBD | Pending |
| VIS-02 | TBD | Pending |
| VIS-03 | TBD | Pending |
| VIS-04 | TBD | Pending |
| VIS-05 | TBD | Pending |
| VIS-06 | TBD | Pending |
| VIS-07 | TBD | Pending |
| VIS-08 | TBD | Pending |
| VIS-09 | TBD | Pending |

**Coverage:**
- v1 requirements: 30 total
- Mapped to phases: 0
- Unmapped: 30 ⚠️

---
*Requirements defined: 2026-02-18*
*Last updated: 2026-02-18 after initial definition*
