const fs = require('fs');
const path = require('path');

console.log('📦 Setting up Cloudflare deployment...\n');

console.log('Steps to complete:');
console.log('1. Install Wrangler CLI: npm install');
console.log('2. Login to Cloudflare: npx wrangler login');
console.log('3. Create R2 bucket: npx wrangler r2 bucket create zip-drop-files');
console.log('4. Create KV namespace: npx wrangler kv:namespace create METADATA');
console.log('5. Update wrangler.toml with your KV namespace ID');
console.log('6. Upload static files to R2:');
console.log('   npx wrangler r2 object put zip-drop-files/static/index.html --file=public/index.html');
console.log('   npx wrangler r2 object put zip-drop-files/static/styles.css --file=public/styles.css');
console.log('   npx wrangler r2 object put zip-drop-files/static/app.js --file=public/app.js');
console.log('7. Deploy: npm run deploy\n');

console.log('✅ Setup guide complete!');
