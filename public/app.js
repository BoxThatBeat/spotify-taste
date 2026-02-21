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
    const { sharedArtists, sharedTracks, matchPercentage, breakdown, counts } = data;
    
    // Hide loading
    document.getElementById('loading').style.display = 'none';
    document.getElementById('compareBtn').disabled = false;
    
    // Build results message
    const resultsMessage = `
🎵 Match Score: ${matchPercentage}%

Artists Match: ${breakdown.artistsMatch}% (${counts.sharedArtists} shared out of ${counts.totalUniqueArtists} unique)
Tracks Match: ${breakdown.tracksMatch}% (${counts.sharedTracks} shared out of ${counts.totalUniqueTracks} unique)

Shared Artists: ${sharedArtists.map(a => a.name).join(', ')}
Shared Tracks: ${sharedTracks.map(t => `${t.name} - ${t.artists[0].name}`).join(', ')}
`;
    
    // Display results (Phase 4 will replace alert with visual grid)
    alert(resultsMessage);
    
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
