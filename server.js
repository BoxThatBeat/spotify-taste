// Load environment variables first (before other imports)
require('dotenv').config();

const express = require('express');
const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
