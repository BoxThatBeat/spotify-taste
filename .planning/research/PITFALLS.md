# Spotify Web API Integration Pitfalls

**Project:** Spotify Taste Match
**Domain:** OAuth-based music comparison web app
**Researched:** 2026-02-18
**Confidence:** HIGH (based on official Spotify documentation)

---

## Critical Pitfalls

These mistakes cause security vulnerabilities, complete feature failure, or require major rewrites.

### 1. Client Secret Exposure in Frontend Code

**What goes wrong:**
Developers embed the client secret directly in frontend JavaScript, HTML, or client-side configuration files. This exposes the secret in browser dev tools, source code, and network requests, allowing anyone to impersonate your application.

**Why it happens:**
- Confusion between Authorization Code flow (server-side, uses secret) and PKCE flow (client-side, no secret)
- Copy-pasting server-side examples into frontend code
- Misunderstanding that "single-page app" means "no backend needed"

**Consequences:**
- Your client secret is publicly accessible
- Attackers can make API requests as your application
- Spotify may revoke your app credentials
- Rate limits shared across all users/attackers using your credentials
- Cannot qualify for Extended Quota Mode with exposed secrets

**Prevention:**
1. **Use Authorization Code with PKCE flow for frontend apps** - This flow is specifically designed for applications where the client secret cannot be safely stored
2. **Never include client_secret in frontend code** - If you see `client_secret` in your JavaScript/HTML, you're doing it wrong
3. **Environment variable checks** - Add CI/CD checks that fail if secrets appear in frontend bundles
4. **For two-user flow**: Each user gets their own PKCE flow - generate separate code_verifier/code_challenge for each user

**Detection:**
- Search your frontend codebase for `client_secret`, `CLIENT_SECRET`, or base64-encoded credentials
- Check browser Network tab - if you see `client_secret` in any request, it's exposed
- Inspect bundled JavaScript - secrets should never appear in production bundles

**Phase impact:** Phase 1 (OAuth Setup) - Must get this right from the start or face complete rewrite

**Spotify-specific gotcha:**
Spotify provides both Authorization Code and PKCE flows. The official docs show both, but for browser-based apps, **only PKCE is secure**. Don't use Authorization Code flow without a backend server.

---

### 2. Missing or Incorrect Redirect URI Configuration

**What goes wrong:**
OAuth fails completely because redirect URIs don't match exactly between your code and Spotify Developer Dashboard settings. Even a missing trailing slash or `http` vs `https` causes failure.

**Why it happens:**
- Developer Dashboard requires exact URI matches (case-sensitive, protocol-sensitive)
- Localhost development URIs differ from production URIs
- Developers forget to add all necessary URIs (dev, staging, prod)
- Port numbers change during development

**Consequences:**
- Users see error: "Invalid redirect URI" or "INVALID_CLIENT: Invalid redirect URI"
- OAuth flow breaks completely - no authorization possible
- Different behavior between local dev and production
- Users can't authenticate, app is unusable

**Prevention:**
1. **Add all redirect URIs to Developer Dashboard before testing**:
   - `http://localhost:3000/callback` (dev)
   - `http://127.0.0.1:3000/callback` (alternative localhost)
   - `https://yourdomain.com/callback` (production)
2. **Exact match required**: `redirect_uri` parameter in code must EXACTLY match a configured URI
3. **For two-user flow**: You can use the same redirect URI for both users - differentiate them using the `state` parameter
4. **Test all environments** before deploying

**Detection:**
- OAuth redirect fails with "Invalid redirect URI" error
- Check Developer Dashboard → App Settings → Redirect URIs
- Compare URIs character-by-character (spaces, slashes, protocols)

**Phase impact:** Phase 1 (OAuth Setup) - Blocks all progress until fixed

**Spotify-specific gotcha:**
- Spotify enforces HTTPS for production URIs (non-localhost)
- You can have multiple redirect URIs configured (useful for multi-environment setups)
- As of February 2026, there are new redirect URI requirements - see migration guide

---

### 3. Token Storage in localStorage Without Encryption

**What goes wrong:**
Access tokens and refresh tokens are stored in `localStorage` or `sessionStorage` in plain text, making them vulnerable to XSS attacks.

**Why it happens:**
- Official Spotify PKCE example uses `localStorage.setItem('access_token', token)`
- Developers assume localStorage is secure
- Convenience over security - easy to read/write

**Consequences:**
- XSS vulnerability - any malicious script can steal tokens
- Stolen tokens allow full account access until expiration (1 hour for access, indefinite for refresh)
- Users' Spotify data exposed
- For two-user app: Both users' tokens at risk

**Prevention:**
1. **For browser-only apps**: localStorage is acceptable BUT:
   - Never include user-generated content without sanitization (XSS risk)
   - Use Content Security Policy (CSP) headers to block inline scripts
   - Consider httpOnly cookies if you have a backend
2. **For apps with backend**: Store refresh tokens server-side in encrypted database
   - Only send access tokens to frontend (short-lived, less critical)
   - Use secure session cookies for auth, not tokens in localStorage
3. **Two-user flow specific**: Store each user's tokens separately with clear identifiers:
   ```javascript
   localStorage.setItem('user1_access_token', token1);
   localStorage.setItem('user2_access_token', token2);
   ```

**Detection:**
- Check localStorage in browser dev tools → Application tab
- Run security audit tools (OWASP ZAP, Burp Suite)
- Look for XSS vulnerabilities in your app

**Phase impact:** Phase 1 (OAuth Setup) - Should implement secure storage from the start

**Spotify-specific gotcha:**
Refresh tokens don't expire. If stolen, an attacker has indefinite access until the user revokes permissions. This is why secure storage is critical.

---

### 4. Not Implementing Token Refresh Before Expiration

**What goes wrong:**
Access tokens expire after 1 hour. Apps that don't refresh tokens proactively will suddenly fail API requests, breaking the user experience mid-session.

**Why it happens:**
- Developers test with fresh tokens (always work)
- Forget that tokens expire
- Reactive approach (wait for 401, then refresh) causes visible errors

**Consequences:**
- Users see "Unauthorized" errors after 1 hour
- API requests fail mid-comparison
- Poor UX - comparison fails halfway through
- For two-user flow: Both tokens need tracking and refreshing independently

**Prevention:**
1. **Proactive refresh**: Refresh tokens before they expire (e.g., at 50 minutes)
   ```javascript
   // Track expiration time
   const expiresAt = Date.now() + (expires_in * 1000);
   localStorage.setItem('token_expires_at', expiresAt);
   
   // Before each API request, check if refresh needed
   if (Date.now() >= expiresAt - (10 * 60 * 1000)) { // 10 min buffer
     await refreshAccessToken();
   }
   ```
2. **Reactive fallback**: If you get 401, refresh and retry the request once
3. **Two-user flow**: Track expiration for BOTH users separately
   ```javascript
   const user1ExpiresAt = Date.now() + (user1_expires_in * 1000);
   const user2ExpiresAt = Date.now() + (user2_expires_in * 1000);
   ```
4. **Background refresh**: Use `setInterval` to refresh tokens automatically

**Detection:**
- Let your app run for 1+ hour and test functionality
- Monitor for 401 errors in browser Network tab
- Check if users report errors after extended use

**Phase impact:** Phase 2 (API Integration) - Must implement before comparing users' data

**Spotify-specific gotcha:**
- Access tokens expire after exactly 3600 seconds (1 hour)
- Refresh tokens may or may not be returned in refresh response - reuse existing if not returned
- PKCE flow requires `client_id` in refresh request (not client_secret)

---

### 5. Ignoring Rate Limits (Development Mode: Low Limits)

**What goes wrong:**
Spotify's Development Mode has strict rate limits (30-second rolling window). Apps that fetch data for two users simultaneously, or paginate through large playlists, quickly hit 429 "Too Many Requests" errors.

**Why it happens:**
- Developers don't read rate limit docs
- Testing with small datasets works fine
- Two-user comparison requires 2x the API calls
- Fetching top tracks, artists, albums, playlists in parallel

**Consequences:**
- 429 errors break comparison flow
- Users see "Service Unavailable" or blank results
- For two-user flow: Hitting limits is 2x more likely
- Can't scale beyond 25 users in Development Mode (limited to 25 users max, need Extended Quota Mode)

**Prevention:**
1. **Use batch endpoints where possible**:
   - `GET /me/top/tracks?limit=50` instead of 50 individual track requests
   - `GET /artists?ids=id1,id2,id3` instead of 3 separate requests
2. **Implement retry-after logic**:
   ```javascript
   if (response.status === 429) {
     const retryAfter = response.headers.get('Retry-After'); // seconds
     await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
     // Retry the request
   }
   ```
3. **Sequential vs parallel**: For two-user flow, fetch data sequentially if rate limits are tight
4. **Cache results**: Don't re-fetch the same data multiple times
5. **Apply for Extended Quota Mode** when ready for production (higher limits)

**Detection:**
- Watch for 429 status codes in Network tab
- Monitor `Retry-After` header in responses
- Test with large datasets (user with 1000+ saved tracks)

**Phase impact:** Phase 2 (API Integration) - Critical for two-user comparison feature

**Spotify-specific gotcha:**
- Rate limit varies by quota mode:
  - **Development Mode**: Much lower (25 users max, lower request limits)
  - **Extended Quota Mode**: Higher limits (requires application approval)
- Rate limit is per 30-second rolling window, not per minute
- Dashboard shows API usage graph - monitor this during testing
- As of May 2025, Extended Quota Mode requires 250k+ MAU and company entity (not individuals)

---

### 6. Forgetting Required Scopes for User Data

**What goes wrong:**
API requests fail with 403 "Insufficient client scope" errors because the OAuth flow didn't request the necessary permissions (scopes).

**Why it happens:**
- Developers add features without updating scope list
- Copy-paste minimal scope examples
- Not understanding which scopes are needed for which endpoints

**Consequences:**
- Features silently fail or return 403 errors
- Users already authorized with old scopes need to re-authorize
- Broken comparison features (can't access top tracks, playlists, etc.)

**Prevention:**
1. **Request all needed scopes upfront in authorization URL**:
   ```javascript
   const scope = [
     'user-read-private',        // Basic profile
     'user-read-email',          // Email (optional but useful)
     'user-top-read',            // Top tracks/artists (REQUIRED for taste comparison)
     'user-read-recently-played', // Recent listening (optional)
     'playlist-read-private',    // Private playlists (if comparing playlists)
     'user-library-read',        // Saved tracks/albums (if comparing libraries)
   ].join(' ');
   ```
2. **Minimal scopes for Taste Match**:
   - **Required**: `user-top-read` (for getting top tracks/artists)
   - **Recommended**: `user-read-private` (for user profile/display name)
3. **Scope changes require re-authorization**: If you add scopes later, users must re-authorize
4. **Two-user flow**: Both users need the same scopes

**Detection:**
- 403 errors with message "Insufficient client scope"
- Check Developer Dashboard → App Settings → API Scopes used
- Test all features after adding new scopes

**Phase impact:** Phase 1 (OAuth Setup) - Get scopes right initially to avoid re-authorization

**Spotify-specific gotcha:**
- `user-top-read` scope is required for `/me/top/tracks` and `/me/top/artists` endpoints (core of taste matching)
- Scopes are space-separated in authorization URL
- Over-requesting scopes can reduce user trust - only ask for what you need

---

## Moderate Pitfalls

These cause delays, poor UX, or technical debt but don't completely break functionality.

### 7. Not Handling Pagination for Large Datasets

**What goes wrong:**
API endpoints return paginated results (default limit 20, max 50). Apps that don't paginate will only show partial data (first 20-50 items).

**Why it happens:**
- Developers test with accounts that have <50 items
- Ignore `next` field in API responses
- Assume one request returns all data

**Consequences:**
- Incomplete comparisons (missing tracks/artists)
- User with 500 saved tracks only shows 50
- Two-user comparison skewed if one user has more data than the other

**Prevention:**
1. **Check for `next` field and loop**:
   ```javascript
   let allTracks = [];
   let url = 'https://api.spotify.com/v1/me/top/tracks?limit=50';
   
   while (url) {
     const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
     const data = await response.json();
     allTracks.push(...data.items);
     url = data.next; // null when no more pages
   }
   ```
2. **Set limit=50** to minimize requests
3. **For two-user flow**: Paginate both users' data fully before comparing

**Detection:**
- Test with accounts that have 100+ tracks/artists
- Check if `next` field exists in API responses but isn't used

**Phase impact:** Phase 2 (API Integration) - Affects comparison accuracy

**Spotify-specific gotcha:**
- Default limit is 20, max is 50
- `offset` and `limit` parameters control pagination
- Some endpoints (like `/me/top/tracks`) support `time_range` parameter but still paginate results

---

### 8. Synchronous API Requests Causing Slow UX

**What goes wrong:**
Making API requests sequentially (one after another) when they could run in parallel causes slow loading times, especially for two-user comparisons.

**Why it happens:**
- Using `await` unnecessarily in sequence
- Not understanding Promise.all()
- Playing it safe with sequential requests

**Consequences:**
- 10+ seconds to load comparison page
- Users abandon the app during loading
- Two-user flow takes 2x longer than necessary

**Prevention:**
1. **Parallelize independent requests**:
   ```javascript
   // BAD: Sequential (slow)
   const user1Tracks = await fetchTopTracks(user1Token);
   const user2Tracks = await fetchTopTracks(user2Token);
   
   // GOOD: Parallel (2x faster)
   const [user1Tracks, user2Tracks] = await Promise.all([
     fetchTopTracks(user1Token),
     fetchTopTracks(user2Token),
   ]);
   ```
2. **Show loading indicators** with estimated time
3. **Progressive loading**: Show results as they arrive, don't wait for everything

**Detection:**
- Use browser Performance tab to analyze waterfall
- Measure time between requests - should be milliseconds, not seconds
- Test with real-world network throttling

**Phase impact:** Phase 2 (API Integration) - Major UX improvement

**Spotify-specific gotcha:**
- Rate limits still apply to parallel requests - balance speed vs limits
- Use `Promise.all()` with rate limit awareness

---

### 9. Not Handling Missing or Null Image URLs

**What goes wrong:**
Not all Spotify entities have images. Apps that assume images exist will crash or show broken image icons.

**Why it happens:**
- API returns `images: []` for some artists/albums/tracks
- Developers test with popular artists (always have images)

**Consequences:**
- Broken image tags showing placeholder icons
- Layout shifts when images fail to load
- Comparison page looks unprofessional

**Prevention:**
1. **Check for empty images array**:
   ```javascript
   const imageUrl = artist.images?.[0]?.url || '/placeholder-artist.png';
   ```
2. **Use appropriate image size**:
   - `images[0]` = largest (640x640)
   - `images[1]` = medium (320x320)
   - `images[2]` = smallest (160x160)
3. **Lazy load images** to improve performance
4. **Provide fallback placeholders** that match your design

**Detection:**
- Test with obscure artists/albums
- Check Network tab for 404s on image URLs
- Look for `images: []` in API responses

**Phase impact:** Phase 3 (Comparison UI) - Affects polish and professionalism

**Spotify-specific gotcha:**
- Image URLs are direct links (no authentication needed)
- Images array can be empty, not null - always check length
- Images are sorted largest to smallest

---

### 10. Poor State Management for Two-User Flow

**What goes wrong:**
Managing two separate OAuth flows, two tokens, and two datasets without clear state management leads to bugs where users are confused, tokens mixed up, or comparison uses wrong data.

**Why it happens:**
- Global variables for token storage
- Not clearly distinguishing User 1 vs User 2
- Race conditions when both users authorize simultaneously

**Consequences:**
- User 1's data shown for User 2
- Comparison uses same user's data twice
- Token refresh refreshes wrong user's token
- Confusion about which user is which

**Prevention:**
1. **Clear user identifiers**:
   ```javascript
   const state = {
     user1: { token, refreshToken, profile, topTracks, expiresAt },
     user2: { token, refreshToken, profile, topTracks, expiresAt },
   };
   ```
2. **Use `state` parameter in OAuth to track which user**:
   ```javascript
   const state = 'user1'; // or 'user2'
   // Include in authorization URL, verify in callback
   ```
3. **Visual indicators**: Show which user is which (colors, labels, avatars)
4. **Prevent re-authorization**: Once User 1 is authorized, don't let them re-authorize as User 2

**Detection:**
- Test with two different Spotify accounts
- Verify correct data appears for each user
- Check state parameter in OAuth callback

**Phase impact:** Phase 1 (OAuth Setup) and Phase 2 (API Integration) - Foundational for two-user feature

**Spotify-specific gotcha:**
- `state` parameter should be random for security (CSRF protection)
- You can encode user identifier in state: `state = 'user1_' + randomString()`

---

## Minor Pitfalls

These cause annoyance but are easily fixable.

### 11. Not Checking for User's Premium Status

**What goes wrong:**
Some Spotify API features require Premium accounts. Apps that don't check will confuse users when features don't work.

**Why it happens:**
- Developers test with Premium accounts
- Documentation doesn't always clarify Premium requirements

**Consequences:**
- Non-Premium users confused why features don't work
- Bad reviews: "App doesn't work!"

**Prevention:**
1. **Check user product type**:
   ```javascript
   const profile = await fetch('https://api.spotify.com/v1/me', {
     headers: { Authorization: `Bearer ${token}` }
   }).then(r => r.json());
   
   if (profile.product !== 'premium') {
     // Show message: "This feature requires Spotify Premium"
   }
   ```
2. **For Development Mode apps**: Owner must have Premium
3. **Document requirements clearly**: Tell users upfront if Premium needed

**Detection:**
- Test with free Spotify accounts
- Check `product` field in `/me` endpoint response

**Phase impact:** Phase 2 (API Integration) - Early user testing will reveal this

**Spotify-specific gotcha:**
- Development Mode requires app owner to have Premium
- Extended Quota Mode apps can be used by free users, but some endpoints still require Premium
- Check product type: `premium`, `free`, `open`

---

### 12. Hardcoding API URLs Instead of Using Constants

**What goes wrong:**
Spotify's API base URL is hardcoded throughout the codebase. If Spotify changes the API version or you need to add query parameters, you have to update multiple files.

**Why it happens:**
- Quick prototyping without refactoring
- Copy-pasting example code

**Consequences:**
- Maintenance burden
- Easy to miss updates
- Inconsistent API calls

**Prevention:**
1. **Use constants**:
   ```javascript
   const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';
   const SPOTIFY_ACCOUNTS_BASE = 'https://accounts.spotify.com';
   
   // Helper function
   const spotifyApi = async (endpoint, token) => {
     return fetch(`${SPOTIFY_API_BASE}${endpoint}`, {
       headers: { Authorization: `Bearer ${token}` }
     });
   };
   ```
2. **Or use a library**: `spotify-web-api-js` or similar

**Detection:**
- Search codebase for 'api.spotify.com'
- Check for duplicated URL strings

**Phase impact:** Phase 2 (API Integration) - Refactor early to save time later

**Spotify-specific gotcha:**
- Two base URLs: `api.spotify.com` (API) and `accounts.spotify.com` (auth)

---

### 13. Not Handling CORS During Development

**What goes wrong:**
Direct API calls from `localhost` frontend to Spotify API work, but this is unusual - many developers expect CORS errors. However, Spotify API does allow CORS from any origin.

**Why it happens:**
- Developers familiar with restrictive APIs expect CORS issues

**Consequences:**
- Over-engineering with proxy servers (not needed for Spotify)
- Confusion during development

**Prevention:**
1. **Know that Spotify API allows CORS** - direct frontend calls work
2. **No proxy needed** for Spotify API calls (unlike some other APIs)
3. **Auth endpoints** also support CORS for PKCE flow

**Detection:**
- N/A - this is actually not a problem with Spotify

**Phase impact:** Phase 2 (API Integration) - Understanding this saves unnecessary work

**Spotify-specific gotcha:**
- Spotify is developer-friendly with CORS
- Some APIs block CORS - Spotify doesn't
- This is why PKCE flow works entirely in the browser

---

## Phase-Specific Warnings

| Phase | Topic | Likely Pitfall | Mitigation |
|-------|-------|---------------|------------|
| Phase 1 | OAuth Setup | Using wrong flow (Code vs PKCE) | Use PKCE for browser apps - no backend needed for basic comparison |
| Phase 1 | OAuth Setup | Redirect URI mismatch | Add all URIs to Dashboard before testing; test exact match |
| Phase 1 | Two-User Flow | State management confusion | Use `state` parameter to track User 1 vs User 2 in OAuth callback |
| Phase 2 | API Integration | Missing `user-top-read` scope | Include scope in initial auth - required for top tracks/artists |
| Phase 2 | API Integration | Rate limiting (429 errors) | Use batch endpoints, implement retry-after, consider Extended Quota |
| Phase 2 | API Integration | Token expiration after 1 hour | Implement proactive token refresh (before expiration) |
| Phase 2 | Two-User Flow | Sequential API calls (slow) | Parallelize User 1 and User 2 data fetching with Promise.all() |
| Phase 3 | Comparison Logic | Pagination ignored | Loop through `next` field until null - don't stop at first 50 items |
| Phase 3 | UI/UX | Missing images cause broken UI | Check for empty images array, provide fallbacks |
| Phase 3 | Performance | Loading many images at once | Lazy load images, use smaller image sizes (images[2]) |

---

## Two-User Flow Specific Pitfalls

### Managing Two Separate OAuth Sessions

**Challenge:** Two users need to authorize independently, but you need to keep their data separate and synced.

**Common mistakes:**
1. **Overwriting User 1 token with User 2 token** - store tokens with clear identifiers
2. **Using same `state` parameter** - generate unique state for each user to prevent CSRF
3. **Not clearing old data** - when User 2 re-authorizes, clear old User 2 data

**Best practice:**
```javascript
// OAuth flow for User 1
const user1State = 'user1_' + crypto.randomUUID();
localStorage.setItem('oauth_state_user1', user1State);
// Redirect to Spotify with state=user1State

// In callback handler
const callbackState = urlParams.get('state');
if (callbackState.startsWith('user1_')) {
  // Store User 1 tokens
} else if (callbackState.startsWith('user2_')) {
  // Store User 2 tokens
}
```

### Token Refresh Coordination

**Challenge:** Both users' tokens expire independently. Need to track and refresh each separately.

**Best practice:**
```javascript
const refreshTokenIfNeeded = async (userNumber) => {
  const expiresAt = localStorage.getItem(`user${userNumber}_expires_at`);
  if (Date.now() >= expiresAt - (10 * 60 * 1000)) {
    const refreshToken = localStorage.getItem(`user${userNumber}_refresh_token`);
    const newToken = await refreshAccessToken(refreshToken);
    localStorage.setItem(`user${userNumber}_access_token`, newToken);
  }
};

// Before comparing data
await Promise.all([
  refreshTokenIfNeeded(1),
  refreshTokenIfNeeded(2),
]);
```

### Rate Limiting with Multiple Users

**Challenge:** Two users = 2x API calls, easier to hit rate limits.

**Best practice:**
- Fetch data in parallel where possible (faster, same rate limit impact)
- Cache comparison results (don't re-compare on every page load)
- Use batch endpoints to minimize total requests

---

## Sources

**Confidence: HIGH** - All findings verified with official Spotify documentation.

| Topic | Source | Type |
|-------|--------|------|
| Authorization Flows | https://developer.spotify.com/documentation/web-api/concepts/authorization | Official Docs |
| PKCE Flow | https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow | Official Tutorial |
| Rate Limits | https://developer.spotify.com/documentation/web-api/concepts/rate-limits | Official Docs |
| Token Refresh | https://developer.spotify.com/documentation/web-api/tutorials/refreshing-tokens | Official Tutorial |
| Quota Modes | https://developer.spotify.com/documentation/web-api/concepts/quota-modes | Official Docs |
| Scopes | https://developer.spotify.com/documentation/web-api/concepts/scopes | Official Docs |

**Additional research needed:**
- Real-world performance benchmarks for two-user comparison (test during implementation)
- Image loading optimization strategies for 50+ album covers (test during Phase 3)
- Extended Quota Mode approval timeline and requirements (if scaling beyond 25 users)

---

## Summary

**Most Critical for Spotify Taste Match:**

1. **Use PKCE flow** (not Authorization Code) - no backend needed, secure for browser
2. **Get scopes right**: Include `user-top-read` from the start
3. **Implement token refresh** - tokens expire after 1 hour
4. **Handle rate limits** - two users = 2x API calls, use batch endpoints
5. **Clear state management** - distinguish User 1 vs User 2 throughout app
6. **Test with real accounts** - different data sizes, edge cases (no images, 1000+ tracks)

The two-user flow adds complexity but doesn't introduce unique pitfalls - just 2x the OAuth, 2x the tokens, 2x the API calls. Strong state management and clear user identification prevent most issues.
