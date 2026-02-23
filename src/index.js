export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Route handling
    if (path === '/api/upload' && request.method === 'POST') {
      return handleUpload(request, env, corsHeaders);
    }

    if (path === '/api/download' && request.method === 'GET') {
      return handleDownload(request, env, corsHeaders);
    }

    if (path === '/api/status' && request.method === 'GET') {
      return handleStatus(request, env, corsHeaders);
    }

    // Serve static files
    return handleStatic(request, env, path, corsHeaders);
  },
};

async function handleUpload(request, env, corsHeaders) {
  try {
    const formData = await request.formData();
    const file = formData.get('zipfile');

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate file type
    const isZip = file.type === 'application/zip' || 
                  file.type === 'application/x-zip-compressed' ||
                  file.name.toLowerCase().endsWith('.zip');

    if (!isZip) {
      return new Response(JSON.stringify({ error: 'Only ZIP files are allowed' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check file size
    if (file.size > env.MAX_FILE_SIZE) {
      return new Response(JSON.stringify({ error: 'File exceeds 1GB limit' }), {
        status: 413,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Upload to R2
    await env.BUCKET.put('current.zip', file.stream());

    // Save metadata to KV
    const metadata = {
      hasFile: true,
      originalName: file.name,
      size: file.size,
      uploadedAt: new Date().toISOString(),
    };
    await env.METADATA.put('current', JSON.stringify(metadata));

    return new Response(JSON.stringify({ success: true, ...metadata }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function handleDownload(request, env, corsHeaders) {
  try {
    const metadataStr = await env.METADATA.get('current');
    
    if (!metadataStr) {
      return new Response(JSON.stringify({ error: 'No file available' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const metadata = JSON.parse(metadataStr);
    const object = await env.BUCKET.get('current.zip');

    if (!object) {
      return new Response(JSON.stringify({ error: 'File not found on server' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(object.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${metadata.originalName}"`,
        'Content-Length': metadata.size.toString(),
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function handleStatus(request, env, corsHeaders) {
  try {
    const metadataStr = await env.METADATA.get('current');
    const metadata = metadataStr ? JSON.parse(metadataStr) : { hasFile: false };

    return new Response(JSON.stringify(metadata), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function handleStatic(request, env, path, corsHeaders) {
  // Map paths to static files
  const staticFiles = {
    '/': 'index.html',
    '/index.html': 'index.html',
    '/styles.css': 'styles.css',
    '/app.js': 'app.js',
  };

  const file = staticFiles[path];
  if (!file) {
    return new Response('Not Found', { status: 404 });
  }

  const object = await env.BUCKET.get(`static/${file}`);
  if (!object) {
    return new Response('Not Found', { status: 404 });
  }

  const contentTypes = {
    'html': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
  };

  const ext = file.split('.').pop();
  return new Response(object.body, {
    headers: {
      ...corsHeaders,
      'Content-Type': contentTypes[ext] || 'text/plain',
    },
  });
}
