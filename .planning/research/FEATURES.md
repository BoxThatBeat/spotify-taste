# Feature Landscape: Spotify Taste Comparison Apps

**Domain:** Music taste comparison and visualization tools  
**Researched:** February 18, 2026  
**Confidence:** MEDIUM (based on Spotify API documentation + observation of live apps)

## Executive Summary

Spotify taste comparison apps exist in a crowded space dominated by three pillars: **profile visualization** (showing individual taste), **comparison mechanics** (matching users), and **social sharing** (distributing results). The most successful apps nail one pillar exceptionally well rather than trying to excel at all three.

**Key insight:** Users tolerate friction in comparison mechanics if the payoff (visual result) is compelling. Apps like musictaste.space and Receiptify succeed because their output is *shareable* — the comparison result itself becomes social currency.

**For "Spotify Taste Match":** The planned scope hits table stakes well (OAuth, time ranges, visual grids) but should consider adding lightweight shareability to increase viral potential without building full persistence infrastructure.

---

## Table Stakes

Features users expect from any Spotify comparison/visualization app. Missing these = users abandon.

| Feature | Why Expected | Complexity | Spotify API Notes |
|---------|--------------|------------|-------------------|
| **Spotify OAuth login** | Required for API access; users understand this | Medium | Authorization Code Flow with PKCE recommended. Requires `user-top-read` scope. |
| **Time range selection** | Users want to compare different listening periods | Low | API provides 3 ranges: `short_term` (~4 weeks), `medium_term` (~6 months), `long_term` (~1 year). This is built into `/me/top/{type}` endpoint. |
| **Top artists display** | Core data type for taste comparison | Low | `/me/top/artists` returns up to 50 artists with images, names, IDs. Includes `popularity` score. |
| **Top tracks display** | Second core data type (some users prefer tracks) | Low | `/me/top/tracks` returns up to 50 tracks with album art, artist info, names. |
| **Visual presentation with imagery** | Raw text lists feel incomplete; users expect album art/artist photos | Medium | API returns image arrays in multiple sizes. Widest-first ordering. Must link back to Spotify per policy. |
| **Match percentage / overlap score** | Users need a single number to understand compatibility | Low | Calculate client-side: `(shared items / total unique items) * 100`. Most apps show 0-100% scale. |
| **Empty state handling** | When users have no overlap, show *something* meaningful | Low | Common pattern: "You have 0% match. You might like..." with suggestions, or "Your tastes are unique!" positive framing. |
| **Mobile responsive design** | 60%+ of music comparison happens on phones (users compare in social settings) | Medium | Grid layouts must adapt. Consider same-device multi-user flow for mobile. |
| **Clear privacy messaging** | Users are sensitive about Spotify data access | Low | Explain what data is accessed, that it's not stored (if true), link to Spotify permissions page. |

### Dependencies Between Table Stakes
```
OAuth → Time Range Selection → Data Fetch (Artists/Tracks) → Visual Display → Comparison Logic → Match Score
```

All table stakes are sequential — can't skip any without breaking user experience.

---

## Differentiators

Features that set apps apart. Not expected, but create competitive advantage when done well.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Genre-based comparison** | Shows *why* users match beyond just artist names | Medium | Spotify API deprecated artist genres, but still returned. Aggregate genres from shared artists for "You both love indie rock" insights. |
| **Visual collage generation** | Creates shareable "receipts" or grids users post to social media | High | Receiptify and musictaste.space's killer feature. Generates image from album art/artist photos. Consider Canvas API or server-side image gen. |
| **Compatibility score breakdown** | Not just "88% match" but "Artists: 92%, Tracks: 80%, Genres: 90%" | Low | Adds depth without much complexity. Users understand taste better through dimensions. |
| **Unique taste highlighting** | "You love X artist that your friend hasn't discovered yet" | Low | Social value: lets users feel like taste-makers. Simple set difference operation. |
| **Historical comparison** | "Your taste overlap has grown from 60% to 85% over 6 months" | High | Requires persistence. Only valuable if users return repeatedly. Skip for MVP. |
| **Group comparison (3+ users)** | "Which artists do all 4 of you share?" | Medium | Requires multi-user OAuth flow coordination. Venn diagram visualization gets complex beyond 3 users. |
| **Playlist generation from matches** | "Listen to your shared taste" button → creates Spotify playlist | Medium | Requires `playlist-modify-public` or `playlist-modify-private` scope. Uses `/users/{user_id}/playlists` + `/playlists/{playlist_id}/tracks`. |
| **Animated transitions** | Visual polish during data loading and comparison reveal | Low-Medium | Small details that make app feel premium. Loading states, count-up animations on match %, fade-ins. |
| **"Music Twin" detection** | Special treatment for 90%+ matches | Low | Psychological: users *love* finding their "music twin." Badge, special message, confetti effect. |
| **Recently played comparison** | "What are you both listening to *right now*?" | Medium | Uses `/me/player/recently-played` endpoint. Requires `user-read-recently-played` scope. More dynamic than top items. |
| **Audio feature comparison** | "You both like energetic, danceable music" using Spotify's audio features | Medium | `/audio-features` endpoint provides danceability, energy, valence, etc. Aggregate and compare. |
| **Shareable link generation** | "Share your results" creates temporary URL | High | Requires backend persistence or URL param encoding. High viral potential. |

### Differentiator Tiers by Impact

**High Impact (worth building):**
1. Visual collage generation → drives social sharing
2. Compatibility score breakdown → adds perceived depth
3. Unique taste highlighting → creates conversation starters
4. Playlist generation → provides immediate utility

**Medium Impact:**
- Genre-based insights
- "Music Twin" special treatment
- Recently played comparison

**Lower Impact (defer):**
- Historical comparison (requires retention first)
- Group comparison (niche use case)
- Audio feature comparison (too abstract for most users)

---

## Anti-Features

Features to deliberately NOT build. Common mistakes in Spotify integration apps.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **User account system with passwords** | Friction. Users already authenticated via Spotify. | Rely on Spotify OAuth only. Use state parameter for session management. |
| **Storing listening history long-term** | Privacy concerns, GDPR compliance burden, storage costs. | Fetch fresh from Spotify API on each comparison. Spotify is the source of truth. |
| **Requiring sign-up before seeing anything** | Kills curiosity. Users don't know if app is worth OAuth permissions yet. | Show example comparison or demo mode first. Auth gate only actual comparison feature. |
| **Complex similarity algorithms** | Project explicitly excludes this. Users understand "shared artists" better than computed similarity. | Stick to exact match comparison. Simple is transparent. |
| **Social network features (followers, profiles, feeds)** | Massive scope creep. Becomes a social network, not a comparison tool. | Keep it ephemeral. Compare, see results, done. |
| **Music playback in-app** | Requires Spotify Premium (`streaming` scope), high complexity, limited value for comparison use case. | Link to Spotify to play tracks. Let Spotify own playback. |
| **Importing from other platforms** | Fragmentation. Apple Music, YouTube Music APIs are inferior or non-existent. | Spotify only. Clean focus. |
| **"Rate this comparison" feedback** | Low signal, high noise. Users won't engage unless results are terrible. | Use analytics (time on page, comparison count) as proxy for quality. |
| **Overly granular time range selection** | Spotify API only supports 3 ranges. Custom ranges require aggregating recently-played (50 track limit) or complex workarounds. | Use API's 3 built-in ranges: 4 weeks, 6 months, all time. |
| **Auto-posting to social media** | Perceived as spammy. Users want control over what they share. | Provide "Download image" or "Copy link" buttons. User initiates sharing. |
| **Artist/track recommendations** | Spotify's recommendation engine is better. Don't compete. | If you must, use `/recommendations` endpoint and frame as "Discover shared interests" not "We recommend." |

### Anti-Feature Rationale

Most anti-features come from one of three mistakes:
1. **Scope creep** — trying to become a full platform instead of a focused tool
2. **Solving already-solved problems** — Spotify handles auth, playback, recommendations better
3. **Premature optimization** — adding features that need scale to be valuable (social graph, historical data)

---

## Feature Dependencies

Visual map of how features relate:

```
Core Flow:
OAuth Login
    ↓
Time Range Selection
    ↓
Fetch Top Artists/Tracks ← (parallel) → Fetch User Profile
    ↓
Display Individual Taste (optional preview)
    ↓
Compare with Second User ← (requires) → Second User OAuth
    ↓
Calculate Match Score + Shared Items
    ↓
Visual Grid Display
    ↓ (optional)
Shareability (image gen, link, etc.)
```

**Critical Path:** OAuth → Fetch → Compare → Display  
Everything else is enhancement.

---

## MVP Recommendation

For "Spotify Taste Match" MVP, prioritize:

### Must Have (Table Stakes)
1. ✅ Two-user OAuth flow (same device)
2. ✅ Time range selection (4 weeks / 6 months / all time)
3. ✅ Exact match comparison (shared artists/tracks)
4. ✅ Visual grids with album art and artist images
5. ✅ Empty state when no overlap
6. ✅ Match percentage score

### Should Have (Low-effort differentiators)
7. **Compatibility score breakdown** — "Artists: X%, Tracks: Y%" (10 min to implement)
8. **Unique taste highlighting** — "You love these artists your friend hasn't discovered" (20 min)
9. **"Music Twin" special treatment** — Badge/message for 90%+ matches (5 min)

### Could Have (Medium effort, high impact)
10. **Visual collage download** — Generate shareable image of comparison grid (1-2 days)
11. **Genre-based insights** — "You both love indie rock" summary (2-4 hours)

### Won't Have (Anti-features or deferred)
- ❌ Similarity algorithms (explicit exclusion)
- ❌ Result persistence/sharing (explicit exclusion)
- ❌ Music playback integration (explicit exclusion)
- ❌ User accounts beyond OAuth
- ❌ Historical comparison
- ❌ Social network features

---

## Spotify API Limitations

Constraints that affect feature feasibility:

| Limitation | Impact on Features | Workaround |
|------------|-------------------|------------|
| **Max 50 items per endpoint** | Can only compare top 50 artists/tracks per time range | Accept limitation. 50 is sufficient for meaningful comparison. |
| **3 fixed time ranges** | Can't offer "last month" or "this year" custom ranges | Use API's ranges. Frame as "Recent / Half-Year / All-Time" |
| **Rate limits** | Extended quota mode required for production (25k requests/day → removed in Feb 2026 update) | Batch requests where possible. Cache user data during session. |
| **No cross-user comparison endpoint** | Must fetch each user separately, compare client-side | Acceptable. Keeps comparison logic transparent and customizable. |
| **Genre data deprecated but still returned** | Genres may be empty arrays for newer/niche artists | Fall back gracefully. Don't rely solely on genres for insights. |
| **Image URLs expire** | Spotify image URLs may change or expire | Fetch fresh on each session. Don't store image URLs long-term. |
| **Authorization scope persistence** | Users must re-auth if scope changes | Get all needed scopes upfront: `user-top-read` minimum. |

### February 2026 API Changes

Recent Spotify Dev Mode changes (per official changelog):
- Extended quota mode removed — all apps now have higher limits by default
- Recommended migration to Authorization Code with PKCE for web apps
- Implicit Grant flow officially deprecated

**Impact:** Simpler auth setup, but must use PKCE flow (slightly more complex than old implicit flow).

---

## Competitive Landscape Observations

From research of active Spotify taste apps:

### musictaste.space
**Strengths:**
- Beautiful profile pages with curated playlists
- Compatibility score between users
- Shareable profile links

**What they do well:** Positioning as "musical identity" space, not just comparison tool. Social profile aspect adds stickiness.

**Takeaway:** Users like persistent profiles, but project explicitly excludes persistence. Consider lightweight "Download your profile" image export as middle ground.

### Receiptify
**Strengths:**
- Viral receipt aesthetic
- Multiple metric views (tracks, artists, genres, stats)
- Time period selection
- Font customization

**What they do well:** Shareable image generation is core, not afterthought. Receipt format is immediately recognizable and meme-ready.

**Takeaway:** If "Spotify Taste Match" adds image export, make the format distinctive and share-worthy (not just a screenshot).

### Chosic Playlist Analyzer
**Strengths:**
- Deep analytics (BPM, mood, key, decade)
- Playlist organization features
- Rating system for playlists

**What they do well:** Serves power users who want detailed insights.

**Takeaway:** Analytics depth is niche. Most comparison users want simple, visual, shareable results. "Spotify Taste Match" is right to focus on simplicity.

### Stats for Spotify / Obscurify
**Pattern:** Personal stats (top artists/tracks/genres over time) with some social comparison features.

**Takeaway:** "Lone user" stats viewing is table stakes. Comparison is the differentiator.

---

## Open Questions

Areas where research was inconclusive or needs validation:

1. **Optimal grid size:** How many artists/tracks to show in comparison view? Research shows 10-25 items for visual clarity, but might test 5x5 vs 4x6 vs scrollable.

2. **Match score calculation:** Do users expect overlap as % of all items, or % of shared items? (75% match could mean "75% of combined items are shared" vs "75% of User A's items appear in User B's")

3. **Artist vs Track preference:** Do most users prefer comparing artists or tracks? Might affect default view.

4. **Empty state severity:** At what % match should the "empty state" activate? <10%? Or only at true 0%?

5. **Time range naming:** Do users understand "short_term/medium_term/long_term" or need "Last Month / Last 6 Months / All Time"?

**Recommendation:** A/B test these during beta. All are low-risk variations.

---

## Sources

**HIGH confidence (official):**
- [Spotify Web API Reference - Get User's Top Items](https://developer.spotify.com/documentation/web-api/reference/get-users-top-artists-and-tracks) — Verified time ranges, return data structure
- [Spotify Web API - Scopes](https://developer.spotify.com/documentation/web-api/concepts/scopes) — Verified required permissions for features
- [Spotify Web API - Get Artist](https://developer.spotify.com/documentation/web-api/reference/get-an-artist) — Verified image data structure, genre data

**MEDIUM confidence (observation):**
- [musictaste.space](https://musictaste.space) — Live app, feature set observed February 2026
- [Receiptify](https://receiptify.herokuapp.com) — Live app, receipt generation feature confirmed
- [Chosic Spotify Playlist Analyzer](https://www.chosic.com/spotify-playlist-analyzer/) — Live app, analytics feature set observed

**LOW confidence (incomplete data):**
- GitHub topics search for "spotify-comparison" — No active public repositories, suggesting proprietary implementations
- Stats for Spotify and Obscurify (JavaScript required, limited observation)

---

## Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| **Table Stakes** | HIGH | Verified against Spotify API docs and multiple live apps. All table stakes features confirmed feasible. |
| **Differentiators** | MEDIUM | Based on observation of successful apps, but haven't tested user preference data directly. |
| **Anti-Features** | MEDIUM | Based on common patterns and Spotify API limitations, but some assumptions (e.g., "users don't want accounts") need validation. |
| **API Limitations** | HIGH | Directly from official Spotify documentation and February 2026 changelog. |
| **Competitive Landscape** | MEDIUM | Observational research only. Can't see implementation details or user metrics. |
| **MVP Prioritization** | MEDIUM | Based on project context and complexity estimates, but needs product validation. |

---

## Recommendations for Requirements Phase

When moving from research → requirements definition:

1. **Verify match score calculation preference** — Test whether users expect overlap % vs match % with mockups
2. **Define exact grid layout** — Specify number of items to display, overflow handling
3. **Clarify empty state threshold** — When does "no overlap" message appear?
4. **Decide on image export** — In scope for MVP? This could be high-effort but high-value differentiator
5. **Specify time range labels** — Use Spotify's terms or user-friendly names?

These are product decisions, not research questions. Documented here to streamline next phase.
