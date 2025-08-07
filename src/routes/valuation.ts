import { Router } from 'itty-router';
import { z } from 'zod';
import { Env } from '../worker';
import { authenticate, requireRole } from '../middleware/auth';
import { addCorsHeaders } from '../middleware/cors';
import { databaseErrorHandler } from '../middleware/error-handler';

// Validation schemas
const ValuationSchema = z.object({
  value: z.number().positive(),
  currency: z.string().length(3),
  method: z.enum(['APPRAISAL', 'MARKET', 'AI_ESTIMATED']),
  confidence: z.number().min(0).max(1),
  notes: z.string().optional(),
});

// Route handlers
export function valuationRoutes(router: Router, env: Env) {
  // Add valuation
  router.post('/api/v1/assets/:id/valuations', authenticate, requireRole(['VALUER', 'ADMIN']), async (request: Request) => {
    try {
      const url = new URL(request.url);
      const id = url.pathname.split('/').pop();
      const body = await request.json();

      if (!id) {
        return new Response(JSON.stringify({ error: 'Asset ID required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const validation = ValuationSchema.safeParse(body);
      if (!validation.success) {
        return new Response(JSON.stringify({ 
          error: 'Validation failed', 
          details: validation.error.errors 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const user = (request as any).user;
      
      // Save valuation
      await env.DB.prepare(`
        INSERT INTO valuations (id, asset_id, value, currency, method, confidence, notes, valuer_id, valuation_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(),
        id,
        validation.data.value,
        validation.data.currency,
        validation.data.method,
        validation.data.confidence,
        validation.data.notes || null,
        user.id,
        new Date().toISOString()
      ).run();

      return addCorsHeaders(new Response(JSON.stringify({ 
        message: 'Valuation added successfully' 
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }));

    } catch (error) {
      return databaseErrorHandler(error, request);
    }
  });

  // List valuations
  router.get('/api/v1/assets/:id/valuations', authenticate, async (request: Request) => {
    try {
      const url = new URL(request.url);
      const id = url.pathname.split('/').pop();

      if (!id) {
        return new Response(JSON.stringify({ error: 'Asset ID required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const valuations = await env.DB.prepare(`
        SELECT * FROM valuations WHERE asset_id = ? ORDER BY valuation_date DESC
      `).bind(id).all();

      return addCorsHeaders(new Response(JSON.stringify(valuations.results), {
        headers: { 'Content-Type': 'application/json' },
      }));

    } catch (error) {
      return databaseErrorHandler(error, request);
    }
  });
}
