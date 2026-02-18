// Load environment variables first (before other imports)
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const https = require('https');
const fs = require('fs');
const path = require('path');
const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware (configured before routes)
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 15 * 60 * 1000, // 15 minutes (session timeout from CONTEXT.md)
    httpOnly: true,
    secure: true, // Always use secure cookies with HTTPS
    sameSite: 'lax'
  }
}));

// Initialize session token structure
app.use((req, res, next) => {
  if (!req.session.tokens) {
    req.session.tokens = { userA: null, userB: null };
  }
  next();
});

// Serve static files from public directory
app.use(express.static('public'));

// Session status API endpoint
app.get('/api/session-status', (req, res) => {
  const userA = req.session.tokens?.userA ? {
    displayName: req.session.tokens.userA.displayName,
    spotifyId: req.session.tokens.userA.spotifyId
  } : null;
  
  const userB = req.session.tokens?.userB ? {
    displayName: req.session.tokens.userB.displayName,
    spotifyId: req.session.tokens.userB.spotifyId
  } : null;
  
  res.json({ userA, userB });
});

// Session clear endpoint (for testing/restart)
app.post('/api/clear-session', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Failed to clear session' });
    res.json({ success: true });
  });
});

// Mount OAuth routes
const authRoutes = require('./routes/auth');
app.use('/', authRoutes);

// Start server
const PORT = process.env.PORT || 3000;

// Check if SSL certificates exist for HTTPS
const certPath = path.join(__dirname, 'localhost.pem');
const keyPath = path.join(__dirname, 'localhost-key.pem');

if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
  // Start HTTPS server with certificates
  const httpsOptions = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath)
  };
  
  https.createServer(httpsOptions, app).listen(PORT, () => {
    console.log(`Server running on https://localhost:${PORT}`);
    console.log('✓ Using HTTPS with self-signed certificate');
  });
} else {
  // Fallback to HTTP if certificates don't exist
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('⚠ Running HTTP - Generate HTTPS certificates for OAuth to work');
    console.log('Run: npm run generate-cert');
  });
}
