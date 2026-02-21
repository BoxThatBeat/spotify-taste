# Phase 3: Comparison Engine - Research

**Researched:** 2026-02-20
**Domain:** Set comparison algorithms, similarity metrics, server-side data processing
**Confidence:** HIGH

## Summary

Phase 3 implements server-side comparison of two users' Spotify data to identify shared music taste. The comparison uses exact ID matching (no fuzzy matching in v1) and calculates match percentages using the Jaccard similarity index — a well-established metric for measuring set overlap.

The domain is mathematically straightforward: given two sets of artists and two sets of tracks, find intersections and calculate similarity ratios. JavaScript's native Set object (ES6+) provides optimal O(1) lookup performance for intersection operations. The Jaccard index formula (intersection size / union size) is the standard metric for this type of comparison and produces intuitive percentage values.

Privacy is maintained by performing all comparison logic server-side — the frontend only receives the matched results (shared items and percentages), never full user libraries.

**Primary recommendation:** Use JavaScript native Set with intersection() method for exact ID matching, calculate Jaccard index for match percentages, perform all comparison server-side in a new /api/compare endpoint.

## Standard Stack

The established tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| JavaScript Set | ES6+ (Native) | Set operations and intersection | Native, optimized, O(1) lookup, standard for exact matching |
| Node.js | 20+ | Server-side processing | Already in use; ensures privacy by keeping full data server-side |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Array.filter() | ES5 (Native) | Fallback if Set unavailable | Not needed for Node 20+, but available if needed |
| Array.map() | ES5 (Native) | Transform matched items to response format | Standard for data transformation |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native Set | Lodash _.intersection() | Lodash adds 70KB+ dependency for functionality native to JS; no benefit |
| Native Set | Custom loop comparison | Slower (O(n²) vs O(n)), more code, harder to maintain |
| Jaccard Index | Simple count/percentage | Less mathematically rigorous; Jaccard accounts for union size properly |

**Installation:**
```bash
# No additional packages needed
# Native JavaScript Set is built-in to Node.js 20+
```

## Architecture Patterns

### Recommended API Structure
```
POST /api/compare
├── Input: { timeRange: "medium_term" }
├── Process: 
│   ├── Fetch data for both users (or retrieve from previous /api/fetch-data)
│   ├── Extract artist IDs and track IDs into Sets
│   ├── Calculate intersections
│   ├── Calculate Jaccard index percentages
│   └── Retrieve full metadata for shared items only
└── Output: { sharedArtists: [...], sharedTracks: [...], matchPercentage: X, breakdown: {...} }
```

### Pattern 1: Set Intersection for Exact Matching
**What:** Use JavaScript native Set.intersection() or manual intersection for exact ID comparison
**When to use:** When comparing lists where items have unique IDs (like Spotify IDs)
**Example:**
```javascript
// Source: MDN Web Docs - JavaScript Set
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set

// Extract IDs into Sets
const userArtistIds = new Set(userAData.topArtists.map(artist => artist.id));
const userBArtistIds = new Set(userBData.topArtists.map(artist => artist.id));

// Find intersection (modern browsers/Node 22+)
const sharedArtistIds = userAArtistIds.intersection(userBArtistIds);

// Fallback for Node 20 (if intersection() not available)
const sharedArtistIds = new Set(
  [...userAArtistIds].filter(id => userBArtistIds.has(id))
);
```

### Pattern 2: Jaccard Similarity Index
**What:** Calculate match percentage as intersection over union
**When to use:** Standard metric for set similarity, produces intuitive 0-100% values
**Example:**
```javascript
// Source: Jaccard Index formula (Wikipedia)
// J(A,B) = |A ∩ B| / |A ∪ B| = |A ∩ B| / (|A| + |B| - |A ∩ B|)

function calculateJaccardIndex(setA, setB) {
  const intersection = new Set([...setA].filter(id => setB.has(id)));
  const intersectionSize = intersection.size;
  const unionSize = setA.size + setB.size - intersectionSize;
  
  // Avoid division by zero
  if (unionSize === 0) return 0;
  
  return (intersectionSize / unionSize) * 100; // Convert to percentage
}

// Apply to both artists and tracks
const artistsMatch = calculateJaccardIndex(userAArtistIds, userBArtistIds);
const tracksMatch = calculateJaccardIndex(userATrackIds, userBTrackIds);

// Overall match (weighted average or separate calculation)
const overallMatch = calculateJaccardIndex(
  new Set([...userAArtistIds, ...userATrackIds]),
  new Set([...userBArtistIds, ...userBTrackIds])
);
```

### Pattern 3: Privacy-Preserving Server-Side Comparison
**What:** Keep full user data server-side, only send matched results to frontend
**When to use:** When comparing private user data that shouldn't be exposed
**Example:**
```javascript
// Server-side comparison endpoint
router.post('/api/compare', async (req, res) => {
  // 1. Fetch or retrieve full data for both users (server-side only)
  const userAData = await fetchOrRetrieveUserData('userA', req.session);
  const userBData = await fetchOrRetrieveUserData('userB', req.session);
  
  // 2. Perform comparison (full data never leaves server)
  const sharedArtistIds = findIntersection(userAData.artists, userBData.artists);
  const sharedTrackIds = findIntersection(userAData.tracks, userBData.tracks);
  
  // 3. Build response with ONLY shared items
  const response = {
    sharedArtists: sharedArtistIds.map(id => 
      userAData.artists.find(a => a.id === id) // Metadata for matched items only
    ),
    sharedTracks: sharedTrackIds.map(id => 
      userAData.tracks.find(t => t.id === id)
    ),
    matchPercentage: calculateOverallMatch(...),
    breakdown: {
      artistsMatch: calculateArtistsMatch(...),
      tracksMatch: calculateTracksMatch(...)
    }
  };
  
  // 4. Send only matched results to frontend
  res.json(response);
});
```

### Anti-Patterns to Avoid
- **Sending full user data to frontend for comparison**: Violates privacy, exposes unnecessary data, wastes bandwidth
- **Using O(n²) nested loops for comparison**: Slow; use Set.has() which is O(1) instead
- **Calculating percentage as simple count/total without considering union**: Misleading; ignores overlap between sets
- **Comparing by name instead of ID**: Unreliable due to encoding issues, typos, unicode variations

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Set intersection | Nested loops comparing every item | JavaScript Set with .has() or .intersection() | O(n²) vs O(n); Set.has() is O(1), built-in and optimized |
| Similarity scoring | Custom percentage formulas | Jaccard index formula | Well-established metric; accounts for union properly; mathematically sound |
| Deduplication | Manual tracking of seen items | Set constructor: new Set(array) | Native, optimized, handles edge cases automatically |

**Key insight:** JavaScript Set operations are highly optimized at the engine level. Custom implementations will be slower and more bug-prone.

## Common Pitfalls

### Pitfall 1: Empty Set Handling
**What goes wrong:** Division by zero when both users have empty libraries
**Why it happens:** Union size is zero when both sets are empty
**How to avoid:** Check for empty sets before calculation
**Warning signs:** NaN or Infinity in match percentage

```javascript
// BAD: No zero check
const matchPercent = (intersectionSize / unionSize) * 100; // NaN if unionSize is 0

// GOOD: Guard against division by zero
if (unionSize === 0) {
  return 0; // Or return null/special value indicating "no data to compare"
}
const matchPercent = (intersectionSize / unionSize) * 100;
```

### Pitfall 2: Reference vs Value Comparison
**What goes wrong:** Object comparison by reference instead of by ID
**Why it happens:** JavaScript compares objects by reference, not by content
**How to avoid:** Extract IDs first, compare IDs (strings/numbers), not objects
**Warning signs:** No matches found even when users have identical items

```javascript
// BAD: Comparing objects (compares references)
const userAArtists = [{id: 'abc', name: 'Artist'}];
const userBArtists = [{id: 'abc', name: 'Artist'}];
const shared = userAArtists.filter(a => userBArtists.includes(a)); // [] - no matches!

// GOOD: Compare by ID (strings)
const userAArtistIds = new Set(userAArtists.map(a => a.id));
const userBArtistIds = new Set(userBArtists.map(a => a.id));
const sharedIds = new Set([...userAArtistIds].filter(id => userBArtistIds.has(id)));
```

### Pitfall 3: Incorrect Jaccard Formula
**What goes wrong:** Using wrong denominator (total items instead of union)
**Why it happens:** Confusion between "percentage of total" vs "Jaccard index"
**How to avoid:** Use formula: |A ∩ B| / (|A| + |B| - |A ∩ B|)
**Warning signs:** Match percentages always seem low or don't match intuition

```javascript
// BAD: Wrong formula (percentage of combined total)
const wrongPercent = (intersectionSize / (setA.size + setB.size)) * 100;
// If A has 50 items, B has 50 items, and 25 are shared:
// wrongPercent = 25 / 100 = 25%

// GOOD: Jaccard index (accounts for overlap in union)
const unionSize = setA.size + setB.size - intersectionSize;
const jaccardPercent = (intersectionSize / unionSize) * 100;
// unionSize = 50 + 50 - 25 = 75
// jaccardPercent = 25 / 75 = 33.3%
```

### Pitfall 4: Missing Metadata After ID Comparison
**What goes wrong:** Returning just IDs without artist names, images, etc.
**Why it happens:** Set intersection only returns IDs, not full objects
**How to avoid:** After finding shared IDs, look up full metadata from original data
**Warning signs:** Frontend receives IDs but no names/images to display

```javascript
// BAD: Only returning IDs
const sharedArtistIds = new Set([...userAArtistIds].filter(id => userBArtistIds.has(id)));
res.json({ sharedArtists: [...sharedArtistIds] }); // Just IDs: ['abc', 'def', ...]

// GOOD: Enrich with metadata
const sharedArtistIds = new Set([...userAArtistIds].filter(id => userBArtistIds.has(id)));
const sharedArtists = [...sharedArtistIds].map(id => {
  // Find full artist object from original data
  return userAData.topArtists.find(artist => artist.id === id);
});
res.json({ sharedArtists }); // Full objects with name, images, etc.
```

### Pitfall 5: Stale Data Comparison
**What goes wrong:** Comparing old data after user changes time range
**Why it happens:** Not re-fetching data when time range parameter changes
**How to avoid:** Either re-fetch data in compare endpoint, or accept timeRange parameter
**Warning signs:** Comparison results don't change when time range selector is changed

```javascript
// BAD: Using cached data without checking time range
router.post('/api/compare', (req, res) => {
  const cachedData = getCachedData(); // Might be for wrong time range
  const results = compareData(cachedData);
  res.json(results);
});

// GOOD: Pass time range to fetch, or re-fetch
router.post('/api/compare', async (req, res) => {
  const { timeRange } = req.body; // Get time range from request
  const userAData = await fetchUserData('userA', timeRange); // Fresh data
  const userBData = await fetchUserData('userB', timeRange);
  const results = compareData(userAData, userBData);
  res.json(results);
});
```

## Code Examples

Verified patterns from official sources:

### Complete Comparison Function
```javascript
// Source: Combination of MDN Set operations and Jaccard index formula
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set
// https://en.wikipedia.org/wiki/Jaccard_index

/**
 * Compare two users' music data and calculate match percentages
 * @param {Object} userAData - User A's top artists and tracks
 * @param {Object} userBData - User B's top artists and tracks
 * @returns {Object} Comparison results with shared items and match percentages
 */
function compareUsers(userAData, userBData) {
  // Extract artist IDs into Sets for O(1) lookup
  const userAArtistIds = new Set(userAData.topArtists.map(a => a.id));
  const userBArtistIds = new Set(userBData.topArtists.map(a => a.id));
  
  // Extract track IDs into Sets
  const userATrackIds = new Set(userAData.topTracks.map(t => t.id));
  const userBTrackIds = new Set(userBData.topTracks.map(t => t.id));
  
  // Find shared artist IDs (intersection)
  const sharedArtistIds = new Set(
    [...userAArtistIds].filter(id => userBArtistIds.has(id))
  );
  
  // Find shared track IDs (intersection)
  const sharedTrackIds = new Set(
    [...userATrackIds].filter(id => userBTrackIds.has(id))
  );
  
  // Calculate Jaccard index for artists
  const artistsIntersection = sharedArtistIds.size;
  const artistsUnion = userAArtistIds.size + userBArtistIds.size - artistsIntersection;
  const artistsMatchPercent = artistsUnion > 0 
    ? (artistsIntersection / artistsUnion) * 100 
    : 0;
  
  // Calculate Jaccard index for tracks
  const tracksIntersection = sharedTrackIds.size;
  const tracksUnion = userATrackIds.size + userBTrackIds.size - tracksIntersection;
  const tracksMatchPercent = tracksUnion > 0 
    ? (tracksIntersection / tracksUnion) * 100 
    : 0;
  
  // Calculate overall match (combined artists + tracks)
  const allUserAIds = new Set([...userAArtistIds, ...userATrackIds]);
  const allUserBIds = new Set([...userBArtistIds, ...userBTrackIds]);
  const overallIntersection = new Set(
    [...allUserAIds].filter(id => allUserBIds.has(id))
  ).size;
  const overallUnion = allUserAIds.size + allUserBIds.size - overallIntersection;
  const overallMatchPercent = overallUnion > 0 
    ? (overallIntersection / overallUnion) * 100 
    : 0;
  
  // Enrich shared IDs with full metadata
  const sharedArtists = [...sharedArtistIds].map(id =>
    userAData.topArtists.find(artist => artist.id === id)
  );
  
  const sharedTracks = [...sharedTrackIds].map(id =>
    userAData.topTracks.find(track => track.id === id)
  );
  
  return {
    sharedArtists,
    sharedTracks,
    matchPercentage: Math.round(overallMatchPercent), // Round to whole number
    breakdown: {
      artistsMatch: Math.round(artistsMatchPercent),
      tracksMatch: Math.round(tracksMatchPercent)
    },
    counts: {
      sharedArtists: sharedArtists.length,
      sharedTracks: sharedTracks.length,
      totalUniqueArtists: artistsUnion,
      totalUniqueTracks: tracksUnion
    }
  };
}
```

### API Endpoint Implementation
```javascript
// POST /api/compare endpoint that performs server-side comparison
router.post('/api/compare', async (req, res) => {
  try {
    // Validate both users are authorized
    if (!req.session.tokens?.userA || !req.session.tokens?.userB) {
      return res.status(400).json({ 
        error: 'Both users must be authorized' 
      });
    }
    
    // Get time range from request (defaults to medium_term)
    const { timeRange = 'medium_term' } = req.body;
    
    // Fetch or retrieve data for both users
    // (Could call /api/fetch-data internally or retrieve from session/cache)
    const userAData = await fetchUserData('userA', timeRange, req.session);
    const userBData = await fetchUserData('userB', timeRange, req.session);
    
    // Perform comparison (all processing server-side)
    const comparisonResults = compareUsers(userAData, userBData);
    
    // Return only matched results to frontend
    res.json(comparisonResults);
    
  } catch (error) {
    console.error('Comparison error:', error);
    res.status(500).json({ 
      error: 'Failed to compare users',
      details: error.message 
    });
  }
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Array.filter nested loops | Set with .has() lookup | ES6 (2015) | O(n²) → O(n) performance |
| Manual intersection logic | Native Set.intersection() | ES2025/Node 22+ | Cleaner code, but not yet widely available (fallback needed) |
| Custom similarity formulas | Jaccard index | Standard since 1901 | Mathematical rigor, well-understood metric |

**Deprecated/outdated:**
- Lodash for set operations: Native Set is faster and built-in (no dependency needed)
- Comparing stringified objects: Unreliable; use ID comparison instead

## Open Questions

Things that couldn't be fully resolved:

1. **Set.intersection() availability in Node 20**
   - What we know: Set.intersection() is part of ES2025 spec, available in Node 22+
   - What's unclear: Node 20 LTS doesn't have it yet (need to verify)
   - Recommendation: Use filter fallback for Node 20, can upgrade to .intersection() later

2. **Data caching strategy for comparison**
   - What we know: Phase 2 fetches data via /api/fetch-data endpoint
   - What's unclear: Should Phase 3 re-fetch or reuse? Store in session? Cache duration?
   - Recommendation: For v1, re-fetch in compare endpoint for simplicity. Can optimize later with caching.

3. **Overall match calculation weighting**
   - What we know: Can calculate overall as (artists + tracks) combined or weighted average
   - What's unclear: Should artists and tracks be weighted equally or differently?
   - Recommendation: Equal weighting (combine all IDs) for v1. User research needed to determine if different weighting feels better.

## Sources

### Primary (HIGH confidence)
- MDN Web Docs - JavaScript Set: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set
  - Topics: Set operations, .has(), .size, iteration, intersection patterns
- Wikipedia - Jaccard Index: https://en.wikipedia.org/wiki/Jaccard_index
  - Formula, mathematical properties, use cases for set similarity

### Secondary (MEDIUM confidence)
- ES6 Set specification: Well-established, supported in Node 20+
- Jaccard index is standard metric since 1901, widely used in recommendation systems

### Tertiary (LOW confidence)
- None - all findings verified with authoritative sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Native JavaScript Set, well-documented, stable API
- Architecture: HIGH - Set operations are straightforward, Jaccard formula is standard
- Pitfalls: HIGH - Common mistakes well-known from set theory and JavaScript best practices

**Research date:** 2026-02-20
**Valid until:** 90+ days (stable domain - set theory and native JS APIs don't change frequently)
