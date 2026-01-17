const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const progressContainer = document.getElementById('progress-container');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const messageEl = document.getElementById('message');
const statusEl = document.getElementById('status');
const fileNameEl = document.getElementById('file-name');
const fileSizeEl = document.getElementById('file-size');
const downloadBtn = document.getElementById('download-btn');

const MAX_SIZE = 1024 * 1024 * 1024; // 1GB

// Initialize
document.addEventListener('DOMContentLoaded', fetchStatus);

// Drag and drop handlers
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
});

// File input handler
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) handleFile(file);
  fileInput.value = '';
});

// Download button
downloadBtn.addEventListener('click', () => {
  window.location.href = '/api/download';
});


// File validation
function validateFile(file) {
  if (!file.name.toLowerCase().endsWith('.zip')) {
    return { valid: false, error: 'Only ZIP files are allowed' };
  }
  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'File size exceeds 1GB limit' };
  }
  return { valid: true };
}

// Handle file selection
function handleFile(file) {
  const validation = validateFile(file);
  if (!validation.valid) {
    showMessage(validation.error, 'error');
    return;
  }
  uploadFile(file);
}

// Upload file with progress
function uploadFile(file) {
  const formData = new FormData();
  formData.append('zipfile', file);
  
  const xhr = new XMLHttpRequest();
  
  xhr.upload.addEventListener('progress', (e) => {
    if (e.lengthComputable) {
      const percent = Math.round((e.loaded / e.total) * 100);
      updateProgress(percent);
    }
  });
  
  xhr.addEventListener('load', () => {
    hideProgress();
    if (xhr.status === 200) {
      showMessage('Upload successful!', 'success');
      fetchStatus(); // Only refresh status on success
    } else {
      let errorMsg = 'Upload failed';
      try {
        const response = JSON.parse(xhr.responseText);
        errorMsg = response.error || errorMsg;
      } catch (e) {
        errorMsg = `Upload failed (${xhr.status}): ${xhr.statusText}`;
      }
      console.error('Upload error:', xhr.status, xhr.responseText);
      showMessage(errorMsg, 'error');
      // Don't call fetchStatus() here - keep showing old file if upload fails
    }
  });
  
  xhr.addEventListener('error', () => {
    hideProgress();
    showMessage('Upload failed. Please try again.', 'error');
  });
  
  showProgress();
  xhr.open('POST', '/api/upload');
  xhr.send(formData);
}

// Progress UI
function showProgress() {
  progressContainer.hidden = false;
  updateProgress(0);
}

function hideProgress() {
  progressContainer.hidden = true;
}

function updateProgress(percent) {
  progressBar.style.width = percent + '%';
  progressText.textContent = percent + '%';
}

// Message UI
function showMessage(text, type) {
  messageEl.textContent = text;
  messageEl.className = type;
  messageEl.hidden = false;
  setTimeout(() => {
    messageEl.hidden = true;
  }, 4000);
}

// Fetch and display status
async function fetchStatus() {
  try {
    const response = await fetch('/api/status');
    const data = await response.json();
    
    if (data.hasFile) {
      fileNameEl.textContent = data.originalName;
      fileSizeEl.textContent = formatSize(data.size);
      statusEl.hidden = false;
    } else {
      statusEl.hidden = true;
    }
  } catch (err) {
    console.error('Failed to fetch status:', err);
  }
}

// Format file size
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}
