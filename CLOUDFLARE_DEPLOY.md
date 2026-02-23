# Cloudflare Deployment Guide

This project is configured for deployment to Cloudflare Pages with Workers, R2 storage, and KV.

## Deployment Options

You can deploy via:
1. **Cloudflare Pages Dashboard** (recommended - easiest)
2. **Wrangler CLI** (for advanced users)

## Prerequisites

- Node.js 16+ installed
- A Cloudflare account (free tier works)
- Wrangler CLI (installed via npm)

## Option 1: Deploy via Cloudflare Pages Dashboard

### 1. Push to GitHub

Commit and push all changes to your GitHub repository.

### 2. Create Cloudflare Pages Project

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Workers & Pages** → **Create application** → **Pages**
3. Connect your GitHub repository
4. Configure build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (leave empty)

### 3. Add Environment Bindings

After initial deployment, go to **Settings** → **Functions**:

**R2 Bucket Binding:**
- Variable name: `BUCKET`
- R2 bucket: Create new bucket named `zip-drop-files`

**KV Namespace Binding:**
- Variable name: `METADATA`
- KV namespace: Create new namespace named `zip-drop-metadata`

**Environment Variables:**
- `MAX_FILE_SIZE` = `1073741824`

### 4. Redeploy

Click **Retry deployment** to apply the bindings.

Your app will be live at `https://your-project.pages.dev`

---

## Option 2: Deploy via Wrangler CLI

### 1. Install Dependencies

```bash
npm install
```

### 2. Login to Cloudflare

```bash
npx wrangler login
```

This opens your browser to authenticate with Cloudflare.

### 3. Create R2 Bucket

```bash
npx wrangler r2 bucket create zip-drop-files
```

### 4. Create KV Namespace

```bash
npx wrangler kv:namespace create METADATA
```

Copy the namespace ID from the output and update `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "METADATA"
id = "your_kv_namespace_id_here"  # Replace with actual ID
```

### 5. Upload Static Files to R2

```bash
npx wrangler r2 object put zip-drop-files/static/index.html --file=public/index.html
npx wrangler r2 object put zip-drop-files/static/styles.css --file=public/styles.css
npx wrangler r2 object put zip-drop-files/static/app.js --file=public/app.js
```

### 6. Deploy

```bash
npm run deploy
```

Your app will be live at `https://zip-drop.<your-subdomain>.workers.dev`

## Local Development

Test locally with Wrangler:

```bash
npm run dev:worker
```

Note: Local dev requires manual setup of R2 and KV bindings.

## Architecture

- **Cloudflare Workers**: Serverless functions handling API requests
- **R2 Storage**: Object storage for ZIP files and static assets
- **KV Storage**: Key-value store for file metadata

## Costs

- Workers: 100,000 requests/day free
- R2: 10GB storage free, no egress fees
- KV: 100,000 reads/day free

Perfect for personal use!

## Differences from Railway Version

- No file system access (uses R2 instead)
- Serverless (no persistent server)
- Global edge network (faster worldwide)
- Different pricing model (pay per request vs. always-on)

## Troubleshooting

**"Namespace not found"**: Update the KV namespace ID in `wrangler.toml`

**"Bucket not found"**: Ensure R2 bucket name matches in `wrangler.toml`

**Static files not loading**: Re-upload static files to R2 with correct paths
