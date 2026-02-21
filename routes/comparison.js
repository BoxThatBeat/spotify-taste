const express = require('express');
const SpotifyWebApi = require('spotify-web-api-node');

const router = express.Router();

// Configure Spotify API client (matches auth.js pattern)
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI
});

/**
 * Helper: Check if token is expired (from spotify-data.js pattern)
 */
function isTokenExpired(expiresAt) {
  // Consider expired if less than 5 minutes remaining (buffer for API calls)
  return Date.now() >= (expiresAt - 5 * 60 * 1000);
}

/**
 * Helper: Refresh access token for a user (from spotify-data.js pattern)
 */
async function refreshUserToken(userKey, tokens, session) {
  console.log(`Refreshing token for ${userKey}`);
  
  // Create a fresh instance for this user to avoid token contamination
  const userSpotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI
  });
  
  userSpotifyApi.setRefreshToken(tokens.refreshToken);
  
  try {
    const data = await userSpotifyApi.refreshAccessToken();
    const { access_token, expires_in } = data.body;
    
    // Update session with new token
    session.tokens[userKey].accessToken = access_token;
    session.tokens[userKey].expiresAt = Date.now() + (expires_in * 1000);
    
    console.log(`Token refreshed for ${userKey}, expires in ${expires_in} seconds`);
    
    return access_token;
  } catch (error) {
    console.error(`Token refresh failed for ${userKey}:`, error);
    throw new Error('Session expired, please restart authorization');
  }
}

/**
 * Helper: Fetch user's top artists and tracks from Spotify
 */
async function fetchUserData(userKey, timeRange, session) {
  const tokens = session.tokens[userKey];
  let accessToken = tokens.accessToken;
  
  // Refresh token if expired
  if (isTokenExpired(tokens.expiresAt)) {
    accessToken = await refreshUserToken(userKey, tokens, session);
  }
  
  // Create fresh API instance for this user
  const userSpotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI
  });
  userSpotifyApi.setAccessToken(accessToken);
  
  // Fetch top artists and tracks in parallel
  const [topArtists, topTracks] = await Promise.all([
    userSpotifyApi.getMyTopArtists({ time_range: timeRange, limit: 50 }),
    userSpotifyApi.getMyTopTracks({ time_range: timeRange, limit: 50 })
  ]);
  
  return {
    topArtists: topArtists.body.items.map(artist => ({
      id: artist.id,
      name: artist.name,
      images: artist.images,
      genres: artist.genres
    })),
    topTracks: topTracks.body.items.map(track => ({
      id: track.id,
      name: track.name,
      album: {
        images: track.album.images
      },
      artists: track.artists.map(artist => ({
        name: artist.name
      }))
    }))
  };
}

/**
 * Core comparison logic using Set-based intersection and Jaccard index
 * Based on research from 03-RESEARCH.md
 */
function compareUsers(userAData, userBData) {
  // Extract artist IDs into Sets for O(1) lookup
  const userAArtistIds = new Set(userAData.topArtists.map(a => a.id));
  const userBArtistIds = new Set(userBData.topArtists.map(a => a.id));
  
  // Extract track IDs into Sets
  const userATrackIds = new Set(userAData.topTracks.map(t => t.id));
  const userBTrackIds = new Set(userBData.topTracks.map(t => t.id));
  
  // Find shared artist IDs (intersection using filter + has pattern for Node 20)
  const sharedArtistIds = new Set(
    [...userAArtistIds].filter(id => userBArtistIds.has(id))
  );
  
  // Find shared track IDs (intersection)
  const sharedTrackIds = new Set(
    [...userATrackIds].filter(id => userBTrackIds.has(id))
  );
  
  // Calculate Jaccard index for artists: |A ∩ B| / (|A| + |B| - |A ∩ B|) * 100
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
  
  // Enrich shared IDs with full metadata (artist name, images, track titles, album covers)
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

/**
 * POST /compare
 * Performs server-side comparison of two users' music data
 * Mounted at /api in server.js, so full path is /api/compare
 * Request body: { timeRange: 'short_term' | 'medium_term' | 'long_term' }
 */
router.post('/compare', async (req, res) => {
  try {
    // Validate both users are authorized
    if (!req.session.tokens?.userA || !req.session.tokens?.userB) {
      return res.status(400).json({ 
        error: 'Both users must be authorized',
        details: 'Missing authorization for one or both users. Please complete OAuth flow first.'
      });
    }
    
    // Validate and normalize time range parameter
    const { timeRange = 'medium_term' } = req.body;
    const validTimeRanges = ['short_term', 'medium_term', 'long_term'];
    
    if (!validTimeRanges.includes(timeRange)) {
      return res.status(400).json({
        error: 'Invalid time range',
        details: `Time range must be one of: ${validTimeRanges.join(', ')}`,
        received: timeRange
      });
    }
    
    console.log(`Comparing users with time range: ${timeRange}`);
    
    // Fetch data for both users
    const [userAData, userBData] = await Promise.all([
      fetchUserData('userA', timeRange, req.session),
      fetchUserData('userB', timeRange, req.session)
    ]);
    
    console.log(`User A: ${userAData.topArtists.length} artists, ${userAData.topTracks.length} tracks`);
    console.log(`User B: ${userBData.topArtists.length} artists, ${userBData.topTracks.length} tracks`);
    
    // Perform comparison (all processing server-side)
    const comparisonResults = compareUsers(userAData, userBData);
    
    console.log(`Comparison complete: ${comparisonResults.matchPercentage}% overall match`);
    console.log(`  Artists: ${comparisonResults.breakdown.artistsMatch}% (${comparisonResults.counts.sharedArtists} shared)`);
    console.log(`  Tracks: ${comparisonResults.breakdown.tracksMatch}% (${comparisonResults.counts.sharedTracks} shared)`);
    
    // Return only matched results to frontend (privacy-preserving)
    res.json(comparisonResults);
    
  } catch (error) {
    console.error('Comparison error:', error);
    console.error('Error details:', error.message);
    
    // Include stack trace in development mode
    const errorResponse = {
      error: 'Failed to compare users',
      details: error.message
    };
    
    if (process.env.NODE_ENV !== 'production') {
      errorResponse.stack = error.stack;
    }
    
    // Check for specific Spotify API errors
    if (error.statusCode) {
      console.error('Spotify API error - Status:', error.statusCode);
      if (error.body) {
        console.error('Response body:', error.body);
        errorResponse.spotifyError = error.body;
      }
      
      if (error.statusCode === 429) {
        return res.status(503).json(errorResponse);
      }
      
      if (error.statusCode === 401) {
        return res.status(401).json(errorResponse);
      }
    }
    
    res.status(500).json(errorResponse);
  }
});

module.exports = router;
