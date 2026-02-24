const fs = require('fs');
const path = require('path');

console.log('📦 Building for Cloudflare Pages...\n');

// Create dist directory
const distDir = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Copy public files to dist
const publicDir = path.join(__dirname, '..', 'public');
const files = ['index.html', 'styles.css', 'app.js'];

files.forEach(file => {
  const src = path.join(publicDir, file);
  const dest = path.join(distDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`✓ Copied ${file}`);
  }
});

// Copy _routes.json to dist
const routesSrc = path.join(__dirname, '..', '_routes.json');
const routesDest = path.join(distDir, '_routes.json');
if (fs.existsSync(routesSrc)) {
  fs.copyFileSync(routesSrc, routesDest);
  console.log('✓ Copied _routes.json');
}

console.log('\n✅ Build complete! Output in dist/');
