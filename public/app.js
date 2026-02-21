/**
 * Render results with visual grids
 */
function renderResults(data) {
  const { sharedArtists, sharedTracks, matchPercentage, breakdown, counts } = data;
  
  // Hide comparison section, show results section
  document.getElementById('comparison-section').style.display = 'none';
  document.getElementById('results-section').style.display = 'block';
  
  // Populate match percentage hero
  const overallMatch = document.getElementById('overall-match');
  overallMatch.textContent = `${matchPercentage}% Match`;
  overallMatch.style.fontSize = '48px';
  overallMatch.style.fontWeight = 'bold';
  overallMatch.style.margin = '20px 0';
  
  // Determine color based on match level
  if (matchPercentage >= 70) {
    overallMatch.style.color = '#1DB954'; // High match - celebratory
  } else if (matchPercentage >= 40) {
    overallMatch.style.color = '#333'; // Medium match - neutral
  } else {
    overallMatch.style.color = '#666'; // Low match - encouraging tone
  }
  
  // Populate breakdown
  const breakdownEl = document.getElementById('breakdown');
  breakdownEl.innerHTML = `
    <div style="font-size: 16px; color: #666; margin-bottom: 30px;">
      Artists: ${breakdown.artistsMatch}% • Tracks: ${breakdown.tracksMatch}%
    </div>
  `;
  
  // Render grids
  renderArtistsGrid(sharedArtists);
  renderTracksGrid(sharedTracks);
}

/**
 * Render artists grid
 */
function renderArtistsGrid(artists) {
  const grid = document.getElementById('artists-grid');
  const empty = document.getElementById('artists-empty');
  
  grid.innerHTML = '';
  
  if (artists.length === 0) {
    grid.style.display = 'none';
    empty.style.display = 'block';
    return;
  }
  
  grid.style.display = 'grid';
  empty.style.display = 'none';
  
  artists.forEach(artist => {
    const item = document.createElement('div');
    item.className = 'grid-item';
    
    // Use medium size image (index 1) if available, fallback to first or placeholder
    const imageUrl = artist.images && artist.images.length > 0
      ? (artist.images[1]?.url || artist.images[0]?.url)
      : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect width="300" height="300" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="20" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E';
    
    item.innerHTML = `
      <img src="${imageUrl}" alt="${artist.name}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22300%22%3E%3Crect width=%22300%22 height=%22300%22 fill=%22%23ddd%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22sans-serif%22 font-size=%2220%22 fill=%22%23999%22%3ENo Image%3C/text%3E%3C/svg%3E'">
      <div class="grid-item-name">${artist.name}</div>
    `;
    
    grid.appendChild(item);
  });
}

/**
 * Render tracks grid
 */
function renderTracksGrid(tracks) {
  const grid = document.getElementById('tracks-grid');
  const empty = document.getElementById('tracks-empty');
  
  grid.innerHTML = '';
  
  if (tracks.length === 0) {
    grid.style.display = 'none';
    empty.style.display = 'block';
    return;
  }
  
  grid.style.display = 'grid';
  empty.style.display = 'none';
  
  tracks.forEach(track => {
    const item = document.createElement('div');
    item.className = 'grid-item';
    
    // Use medium size album cover (index 1) if available, fallback to first or placeholder
    const imageUrl = track.album?.images && track.album.images.length > 0
      ? (track.album.images[1]?.url || track.album.images[0]?.url)
      : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect width="300" height="300" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="20" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E';
    
    const artistName = track.artists && track.artists.length > 0 ? track.artists[0].name : 'Unknown Artist';
    
    item.innerHTML = `
      <img src="${imageUrl}" alt="${track.name}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22300%22%3E%3Crect width=%22300%22 height=%22300%22 fill=%22%23ddd%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22sans-serif%22 font-size=%2220%22 fill=%22%23999%22%3ENo Image%3C/text%3E%3C/svg%3E'">
      <div class="grid-item-name">${track.name}</div>
      <div class="grid-item-subtitle">${artistName}</div>
    `;
    
    grid.appendChild(item);
  });
}

// Compare button click handler
document.getElementById('compareBtn').addEventListener('click', async () => {
  const timeRange = document.getElementById('timeRange').value;
  
  // Hide error if showing from previous attempt
  document.getElementById('error').style.display = 'none';
  
  // Show loading spinner
  document.getElementById('loading').style.display = 'block';
  document.getElementById('compareBtn').disabled = true;
  
  try {
    const response = await fetch('/api/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timeRange: timeRange })
    });
    
    if (!response.ok) {
      // Show technical error details
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    
    // Hide loading
    document.getElementById('loading').style.display = 'none';
    document.getElementById('compareBtn').disabled = false;
    
    // Render visual results (replaces Phase 3 alert)
    renderResults(data);
    
  } catch (error) {
    // Hide loading
    document.getElementById('loading').style.display = 'none';
    document.getElementById('compareBtn').disabled = false;
    
    // Show error with technical details
    document.getElementById('error').style.display = 'block';
    document.getElementById('errorDetails').textContent = error.message + '\n\n' + (error.stack || '');
  }
});

// Retry button handler
document.getElementById('retryBtn').addEventListener('click', () => {
  // Hide error and re-trigger compare
  document.getElementById('error').style.display = 'none';
  document.getElementById('compareBtn').click();
});

// Back button handler (return to comparison section)
document.getElementById('backBtn').addEventListener('click', () => {
  document.getElementById('results-section').style.display = 'none';
  document.getElementById('comparison-section').style.display = 'block';
});
