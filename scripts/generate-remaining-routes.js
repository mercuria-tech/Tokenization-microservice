const fs = require('fs');
const path = require('path');

// Template for remaining route files
const routeTemplate = (routeName, endpoints) => `
import { Router } from 'itty-router';
import { z } from 'zod';
import { Env } from '../worker';
import { authenticate, requireRole } from '../middleware/auth';
import { addCorsHeaders } from '../middleware/cors';
import { databaseErrorHandler } from '../middleware/error-handler';

// Route handlers
export function ${routeName}Routes(router: Router, env: Env) {
  ${endpoints.map(endpoint => `
  // ${endpoint.description}
  router.${endpoint.method}('${endpoint.path}', authenticate${endpoint.roles ? `, requireRole([${endpoint.roles.map(r => `'${r}'`).join(', ')}])` : ''}, async (request: Request) => {
    try {
      // TODO: Implement ${endpoint.description}
      return addCorsHeaders(new Response(JSON.stringify({ 
        message: '${endpoint.description} - Implementation pending' 
      }), {
        headers: { 'Content-Type': 'application/json' },
      }));
    } catch (error) {
      return databaseErrorHandler(error, request);
    }
  });`).join('\n')}
}
`;

// Route definitions
const routes = [
  {
    name: 'tokens',
    endpoints: [
      { method: 'post', path: '/api/v1/tokens', description: 'Create token', roles: ['ADMIN'] },
      { method: 'get', path: '/api/v1/tokens', description: 'List tokens' },
      { method: 'get', path: '/api/v1/tokens/:id', description: 'Get token details' },
    ]
  },
  {
    name: 'tokenActions',
    endpoints: [
      { method: 'post', path: '/api/v1/tokens/:id/mint', description: 'Mint tokens', roles: ['ADMIN'] },
      { method: 'post', path: '/api/v1/tokens/:id/burn', description: 'Burn tokens', roles: ['ADMIN'] },
      { method: 'post', path: '/api/v1/tokens/:id/transfer', description: 'Transfer tokens' },
    ]
  },
  {
    name: 'tokenHolders',
    endpoints: [
      { method: 'get', path: '/api/v1/tokens/:id/holders', description: 'Get token holders' },
      { method: 'get', path: '/api/v1/tokens/:id/transactions', description: 'Get token transactions' },
    ]
  },
  {
    name: 'orders',
    endpoints: [
      { method: 'post', path: '/api/v1/orders', description: 'Create order' },
      { method: 'get', path: '/api/v1/orders', description: 'List orders' },
      { method: 'get', path: '/api/v1/orders/:id', description: 'Get order details' },
      { method: 'put', path: '/api/v1/orders/:id', description: 'Update order' },
      { method: 'delete', path: '/api/v1/orders/:id', description: 'Cancel order' },
    ]
  },
  {
    name: 'matchingEngine',
    endpoints: [
      { method: 'post', path: '/api/v1/matching/process', description: 'Process matching', roles: ['SYSTEM'] },
      { method: 'get', path: '/api/v1/matching/orderbook/:tokenId', description: 'Get order book' },
    ]
  },
  {
    name: 'settlement',
    endpoints: [
      { method: 'post', path: '/api/v1/settlement/process', description: 'Process settlement', roles: ['SYSTEM'] },
      { method: 'get', path: '/api/v1/settlement/status/:tradeId', description: 'Get settlement status' },
    ]
  },
  {
    name: 'txMonitor',
    endpoints: [
      { method: 'get', path: '/api/v1/transactions/:hash', description: 'Get transaction status' },
      { method: 'post', path: '/api/v1/transactions/retry', description: 'Retry failed transaction', roles: ['ADMIN'] },
    ]
  },
  {
    name: 'settlementReport',
    endpoints: [
      { method: 'get', path: '/api/v1/reports/settlement', description: 'Get settlement reports' },
      { method: 'get', path: '/api/v1/reports/settlement/:date', description: 'Get settlement report by date' },
    ]
  },
  {
    name: 'kyc',
    endpoints: [
      { method: 'post', path: '/api/v1/kyc/verify', description: 'Verify KYC' },
      { method: 'get', path: '/api/v1/kyc/status/:userId', description: 'Get KYC status' },
    ]
  },
  {
    name: 'regulatoryReport',
    endpoints: [
      { method: 'get', path: '/api/v1/reports/regulatory', description: 'Get regulatory reports' },
      { method: 'post', path: '/api/v1/reports/regulatory/generate', description: 'Generate regulatory report', roles: ['COMPLIANCE'] },
    ]
  },
  {
    name: 'auditTrail',
    endpoints: [
      { method: 'get', path: '/api/v1/audit', description: 'Get audit trail' },
      { method: 'get', path: '/api/v1/audit/:entityType/:entityId', description: 'Get audit trail for entity' },
    ]
  },
  {
    name: 'risk',
    endpoints: [
      { method: 'get', path: '/api/v1/risk/monitor', description: 'Get risk monitoring data' },
      { method: 'post', path: '/api/v1/risk/alerts', description: 'Create risk alert', roles: ['RISK_MANAGER'] },
    ]
  },
  {
    name: 'analytics',
    endpoints: [
      { method: 'get', path: '/api/v1/analytics/performance', description: 'Get performance analytics' },
      { method: 'get', path: '/api/v1/analytics/market-data', description: 'Get market data' },
      { method: 'get', path: '/api/v1/analytics/valuations', description: 'Get valuation analytics' },
      { method: 'get', path: '/api/v1/analytics/risk', description: 'Get risk analytics' },
    ]
  },
  {
    name: 'events',
    endpoints: [
      { method: 'post', path: '/api/v1/events/webhooks', description: 'Register webhook' },
      { method: 'get', path: '/api/v1/events/webhooks', description: 'List webhooks' },
      { method: 'delete', path: '/api/v1/events/webhooks/:id', description: 'Delete webhook' },
      { method: 'get', path: '/api/v1/events/stream', description: 'Event stream' },
    ]
  },
];

// Generate route files
routes.forEach(route => {
  const content = routeTemplate(route.name, route.endpoints);
  const filePath = path.join(__dirname, '..', 'src', 'routes', `${route.name}.ts`);
  
  fs.writeFileSync(filePath, content);
  console.log(`Generated: ${filePath}`);
});

console.log('All remaining route files generated successfully!');
