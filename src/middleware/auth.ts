import { Env } from '../worker';

// JWT verification for Workers
async function verifyJWT(token: string, secret: string): Promise<any> {
  try {
    // Use Web Crypto API for JWT verification
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    // Simple JWT verification (for production, use a proper JWT library)
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const header = JSON.parse(atob(parts[0]));
    const payload = JSON.parse(atob(parts[1]));
    const signature = parts[2];

    // Verify signature
    const data = encoder.encode(parts[0] + '.' + parts[1]);
    const signatureBuffer = Uint8Array.from(atob(signature), c => c.charCodeAt(0));
    
    const isValid = await crypto.subtle.verify('HMAC', key, signatureBuffer, data);
    
    if (!isValid) {
      throw new Error('Invalid JWT signature');
    }

    // Check expiration
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      throw new Error('JWT expired');
    }

    return payload;
  } catch (error) {
    throw new Error('JWT verification failed');
  }
}

// API key verification
async function verifyAPIKey(apiKey: string, env: Env): Promise<boolean> {
  return apiKey === env.API_KEY;
}

// Authentication middleware
export async function authenticate(request: Request, env: Env): Promise<Response | void> {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization header required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check for Bearer token (JWT)
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = await verifyJWT(token, env.JWT_SECRET);
      
      // Attach user to request
      (request as any).user = payload;
      return;
    }

    // Check for API key
    if (authHeader.startsWith('ApiKey ')) {
      const apiKey = authHeader.substring(7);
      const isValid = await verifyAPIKey(apiKey, env);
      
      if (!isValid) {
        return new Response(JSON.stringify({ error: 'Invalid API key' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Attach API key info to request
      (request as any).apiKey = true;
      return;
    }

    return new Response(JSON.stringify({ error: 'Invalid authorization format' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Authentication failed' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Role-based access control
export function requireRole(roles: string[]) {
  return async (request: Request, env: Env): Promise<Response | void> => {
    const user = (request as any).user;
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!user.roles || !user.roles.some((role: string) => roles.includes(role))) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return;
  };
}

// Rate limiting middleware
export async function rateLimit(request: Request, env: Env, limit: number = 100, window: number = 3600): Promise<Response | void> {
  const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
  const key = `rate_limit:${clientIP}`;
  
  try {
    const current = await env.CACHE.get(key);
    const count = current ? parseInt(current) : 0;
    
    if (count >= limit) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    await env.CACHE.put(key, (count + 1).toString(), { expirationTtl: window });
    return;
  } catch (error) {
    // If rate limiting fails, allow the request
    return;
  }
}
