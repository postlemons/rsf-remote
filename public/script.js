document.getElementById('dataForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
  
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('progress').classList.remove('hidden');
    document.getElementById('result').classList.add('hidden');
  
    const response = await fetch('/process', {
      method: 'POST',
      body: formData,
    });
  
    const result = await response.json();
    console.log(result);
    document.getElementById('loading').classList.add('hidden');
  
    if (result.success) {
      document.getElementById('message').textContent = 'Processing successful!';
      document.getElementById('downloadLink').href = result.fileUrl;
      document.getElementById('result').classList.remove('hidden');
    } else {
      document.getElementById('message').textContent = `Processing failed: ${result.error}`;
      document.getElementById('result').classList.remove('hidden');
    }
  
    // Update progress
    document.getElementById('currentTask').textContent = result.currentTask;
    const sheetStatus = document.getElementById('sheetStatus');
    sheetStatus.innerHTML = '';
    result.sheetStatus.forEach(status => {
      const li = document.createElement('li');
      li.textContent = status.message;
      li.classList.add(status.accepted ? 'accepted' : 'rejected');
      sheetStatus.appendChild(li);
    });
  });
  
  // Dark mode toggle
  const toggleDarkMode = () => {
    document.body.classList.toggle('dark-mode');
  };
  
  // Check for saved user preference, if any, on load of the website
  if (localStorage.getItem('dark-mode') === 'enabled') {
    document.body.classList.add('dark-mode');
  }
  
  // Listen for a click on the button
  document.getElementById('dark-mode-toggle').addEventListener('click', () => {
    toggleDarkMode();
  
    // Save the user's preference in localStorage
    if (document.body.classList.contains('dark-mode')) {
      localStorage.setItem('dark-mode', 'enabled');
    } else {
      localStorage.setItem('dark-mode', 'disabled');
    }
  });