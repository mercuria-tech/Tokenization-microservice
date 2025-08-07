import { Router } from 'itty-router';
import { z } from 'zod';
import { authenticate } from './middleware/auth';
import { errorHandler } from './middleware/error-handler';
import { corsHandler } from './middleware/cors';

// Import route handlers
import { assetRoutes } from './routes/assets';
import { documentRoutes } from './routes/documents';
import { verificationRoutes } from './routes/verification';
import { valuationRoutes } from './routes/valuation';
import { tokenRoutes } from './routes/tokens';
import { tokenActionsRoutes } from './routes/tokenActions';
import { tokenHoldersRoutes } from './routes/tokenHolders';
import { ordersRoutes } from './routes/orders';
import { matchingEngineRoutes } from './routes/matchingEngine';
import { settlementRoutes } from './routes/settlement';
import { txMonitorRoutes } from './routes/txMonitor';
import { settlementReportRoutes } from './routes/settlementReport';
import { kycRoutes } from './routes/kyc';
import { regulatoryReportRoutes } from './routes/regulatoryReport';
import { auditTrailRoutes } from './routes/auditTrail';
import { riskRoutes } from './routes/risk';
import { analyticsRoutes } from './routes/analytics';
import { eventsRoutes } from './routes/events';

// Environment interface
export interface Env {
  R2: R2Bucket;
  DB: D1Database;
  CACHE: KVNamespace;
  JWT_SECRET: string;
  API_KEY: string;
  DATABASE_URL?: string;
  NODE_ENV: string;
  API_VERSION: string;
}

// Create router
const router = Router();

// Middleware
router.all('*', corsHandler);

// Health check
router.get('/health', () => {
  return new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), {
    headers: { 'Content-Type': 'application/json' },
  });
});

// API documentation
router.get('/docs', () => {
  return new Response(JSON.stringify({
    title: 'Asset Tokenization Microservice API',
    version: '1.0.0',
    description: 'API-first microservice for asset tokenization',
    endpoints: {
      assets: '/api/v1/assets',
      tokens: '/api/v1/tokens',
      orders: '/api/v1/orders',
      compliance: '/api/v1/compliance',
      analytics: '/api/v1/analytics',
      events: '/api/v1/events'
    }
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
});

// API routes
router.all('/api/v1/*', async (request: Request, env: Env, ctx: ExecutionContext) => {
  const apiRouter = Router();
  
  // Register all route modules
  assetRoutes(apiRouter, env);
  documentRoutes(apiRouter, env);
  verificationRoutes(apiRouter, env);
  valuationRoutes(apiRouter, env);
  tokenRoutes(apiRouter, env);
  tokenActionsRoutes(apiRouter, env);
  tokenHoldersRoutes(apiRouter, env);
  ordersRoutes(apiRouter, env);
  matchingEngineRoutes(apiRouter, env);
  settlementRoutes(apiRouter, env);
  txMonitorRoutes(apiRouter, env);
  settlementReportRoutes(apiRouter, env);
  kycRoutes(apiRouter, env);
  regulatoryReportRoutes(apiRouter, env);
  auditTrailRoutes(apiRouter, env);
  riskRoutes(apiRouter, env);
  analyticsRoutes(apiRouter, env);
  eventsRoutes(apiRouter, env);

  // Handle API routes
  const response = await apiRouter.handle(request, env, ctx);
  if (response) return response;

  // 404 for API routes
  return new Response(JSON.stringify({ error: 'API endpoint not found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  });
});

// Protected route example
router.get('/api/v1/protected', authenticate, async (request: Request, env: Env) => {
  const user = (request as any).user;
  return new Response(JSON.stringify({ user }), {
    headers: { 'Content-Type': 'application/json' },
  });
});

// Main worker handler
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      // Handle the request
      const response = await router.handle(request, env, ctx);
      
      if (response) {
        return response;
      }

      // 404 for unmatched routes
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });

    } catch (error) {
      // Handle errors
      return errorHandler(error, request, env);
    }
  },
};
