/**
 * Shuper API Proxy Worker
 * 
 * Deploy this as a Cloudflare Worker, Vercel Edge Function, or any serverless platform.
 * It proxies API requests to external services to avoid CORS issues.
 * 
 * Route pattern: /api/{service}/* → forwards to actual API endpoint
 * 
 * Deployment options:
 * 1. Cloudflare Workers: `npx wrangler deploy proxy/worker.js`
 * 2. As middleware on your existing server
 * 3. As a Vercel/Netlify edge function (adapt as needed)
 */

// Map of service names to their actual API base URLs
const SERVICE_MAP = {
    tavily: 'https://api.tavily.com',
    scira: 'https://api.scira.ai',
    exa: 'https://api.exa.ai',
    openrouter: 'https://openrouter.ai',
    routeway: 'https://api.routeway.ai',
};

// Allowed origin for CORS (your production domain)
const ALLOWED_ORIGIN = 'https://shuperapp.nafen.sbs';

/**
 * Handles incoming requests and proxies them to the appropriate service.
 */
async function handleRequest(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Only handle /api/* routes
    if (!path.startsWith('/api/')) {
        return new Response('Not Found', { status: 404 });
    }

    // Parse: /api/{service}/{rest-of-path}
    const segments = path.replace('/api/', '').split('/');
    const service = segments[0];
    const restPath = '/' + segments.slice(1).join('/');

    // Check if this is a known service
    const targetBase = SERVICE_MAP[service];
    if (!targetBase) {
        return corsResponse(
            new Response(JSON.stringify({ error: `Unknown service: ${service}` }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            }),
            request
        );
    }

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: getCorsHeaders(request),
        });
    }

    // Build the target URL
    const targetUrl = targetBase + restPath + url.search;

    // Clone the request headers, removing host-related ones
    const headers = new Headers(request.headers);
    headers.delete('host');
    headers.delete('origin');
    headers.delete('referer');
    // Set the referer to your production domain for APIs that check it
    headers.set('HTTP-Referer', ALLOWED_ORIGIN);
    headers.set('X-Title', 'Shuper Workspace');

    try {
        // Forward the request to the actual API
        const response = await fetch(targetUrl, {
            method: request.method,
            headers: headers,
            body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
        });

        // Create a new response with CORS headers
        const newResponse = new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
        });

        // Add CORS headers to the response
        return corsResponse(newResponse, request);
    } catch (error) {
        return corsResponse(
            new Response(JSON.stringify({ error: `Proxy error: ${error.message}` }), {
                status: 502,
                headers: { 'Content-Type': 'application/json' },
            }),
            request
        );
    }
}

/**
 * Returns CORS headers, allowing only the Shuper production domain.
 */
function getCorsHeaders(request) {
    const origin = request.headers.get('Origin') || '';

    // Allow your production domain and localhost for testing
    const isAllowed =
        origin === ALLOWED_ORIGIN ||
        origin.startsWith('http://localhost') ||
        origin.startsWith('http://127.0.0.1');

    return {
        'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGIN,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key, HTTP-Referer, X-Title',
        'Access-Control-Max-Age': '86400',
    };
}

/**
 * Wraps a response with CORS headers.
 */
function corsResponse(response, request) {
    const corsHeaders = getCorsHeaders(request);
    const newHeaders = new Headers(response.headers);

    for (const [key, value] of Object.entries(corsHeaders)) {
        newHeaders.set(key, value);
    }

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
    });
}

// Cloudflare Workers entry point
export default {
    fetch: handleRequest,
};

// Also works as a standard addEventListener for older Workers format
if (typeof addEventListener !== 'undefined') {
    addEventListener('fetch', (event) => {
        event.respondWith(handleRequest(event.request));
    });
}
