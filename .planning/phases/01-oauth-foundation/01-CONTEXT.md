# Phase 1: OAuth Foundation - Context

**Gathered:** 2026-02-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Both users can securely authorize their Spotify accounts sequentially on the same device. System stores OAuth tokens server-side, validates CSRF protection, and maintains separate token storage for each user. This phase establishes the authentication foundation — no data fetching or comparison logic yet.

</domain>

<decisions>
## Implementation Decisions

### Error & Edge Cases

**Authorization cancellation:**
- If either user cancels on Spotify authorization screen → restart entire flow
- Return to landing page, both users start over (no partial state preserved)

**Duplicate account detection:**
- Block immediately if User B authorizes the same Spotify account as User A
- Show error message: "This account already authorized. User B needs a different account."
- Don't allow comparing same account with itself

**Session timeout:**
- Clear session and restart if too much time passes between User A and User B authorization
- Both users must restart from landing page after timeout
- OpenCode determines timeout duration (suggest 10-15 minutes)

**API errors:**
- Show friendly error message without technical details
- Include retry button: "Something went wrong. Try again?"
- Don't expose raw Spotify API error messages to users

### User Identification & Labeling

**User references:**
- Use "You" for User A (person who started)
- Use "Friend" for User B (second person)
- Maintain this labeling throughout the interface

**Visual distinction:**
- No color coding or visual distinction between users
- Text labels ("You" / "Friend") are sufficient
- No need for avatar display or colored UI elements

**Authorization prompts:**
- Direct and simple phrasing
- User A: "Connect Your Spotify"
- User B: "Connect Friend's Spotify"
- Avoid numbered steps or overly contextual language

**Post-authorization confirmation:**
- Show Spotify username after successful authorization
- Format: "✓ Connected as [username]"
- Provides confirmation that correct account was connected

### OpenCode's Discretion

- Exact session timeout duration (suggest 10-15 minutes)
- Loading states during OAuth redirect flow
- Exact error message wording (maintain friendly tone)
- Button styling and placement
- Landing page layout and design

</decisions>

<specifics>
## Specific Ideas

- Keep error messages user-friendly, avoid technical jargon
- "You" / "Friend" labeling creates personal, casual tone matching in-person use case
- Showing username after auth prevents confusion about which account connected

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-oauth-foundation*
*Context gathered: 2026-02-18*
