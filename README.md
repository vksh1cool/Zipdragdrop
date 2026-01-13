# ZIP Drop

A minimalist web app for uploading and sharing a single ZIP file from anywhere.

![ZIP Drop](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen) ![License](https://img.shields.io/badge/license-MIT-blue)

## Features

- 📦 Upload ZIP files up to 1GB
- 🌍 Access your file from anywhere
- 🔄 New uploads replace the existing file
- 🎨 Clean, minimalist drag-and-drop interface
- 📱 Responsive design for mobile and desktop

## Quick Start

```bash
# Install dependencies
npm install

# Start the server
npm start
```

Open http://localhost:3000 in your browser.

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/upload` | POST | Upload a ZIP file |
| `/api/download` | GET | Download the stored file |
| `/api/status` | GET | Get current file info |

## Deployment (Railway)

1. Push code to GitHub
2. Go to [railway.app](https://railway.app) and sign in with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Railway auto-detects Node.js and deploys!

Your app will be live at `https://your-app.up.railway.app`

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port (Railway sets this automatically) |

## Tech Stack

- Node.js + Express
- Multer (file uploads)
- Vanilla HTML/CSS/JS

## License

MIT
