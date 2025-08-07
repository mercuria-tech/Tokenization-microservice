import { Router } from 'itty-router';
import { z } from 'zod';
import { Env } from '../worker';
import { authenticate, requireRole } from '../middleware/auth';
import { addCorsHeaders } from '../middleware/cors';
import { databaseErrorHandler } from '../middleware/error-handler';

// Validation schemas
const VerificationSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'PENDING_REVIEW']),
  notes: z.string().optional(),
});

// Route handlers
export function verificationRoutes(router: Router, env: Env) {
  // Initiate verification
  router.post('/api/v1/assets/:id/verify', authenticate, requireRole(['VERIFIER', 'ADMIN']), async (request: Request) => {
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

      const validation = VerificationSchema.safeParse(body);
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
      
      // Update asset verification status
      await env.DB.prepare(`
        UPDATE assets SET status = ?, verified_by = ?, verified_at = ?, updated_at = ?
        WHERE id = ?
      `).bind(
        validation.data.status,
        user.id,
        new Date().toISOString(),
        new Date().toISOString(),
        id
      ).run();

      // Create audit log
      await env.DB.prepare(`
        INSERT INTO audit_logs (id, entity_type, entity_id, action, user_id, changes, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(),
        'ASSET',
        id,
        'VERIFICATION_UPDATED',
        user.id,
        JSON.stringify(validation.data),
        new Date().toISOString()
      ).run();

      return addCorsHeaders(new Response(JSON.stringify({ 
        message: 'Asset verification updated successfully' 
      }), {
        headers: { 'Content-Type': 'application/json' },
      }));

    } catch (error) {
      return databaseErrorHandler(error, request);
    }
  });
}
