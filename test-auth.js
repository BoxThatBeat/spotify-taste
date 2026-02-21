// Quick test to simulate the OAuth flow
require('dotenv').config();
const SpotifyWebApi = require('spotify-web-api-node');

console.log('=== Spotify OAuth Flow Test ===\n');

console.log('1. Environment Variables:');
console.log('   CLIENT_ID:', process.env.SPOTIFY_CLIENT_ID?.substring(0, 8) + '...');
console.log('   CLIENT_SECRET:', process.env.SPOTIFY_CLIENT_SECRET ? 'SET (' + process.env.SPOTIFY_CLIENT_SECRET.length + ' chars)' : 'NOT SET');
console.log('   REDIRECT_URI:', process.env.SPOTIFY_REDIRECT_URI);
console.log('');

console.log('2. Creating SpotifyWebApi instance...');
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI
});
console.log('   ✓ Instance created');
console.log('');

console.log('3. Generating authorization URL...');
const SCOPES = ['user-top-read'];
const state = 'test-state-12345';
const authorizeURL = spotifyApi.createAuthorizeURL(SCOPES, state);
console.log('   ✓ URL generated');
console.log('   URL:', authorizeURL);
console.log('');

console.log('4. Testing credentials with Client Credentials flow...');
spotifyApi.clientCredentialsGrant()
  .then(data => {
    console.log('   ✓ Credentials are VALID');
    console.log('');
    console.log('=== All Tests Passed ===');
    console.log('');
    console.log('Next steps:');
    console.log('1. Visit this URL in your browser:');
    console.log('   ' + authorizeURL);
    console.log('');
    console.log('2. After authorizing, Spotify will redirect you with a "code" parameter');
    console.log('3. Copy that code and run:');
    console.log('   node test-exchange.js YOUR_CODE_HERE');
  })
  .catch(error => {
    console.log('   ✗ Credentials are INVALID');
    console.log('   Error:', error.message);
    console.log('   Status:', error.statusCode);
    console.log('');
    console.log('=== FIX REQUIRED ===');
    console.log('Go to https://developer.spotify.com/dashboard');
    console.log('Click your app → Settings');
    console.log('Copy the Client ID and Client Secret to your .env file');
  });
