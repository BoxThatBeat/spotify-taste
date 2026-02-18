# Setup Guide

## Quick Start

Spotify requires HTTPS for OAuth callbacks. Since self-signed certificates don't work with Spotify's validation, we'll use **ngrok** to create a secure tunnel.

### 1. Install ngrok

Download from https://ngrok.com/download or use package manager:

```bash
# Linux/Mac with Homebrew
brew install ngrok

# Or download binary directly
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok
```

Sign up for free account at https://ngrok.com and get your auth token.

```bash
ngrok config add-authtoken <your_token>
```

### 2. Start the Application Server

```bash
npm start
```

Server runs on http://localhost:3000

### 3. Start ngrok Tunnel (in separate terminal)

```bash
ngrok http 3000
```

You'll see output like:
```
Forwarding   https://abcd-123-456-789.ngrok-free.app -> http://localhost:3000
```

Copy the **https** URL (e.g., `https://abcd-123-456-789.ngrok-free.app`)

### 4. Configure Spotify App

1. Go to https://developer.spotify.com/dashboard
2. Create a new app or select existing app
3. Click "Edit Settings"
4. Add Redirect URI: `https://your-ngrok-url.ngrok-free.app/callback`
   - Replace `your-ngrok-url` with your actual ngrok URL
5. Save

### 5. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
SPOTIFY_CLIENT_ID=<your_client_id_from_dashboard>
SPOTIFY_CLIENT_SECRET=<your_client_secret_from_dashboard>
SPOTIFY_REDIRECT_URI=https://your-ngrok-url.ngrok-free.app/callback
SESSION_SECRET=<generate_random_string>
```

**Important:** Use your actual ngrok URL from step 3.

**Generate SESSION_SECRET:**
```bash
openssl rand -base64 32
```

### 6. Access the App

Open your ngrok URL in browser: `https://your-ngrok-url.ngrok-free.app`

**Note:** ngrok free tier shows an interstitial page on first visit. Click "Visit Site" to continue.

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

### Redirect URI Mismatch

Verify your `.env` file and Spotify Dashboard have the **exact same** redirect URI:
```
SPOTIFY_REDIRECT_URI=https://your-ngrok-url.ngrok-free.app/callback
```

### ngrok URL Changed

ngrok free tier generates new URLs on restart. When this happens:
1. Note the new ngrok URL
2. Update `.env` with new URL
3. Update Spotify Dashboard redirect URI
4. Restart your app: `npm start`

### Port Already in Use

Change the port:
```bash
PORT=3001 npm start
```

Then restart ngrok:
```bash
ngrok http 3001
```

### Session Issues

If session isn't persisting, make sure `SESSION_SECRET` is set in `.env`

## Alternative: Local HTTPS (Advanced)

If you need a permanent local HTTPS solution without ngrok:

1. Install mkcert (creates locally-trusted certificates)
2. Generate certificates: `mkcert localhost`
3. Update server.js to use HTTPS with the certificates
4. Add `https://localhost:3000/callback` to Spotify Dashboard

This requires system-level certificate installation and may not work with Spotify's validation.
