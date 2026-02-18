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

// Required scopes for accessing user's top artists and tracks
const SCOPES = ['user-top-read'];

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
    
    // Create Spotify authorization URL
    const authorizeURL = spotifyApi.createAuthorizeURL(SCOPES, state);
    
    // Redirect user to Spotify authorization page
    res.redirect(authorizeURL);
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
      return res.status(400).send('Authorization was cancelled or failed. Try again?');
    }
    
    // Validate state parameter (CSRF protection)
    if (state !== req.session.oauthState) {
      console.error('State mismatch - potential CSRF attack');
      return res.status(400).send('Invalid state parameter. Please restart authorization.');
    }
    
    // Exchange authorization code for access/refresh tokens
    const data = await spotifyApi.authorizationCodeGrant(code);
    const { access_token, refresh_token, expires_in } = data.body;
    
    // Get user profile to retrieve Spotify ID (for duplicate detection)
    spotifyApi.setAccessToken(access_token);
    const profile = await spotifyApi.getMe();
    const spotifyId = profile.body.id;
    const displayName = profile.body.display_name;
    
    // Duplicate account detection
    const currentUser = req.session.currentUser;
    const otherUser = currentUser === 'userA' ? 'userB' : 'userA';
    const otherTokens = req.session.tokens[otherUser];
    
    if (otherTokens && otherTokens.spotifyId === spotifyId) {
      return res.status(400).send('This account already authorized. User B needs a different account.');
    }
    
    // Store tokens in session
    req.session.tokens[currentUser] = {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt: Date.now() + (expires_in * 1000),
      spotifyId: spotifyId,
      displayName: displayName
    };
    
    // Clear OAuth state from session
    delete req.session.oauthState;
    delete req.session.currentUser;
    
    // Redirect to success page
    res.redirect('/?status=success');
  } catch (error) {
    console.error('Error handling OAuth callback:', error);
    res.status(500).send('Something went wrong completing authorization. Try again?');
  }
});

module.exports = router;
