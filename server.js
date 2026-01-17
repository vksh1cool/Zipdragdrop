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
app.use(express.json({ limit: '1gb' }));
app.use(express.urlencoded({ limit: '1gb', extended: true }));
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


// Multer configuration - use temp filename during upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, 'temp_upload.zip');
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
  const tempPath = path.join(UPLOAD_DIR, 'temp_upload.zip');
  
  upload.single('zipfile')(req, res, (err) => {
    // Clean up temp file on error
    const cleanupTemp = () => {
      try {
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
          console.log('Cleaned up temp file');
        }
      } catch (e) {
        console.error('Error cleaning temp file:', e);
      }
    };
    
    if (err) {
      console.error('Upload error:', err);
      cleanupTemp();
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'File exceeds 1GB limit' });
      }
      return res.status(400).json({ error: err.message });
    }
    
    if (req.fileValidationError) {
      console.error('File validation error:', req.fileValidationError);
      cleanupTemp();
      return res.status(400).json({ error: req.fileValidationError });
    }
    
    if (!req.file) {
      console.error('No file in request');
      cleanupTemp();
      return res.status(400).json({ error: 'No file provided' });
    }
    
    try {
      // Upload complete - now safely replace the old file
      const finalPath = path.join(UPLOAD_DIR, 'current.zip');
      
      console.log('Upload received:', req.file.originalname, req.file.size, 'bytes');
      console.log('Temp path:', tempPath);
      console.log('Final path:', finalPath);
      
      // Verify temp file exists and has correct size
      if (!fs.existsSync(tempPath)) {
        console.error('Temp file does not exist!');
        return res.status(500).json({ error: 'Upload incomplete - temp file missing' });
      }
      
      const tempStats = fs.statSync(tempPath);
      console.log('Temp file size on disk:', tempStats.size);
      
      if (tempStats.size !== req.file.size) {
        console.error('Size mismatch! Expected:', req.file.size, 'Got:', tempStats.size);
        cleanupTemp();
        return res.status(500).json({ error: 'Upload incomplete - file size mismatch' });
      }
      
      // Delete old file if exists
      if (fs.existsSync(finalPath)) {
        console.log('Deleting old file');
        fs.unlinkSync(finalPath);
      }
      
      // Rename temp to final
      console.log('Renaming temp to final');
      fs.renameSync(tempPath, finalPath);
      
      const metadata = {
        hasFile: true,
        originalName: req.file.originalname,
        size: req.file.size,
        uploadedAt: new Date().toISOString()
      };
      saveMetadata(metadata);
      
      console.log('Upload successful!');
      res.json({ success: true, ...metadata });
    } catch (error) {
      console.error('Error processing upload:', error);
      cleanupTemp();
      res.status(500).json({ error: 'Failed to process upload: ' + error.message });
    }
  });
});

// Download endpoint
app.get('/api/download', (req, res) => {
  const metadata = getMetadata();
  
  if (!metadata.hasFile) {
    console.error('Download failed: No file in metadata');
    return res.status(404).json({ error: 'No file available' });
  }
  
  const filePath = path.join(UPLOAD_DIR, 'current.zip');
  if (!fs.existsSync(filePath)) {
    console.error('Download failed: File does not exist at', filePath);
    return res.status(404).json({ error: 'File not found on server' });
  }
  
  const stats = fs.statSync(filePath);
  console.log('Download requested:', metadata.originalName, 'Size:', stats.size);
  
  res.download(filePath, metadata.originalName, (err) => {
    if (err) {
      console.error('Download error:', err);
    } else {
      console.log('Download completed successfully');
    }
  });
});

// Status endpoint
app.get('/api/status', (req, res) => {
  const metadata = getMetadata();
  res.json(metadata);
});

// Start server
if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
  
  // Increase timeout for large file uploads (5 minutes)
  server.timeout = 300000;
  server.keepAliveTimeout = 300000;
  server.headersTimeout = 310000;
}

module.exports = app;
