# Phase 2: Data Pipeline - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

System reliably fetches top artists and tracks for both users from Spotify API. Includes time range selection (4 weeks, 6 months, all time), parallel fetching, automatic token refresh, and graceful error handling. Results display is Phase 4.

</domain>

<decisions>
## Implementation Decisions

### Fetch trigger and flow
- Default time range: 6 months (pre-selected when both users authorized)
- Show "Compare Now" or similar button to trigger fetch
- During fetch: Loading spinner with message ("Analyzing your music taste...")
- Time range selector on results page: Users can switch time ranges and re-fetch without restarting flow
- Dropdown or buttons for time range selection (4 weeks, 6 months, all time)

### Error scenarios
- Rate limit handling: Retry automatically with exponential backoff, show "Taking longer than expected..." to user
- Partial fetch failures: Block everything — comparison needs both users' data, show error if either fails
- Error messages: Show full technical details (for debugging), not just friendly generic messages
- Token refresh failures: Edge case ignored (1 hour plenty for in-person use), show error if it somehow occurs

### OpenCode's Discretion
- Exact loading message wording
- Time range selector UI design (dropdown vs buttons vs tabs)
- Retry backoff timing strategy
- Error message formatting and layout
- Token refresh timing (proactive vs reactive within 1-hour window)

</decisions>

<specifics>
## Specific Ideas

- "1 hour is plenty of time" — In-person use case completes well within token expiry
- "Don't care if user sees technical details, want to be able to easily debug" — Prioritize debuggability over polish for error states

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-data-pipeline*
*Context gathered: 2026-02-19*
