// Test exchanging an authorization code for tokens
require('dotenv').config();
const SpotifyWebApi = require('spotify-web-api-node');

const authCode = process.argv[2];

if (!authCode) {
  console.log('Usage: node test-exchange.js YOUR_AUTH_CODE');
  console.log('');
  console.log('To get an auth code:');
  console.log('1. Run: node test-auth.js');
  console.log('2. Visit the URL it generates');
  console.log('3. After authorizing, copy the "code" parameter from the redirect URL');
  process.exit(1);
}

console.log('=== Testing Token Exchange ===\n');
console.log('Auth code (first 20 chars):', authCode.substring(0, 20) + '...');
console.log('Auth code length:', authCode.length);
console.log('');

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI
});

console.log('Attempting token exchange...');
console.log('');

spotifyApi.authorizationCodeGrant(authCode)
  .then(data => {
    console.log('✓ SUCCESS! Token exchange worked!');
    console.log('');
    console.log('Access token (first 20 chars):', data.body.access_token.substring(0, 20) + '...');
    console.log('Refresh token (first 20 chars):', data.body.refresh_token.substring(0, 20) + '...');
    console.log('Expires in:', data.body.expires_in, 'seconds');
    console.log('');
    console.log('=== Your credentials and redirect URI are correct! ===');
  })
  .catch(error => {
    console.log('✗ FAILED! Token exchange error:');
    console.log('');
    console.log('Status Code:', error.statusCode);
    console.log('Message:', error.message);
    console.log('Body:', JSON.stringify(error.body, null, 2));
    console.log('');
    
    if (error.statusCode === 400) {
      console.log('=== 400 Error - Possible Causes ===');
      console.log('1. Authorization code already used (codes are one-time use)');
      console.log('2. Authorization code expired (codes expire after ~10 minutes)');
      console.log('3. Get a fresh code by running: node test-auth.js');
    } else if (error.statusCode === 403) {
      console.log('=== 403 Error - THIS IS YOUR ISSUE! ===');
      console.log('Possible causes:');
      console.log('1. REDIRECT_URI mismatch');
      console.log('   .env has:', process.env.SPOTIFY_REDIRECT_URI);
      console.log('   Spotify Dashboard must have EXACTLY this URL');
      console.log('');
      console.log('2. Check your Spotify Dashboard:');
      console.log('   https://developer.spotify.com/dashboard');
      console.log('   - Click your app → Settings → Redirect URIs');
      console.log('   - Add:', process.env.SPOTIFY_REDIRECT_URI);
      console.log('   - Save changes');
      console.log('');
      console.log('3. App in Development mode without user whitelisted');
      console.log('   - Dashboard → Your App → Users and Access');
      console.log('   - Add your Spotify email address');
    }
  });
