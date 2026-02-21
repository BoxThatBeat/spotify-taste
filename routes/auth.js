const express = require('express');
const SpotifyWebApi = require('spotify-web-api-node');
const crypto = require('crypto');

const router = express.Router();

// Configure Spotify API client
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI
});

// Required scopes for accessing user's top artists and tracks, plus user profile
const SCOPES = ['user-top-read', 'user-read-private', 'user-read-email'];

// Track processing authorization codes to prevent duplicate requests
const processingCodes = new Set();

/**
 * GET /login/userA
 * Initiates OAuth flow for User A (the first user)
 */
router.get('/login/userA', (req, res) => {
  try {
    // Generate random state for CSRF protection
    const state = crypto.randomBytes(16).toString('hex');
    
    // Store state in session for validation on callback
    req.session.oauthState = state;
    req.session.currentUser = 'userA';
    
    // Create Spotify authorization URL
    const authorizeURL = spotifyApi.createAuthorizeURL(SCOPES, state);
    
    // Redirect user to Spotify authorization page
    res.redirect(authorizeURL);
  } catch (error) {
    console.error('Error initiating User A login:', error);
    res.status(500).send('Something went wrong starting authorization. Try again?');
  }
});

/**
 * GET /login/userB
 * Initiates OAuth flow for User B (the second user)
 * Requires User A to have already authorized
 */
router.get('/login/userB', (req, res) => {
  try {
    // Check if User A has authorized first
    if (!req.session.tokens.userA) {
      return res.status(400).send('User A must authorize first.');
    }
    
    // Generate random state for CSRF protection
    const state = crypto.randomBytes(16).toString('hex');
    
    // Store state in session for validation on callback
    req.session.oauthState = state;
    req.session.currentUser = 'userB';
    
    // Create Spotify authorization URL with show_dialog=true
    // This forces Spotify to show account picker instead of auto-login
    const authorizeURL = spotifyApi.createAuthorizeURL(SCOPES, state);
    
    // Manually append show_dialog parameter to force account selection
    const urlWithDialog = authorizeURL + '&show_dialog=true';
    
    // Redirect user to Spotify authorization page
    res.redirect(urlWithDialog);
  } catch (error) {
    console.error('Error initiating User B login:', error);
    res.status(500).send('Something went wrong starting authorization. Try again?');
  }
});

/**
 * GET /callback
 * Handles OAuth callback from Spotify
 * Exchanges authorization code for access/refresh tokens
 */
router.get('/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;
    
    // Handle authorization errors (user cancelled, etc.)
    if (error) {
      console.error('OAuth authorization error:', error);
      return res.redirect('/?error=' + encodeURIComponent('Authorization was cancelled or failed.'));
    }
    
    // Check if code exists
    if (!code) {
      console.error('No authorization code received');
      return res.redirect('/?error=' + encodeURIComponent('No authorization code received.'));
    }
    
    // Prevent duplicate processing of the same authorization code
    if (processingCodes.has(code)) {
      console.log('Authorization code already being processed, ignoring duplicate request');
      return res.redirect('/?status=processing');
    }
    
    processingCodes.add(code);
    
    // Validate state parameter (CSRF protection)
    if (!req.session.oauthState) {
      console.error('No OAuth state in session - session may have expired');
      return res.redirect('/?error=' + encodeURIComponent('Session expired. Please start authorization again.'));
    }
    
    if (state !== req.session.oauthState) {
      console.error('State mismatch - potential CSRF attack');
      console.error('Expected:', req.session.oauthState);
      console.error('Received:', state);
      return res.redirect('/?error=' + encodeURIComponent('Invalid state parameter. Please restart authorization.'));
    }
    
    // Clear OAuth state immediately to prevent reuse
    const currentUser = req.session.currentUser;
    delete req.session.oauthState;
    delete req.session.currentUser;
    
    if (!currentUser) {
      console.error('No currentUser in session');
      return res.redirect('/?error=' + encodeURIComponent('Session error. Please restart authorization.'));
    }
    
    console.log(`Processing authorization for ${currentUser} with code: ${code.substring(0, 10)}...`);
    console.log('Auth code full length:', code.length);
    console.log('Using CLIENT_ID:', process.env.SPOTIFY_CLIENT_ID);
    console.log('Using REDIRECT_URI:', process.env.SPOTIFY_REDIRECT_URI);
    
    // Create a fresh SpotifyWebApi instance for this user
    // This prevents token contamination between User A and User B
    const userSpotifyApi = new SpotifyWebApi({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      redirectUri: process.env.SPOTIFY_REDIRECT_URI
    });
    
    console.log('Attempting to exchange auth code for tokens...');
    
    // Exchange authorization code for access/refresh tokens
    const data = await userSpotifyApi.authorizationCodeGrant(code);
    
    console.log('✓ Token exchange successful!');
    const { access_token, refresh_token, expires_in } = data.body;
    
    // Get user profile to retrieve Spotify ID (for duplicate detection)
    userSpotifyApi.setAccessToken(access_token);
    const profile = await userSpotifyApi.getMe();
    const spotifyId = profile.body.id;
    const displayName = profile.body.display_name;
    
    // Duplicate account detection
    const otherUser = currentUser === 'userA' ? 'userB' : 'userA';
    const otherTokens = req.session.tokens[otherUser];
    
    if (otherTokens && otherTokens.spotifyId === spotifyId) {
      console.log(`Duplicate account detected: ${spotifyId} already authorized as ${otherUser}`);
      return res.redirect('/?error=' + encodeURIComponent('This account already authorized. User B needs a different account.'));
    }
    
    // Store tokens in session
    req.session.tokens[currentUser] = {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt: Date.now() + (expires_in * 1000),
      spotifyId: spotifyId,
      displayName: displayName
    };
    
    console.log(`Successfully authorized ${currentUser}: ${displayName} (${spotifyId})`);
    
    // Remove code from processing set
    processingCodes.delete(code);
    
    // Redirect to success page
    res.redirect('/?status=success');
  } catch (error) {
    console.error('Error handling OAuth callback:', error);
    console.error('Error details:', error.message);
    
    // Remove code from processing set on error
    if (req.query.code) {
      processingCodes.delete(req.query.code);
    }
    
    // Check if it's a Spotify API error
    if (error.statusCode) {
      console.error('Spotify API error - Status:', error.statusCode);
      console.error('Response body:', error.body);
      
      if (error.statusCode === 403) {
        return res.redirect('/?error=' + encodeURIComponent('Authorization code expired or invalid. Please try again.'));
      }
      
      if (error.statusCode === 400) {
        return res.redirect('/?error=' + encodeURIComponent('Invalid authorization request. Please restart authorization.'));
      }
    }
    
    res.redirect('/?error=' + encodeURIComponent('Something went wrong completing authorization. Check server logs.'));
  }
});

module.exports = router;
