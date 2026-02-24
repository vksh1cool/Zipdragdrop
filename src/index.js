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

    // API routes - return error for now since R2/KV not configured
    if (path.startsWith('/api/')) {
      return new Response(
        JSON.stringify({ 
          error: 'API not configured yet. Please set up R2 bucket and KV namespace bindings in Cloudflare Pages settings.' 
        }), 
        {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // For all other requests, let Pages serve static assets
    return env.ASSETS.fetch(request);
  },
};
