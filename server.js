// Load environment variables first (before other imports)
require('dotenv').config();

const express = require('express');
const session = require('express-session');
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
    secure: process.env.NODE_ENV === 'production',
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

// Mount OAuth routes
const authRoutes = require('./routes/auth');
app.use('/', authRoutes);

// Health check route
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Spotify Taste Match</title>
      </head>
      <body>
        <h1>Spotify Taste Match - Server Running</h1>
        <p>The server is up and running successfully.</p>
      </body>
    </html>
  `);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
