const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const METADATA_FILE = path.join(UPLOAD_DIR, 'metadata.json');
const MAX_FILE_SIZE = 1 * 1024 * 1024 * 1024; // 1GB

// Ensure uploads directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Helper functions
function getMetadata() {
  if (fs.existsSync(METADATA_FILE)) {
    return JSON.parse(fs.readFileSync(METADATA_FILE, 'utf8'));
  }
  return { hasFile: false };
}

function saveMetadata(data) {
  fs.writeFileSync(METADATA_FILE, JSON.stringify(data, null, 2));
}

function deleteExistingFile() {
  const filePath = path.join(UPLOAD_DIR, 'current.zip');
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}


// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, 'current.zip');
  }
});

const fileFilter = (req, file, cb) => {
  const isZip = file.mimetype === 'application/zip' ||
                file.mimetype === 'application/x-zip-compressed' ||
                file.mimetype === 'application/x-zip' ||
                path.extname(file.originalname).toLowerCase() === '.zip';
  
  if (isZip) {
    cb(null, true);
  } else {
    req.fileValidationError = 'Only ZIP files are allowed';
    cb(null, false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: fileFilter
});

// Upload endpoint
app.post('/api/upload', (req, res) => {
  deleteExistingFile();
  
  upload.single('zipfile')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'File exceeds 1GB limit' });
      }
      return res.status(400).json({ error: err.message });
    }
    
    if (req.fileValidationError) {
      return res.status(400).json({ error: req.fileValidationError });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }
    
    const metadata = {
      hasFile: true,
      originalName: req.file.originalname,
      size: req.file.size,
      uploadedAt: new Date().toISOString()
    };
    saveMetadata(metadata);
    
    res.json({ success: true, ...metadata });
  });
});

// Download endpoint
app.get('/api/download', (req, res) => {
  const metadata = getMetadata();
  
  if (!metadata.hasFile) {
    return res.status(404).json({ error: 'No file available' });
  }
  
  const filePath = path.join(UPLOAD_DIR, 'current.zip');
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'No file available' });
  }
  
  res.download(filePath, metadata.originalName);
});

// Status endpoint
app.get('/api/status', (req, res) => {
  const metadata = getMetadata();
  res.json(metadata);
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
