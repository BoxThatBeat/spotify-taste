// Compare button click handler
document.getElementById('compareBtn').addEventListener('click', async () => {
  const timeRange = document.getElementById('timeRange').value;
  
  // Hide error if showing from previous attempt
  document.getElementById('error').style.display = 'none';
  
  // Show loading spinner
  document.getElementById('loading').style.display = 'block';
  document.getElementById('compareBtn').disabled = true;
  
  try {
    const response = await fetch(`/api/fetch-data?timeRange=${timeRange}`);
    
    if (!response.ok) {
      // Show technical error details
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    
    // Hide loading
    document.getElementById('loading').style.display = 'none';
    document.getElementById('compareBtn').disabled = false;
    
    // TODO: Phase 3 will handle comparison, Phase 4 will display results
    // For now, log data and show success message
    console.log('Fetched data:', data);
    alert(`Success! Fetched ${data.userA.topArtists.length} artists and ${data.userA.topTracks.length} tracks for both users.`);
    
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
