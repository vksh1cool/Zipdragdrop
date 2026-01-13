const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('./server');

const UPLOAD_DIR = './uploads';
const METADATA_FILE = './metadata.json';
const TEST_ZIP_PATH = path.join(__dirname, 'test-files', 'test.zip');

// Helper to create a minimal valid ZIP file
function createTestZip() {
  const testDir = path.join(__dirname, 'test-files');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  // Minimal ZIP file header (empty archive)
  const zipBuffer = Buffer.from([
    0x50, 0x4b, 0x05, 0x06, // End of central directory signature
    0x00, 0x00, 0x00, 0x00, // Disk numbers
    0x00, 0x00, 0x00, 0x00, // Entry counts
    0x00, 0x00, 0x00, 0x00, // Central directory size
    0x00, 0x00, 0x00, 0x00, // Central directory offset
    0x00, 0x00              // Comment length
  ]);
  
  fs.writeFileSync(TEST_ZIP_PATH, zipBuffer);
  return TEST_ZIP_PATH;
}

// Cleanup helper
function cleanup() {
  const currentZip = path.join(UPLOAD_DIR, 'current.zip');
  if (fs.existsSync(currentZip)) fs.unlinkSync(currentZip);
  if (fs.existsSync(METADATA_FILE)) fs.unlinkSync(METADATA_FILE);
}

beforeAll(() => {
  createTestZip();
});

beforeEach(() => {
  cleanup();
});

afterAll(() => {
  cleanup();
  const testDir = path.join(__dirname, 'test-files');
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
});


describe('POST /api/upload', () => {
  test('should accept valid ZIP file', async () => {
    const response = await request(app)
      .post('/api/upload')
      .attach('zipfile', TEST_ZIP_PATH);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.hasFile).toBe(true);
    expect(response.body.originalName).toBe('test.zip');
  });

  test('should reject non-ZIP file', async () => {
    const txtPath = path.join(__dirname, 'test-files', 'test.txt');
    fs.writeFileSync(txtPath, 'hello world');
    
    try {
      const response = await request(app)
        .post('/api/upload')
        .attach('zipfile', txtPath);
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('ZIP');
    } finally {
      if (fs.existsSync(txtPath)) fs.unlinkSync(txtPath);
    }
  });

  test('should return error when no file provided', async () => {
    const response = await request(app)
      .post('/api/upload');
    
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('No file provided');
  });
});

describe('GET /api/download', () => {
  test('should download file when exists', async () => {
    // First upload a file
    const uploadRes = await request(app)
      .post('/api/upload')
      .attach('zipfile', TEST_ZIP_PATH);
    
    expect(uploadRes.status).toBe(200);
    
    const response = await request(app)
      .get('/api/download');
    
    expect(response.status).toBe(200);
    expect(response.headers['content-disposition']).toContain('test.zip');
  });

  test('should return 404 when no file exists', async () => {
    const response = await request(app)
      .get('/api/download');
    
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('No file available');
  });
});

describe('GET /api/status', () => {
  test('should return hasFile false when no file', async () => {
    const response = await request(app)
      .get('/api/status');
    
    expect(response.status).toBe(200);
    expect(response.body.hasFile).toBe(false);
  });

  test('should return file metadata when file exists', async () => {
    const uploadRes = await request(app)
      .post('/api/upload')
      .attach('zipfile', TEST_ZIP_PATH);
    
    expect(uploadRes.status).toBe(200);
    
    const response = await request(app)
      .get('/api/status');
    
    expect(response.status).toBe(200);
    expect(response.body.hasFile).toBe(true);
    expect(response.body.originalName).toBe('test.zip');
    expect(typeof response.body.size).toBe('number');
    expect(response.body.uploadedAt).toBeDefined();
  });
});
