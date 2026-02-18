# Setup Guide

## Quick Start

### 1. Generate SSL Certificates

Spotify requires HTTPS for OAuth callbacks. Generate self-signed certificates:

```bash
npm run generate-cert
```

This creates `localhost.pem` and `localhost-key.pem` (valid for 365 days).

### 2. Configure Spotify App

1. Go to https://developer.spotify.com/dashboard
2. Create a new app or select existing app
3. Click "Edit Settings"
4. Add Redirect URI: `https://localhost:3000/callback`
5. Save

### 3. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
SPOTIFY_CLIENT_ID=<your_client_id_from_dashboard>
SPOTIFY_CLIENT_SECRET=<your_client_secret_from_dashboard>
SPOTIFY_REDIRECT_URI=https://localhost:3000/callback
SESSION_SECRET=<generate_random_string>
```

**Generate SESSION_SECRET:**
```bash
openssl rand -base64 32
```

### 4. Start the Server

```bash
npm start
```

You should see:
```
Server running on https://localhost:3000
✓ Using HTTPS with self-signed certificate
```

### 5. Access the App

Open https://localhost:3000 in your browser.

**Important:** Your browser will show a security warning because the certificate is self-signed. This is expected for local development.

**To bypass the warning:**
- Chrome: Click "Advanced" → "Proceed to localhost (unsafe)"
- Firefox: Click "Advanced" → "Accept the Risk and Continue"
- Safari: Click "Show Details" → "visit this website"

## Testing OAuth Flow

See the checkpoint verification scenarios in plan 01-04 for complete test instructions.

### Quick Test

1. Open https://localhost:3000
2. Click "Connect Your Spotify"
3. Authorize with your Spotify account
4. Verify you see "✓ Connected as [your name]"
5. Click "Connect Friend's Spotify"
6. Authorize with a different Spotify account
7. Verify both users show as connected

## Troubleshooting

### Certificate Issues

If you see "certificates don't exist" error:
```bash
npm run generate-cert
```

### Redirect URI Mismatch

Verify your `.env` file has:
```
SPOTIFY_REDIRECT_URI=https://localhost:3000/callback
```

And Spotify Dashboard has the exact same URI configured.

### Port Already in Use

Change the port in `.env`:
```
PORT=3001
```

Then update Spotify Dashboard redirect URI to match: `https://localhost:3001/callback`
