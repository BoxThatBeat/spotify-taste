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
 * Helper: Check if token is expired
 */
function isTokenExpired(expiresAt) {
  // Consider expired if less than 5 minutes remaining (buffer for API calls)
  return Date.now() >= (expiresAt - 5 * 60 * 1000);
}

/**
 * Helper: Refresh access token for a user
 */
async function refreshUserToken(userKey, tokens, session) {
  console.log(`Refreshing token for ${userKey}`);
  
  spotifyApi.setRefreshToken(tokens.refreshToken);
  
  try {
    const data = await spotifyApi.refreshAccessToken();
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
 * Helper: Fetch data with rate limit retry logic
 */
async function fetchWithRetry(fetchFn, maxRetries = 3) {
  let retries = 0;
  let waitTime = 1; // Initial wait time in seconds
  
  while (retries <= maxRetries) {
    try {
      return await fetchFn();
    } catch (error) {
      // Check if it's a rate limit error
      if (error.statusCode === 429 && retries < maxRetries) {
        // Extract Retry-After header or use exponential backoff
        const retryAfter = error.headers && error.headers['retry-after'] 
          ? parseInt(error.headers['retry-after']) 
          : waitTime;
        
        console.log(`Rate limited, retrying after ${retryAfter} seconds (attempt ${retries + 1}/${maxRetries})`);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        
        // Exponential backoff for next retry
        waitTime *= 2;
        retries++;
      } else {
        // Not a rate limit error or max retries exceeded
        throw error;
      }
    }
  }
  
  throw new Error('Spotify API rate limited, try again in a few minutes');
}

/**
 * GET /api/fetch-data
 * Fetches top artists and tracks for both users from Spotify API
 * Query params: timeRange (short_term, medium_term, long_term)
 */
router.get('/api/fetch-data', async (req, res) => {
  try {
    // Validate both users are authorized
    if (!req.session.tokens?.userA || !req.session.tokens?.userB) {
      return res.status(400).json({ 
        error: 'Both users must be authorized',
        details: 'Missing authorization for one or both users. Please complete OAuth flow first.'
      });
    }
    
    // Validate and normalize time range parameter
    const timeRange = req.query.timeRange || 'medium_term';
    const validTimeRanges = ['short_term', 'medium_term', 'long_term'];
    
    if (!validTimeRanges.includes(timeRange)) {
      return res.status(400).json({
        error: 'Invalid time range',
        details: `Time range must be one of: ${validTimeRanges.join(', ')}`,
        received: timeRange
      });
    }
    
    console.log(`Fetching data for time range: ${timeRange}`);
    
    // Check and refresh tokens if needed
    const userATokens = req.session.tokens.userA;
    const userBTokens = req.session.tokens.userB;
    
    let userAAccessToken = userATokens.accessToken;
    let userBAccessToken = userBTokens.accessToken;
    
    // Refresh User A token if expired
    if (isTokenExpired(userATokens.expiresAt)) {
      try {
        userAAccessToken = await refreshUserToken('userA', userATokens, req.session);
      } catch (error) {
        return res.status(401).json({
          error: 'User A session expired',
          details: error.message
        });
      }
    }
    
    // Refresh User B token if expired
    if (isTokenExpired(userBTokens.expiresAt)) {
      try {
        userBAccessToken = await refreshUserToken('userB', userBTokens, req.session);
      } catch (error) {
        return res.status(401).json({
          error: 'User B session expired',
          details: error.message
        });
      }
    }
    
    // Fetch data for both users in parallel
    console.log('Fetching top artists and tracks for both users...');
    
    const [userAData, userBData] = await Promise.all([
      // User A data
      (async () => {
        spotifyApi.setAccessToken(userAAccessToken);
        
        const [topArtists, topTracks] = await Promise.all([
          fetchWithRetry(() => spotifyApi.getMyTopArtists({ 
            time_range: timeRange, 
            limit: 50 
          })),
          fetchWithRetry(() => spotifyApi.getMyTopTracks({ 
            time_range: timeRange, 
            limit: 50 
          }))
        ]);
        
        return {
          displayName: userATokens.displayName,
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
      })(),
      
      // User B data
      (async () => {
        spotifyApi.setAccessToken(userBAccessToken);
        
        const [topArtists, topTracks] = await Promise.all([
          fetchWithRetry(() => spotifyApi.getMyTopArtists({ 
            time_range: timeRange, 
            limit: 50 
          })),
          fetchWithRetry(() => spotifyApi.getMyTopTracks({ 
            time_range: timeRange, 
            limit: 50 
          }))
        ]);
        
        return {
          displayName: userBTokens.displayName,
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
      })()
    ]);
    
    console.log(`Successfully fetched data for both users (${userAData.topArtists.length} artists, ${userAData.topTracks.length} tracks each)`);
    
    // Return combined response
    res.json({
      userA: userAData,
      userB: userBData,
      timeRange: timeRange
    });
    
  } catch (error) {
    console.error('Error fetching Spotify data:', error);
    console.error('Error details:', error.message);
    
    // Include stack trace in development mode
    const errorResponse = {
      error: 'Failed to fetch Spotify data',
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
