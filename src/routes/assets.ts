import { Router } from 'itty-router';
import { z } from 'zod';
import { Env } from '../worker';
import { authenticate, requireRole } from '../middleware/auth';
import { addCorsHeaders } from '../middleware/cors';
import { databaseErrorHandler } from '../middleware/error-handler';

// Validation schemas
const CreateAssetSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['REAL_ESTATE', 'COMMODITY', 'SECURITY', 'ART']),
  description: z.string().optional(),
  totalValue: z.number().positive(),
  currency: z.string().length(3),
  location: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const UpdateAssetSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(['REAL_ESTATE', 'COMMODITY', 'SECURITY', 'ART']).optional(),
  description: z.string().optional(),
  totalValue: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
  location: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  status: z.enum(['PENDING', 'VERIFIED', 'TOKENIZED', 'RETIRED']).optional(),
});

// Database operations for Workers
async function createAsset(data: any, env: Env) {
  const result = await env.DB.prepare(`
    INSERT INTO assets (id, type, name, description, total_value, currency, location, metadata, status, created_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    crypto.randomUUID(),
    data.type,
    data.name,
    data.description || null,
    data.totalValue,
    data.currency,
    data.location || null,
    JSON.stringify(data.metadata || {}),
    'PENDING',
    data.createdBy,
    new Date().toISOString(),
    new Date().toISOString()
  ).run();

  return result;
}

async function getAssets(env: Env) {
  const result = await env.DB.prepare(`
    SELECT * FROM assets ORDER BY created_at DESC
  `).all();
  
  return result.results;
}

async function getAssetById(id: string, env: Env) {
  const result = await env.DB.prepare(`
    SELECT * FROM assets WHERE id = ?
  `).bind(id).first();
  
  return result;
}

async function updateAsset(id: string, data: any, env: Env) {
  const updates = [];
  const values = [];
  
  if (data.name) { updates.push('name = ?'); values.push(data.name); }
  if (data.type) { updates.push('type = ?'); values.push(data.type); }
  if (data.description !== undefined) { updates.push('description = ?'); values.push(data.description); }
  if (data.totalValue) { updates.push('total_value = ?'); values.push(data.totalValue); }
  if (data.currency) { updates.push('currency = ?'); values.push(data.currency); }
  if (data.location !== undefined) { updates.push('location = ?'); values.push(data.location); }
  if (data.metadata) { updates.push('metadata = ?'); values.push(JSON.stringify(data.metadata)); }
  if (data.status) { updates.push('status = ?'); values.push(data.status); }
  
  updates.push('updated_at = ?');
  values.push(new Date().toISOString());
  values.push(id);

  const result = await env.DB.prepare(`
    UPDATE assets SET ${updates.join(', ')} WHERE id = ?
  `).bind(...values).run();

  return result;
}

async function deleteAsset(id: string, env: Env) {
  const result = await env.DB.prepare(`
    DELETE FROM assets WHERE id = ?
  `).bind(id).run();

  return result;
}

// Route handlers
export function assetRoutes(router: Router, env: Env) {
  // Create asset
  router.post('/api/v1/assets', authenticate, async (request: Request) => {
    try {
      const body = await request.json();
      
      // Validate request body
      const validation = CreateAssetSchema.safeParse(body);
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
      const assetData = {
        ...validation.data,
        createdBy: user.id,
      };

      await createAsset(assetData, env);

      return addCorsHeaders(new Response(JSON.stringify({ 
        message: 'Asset created successfully',
        asset: assetData 
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }));

    } catch (error) {
      return databaseErrorHandler(error, request);
    }
  });

  // List assets
  router.get('/api/v1/assets', authenticate, async (request: Request) => {
    try {
      const assets = await getAssets(env);

      return addCorsHeaders(new Response(JSON.stringify(assets), {
        headers: { 'Content-Type': 'application/json' },
      }));

    } catch (error) {
      return databaseErrorHandler(error, request);
    }
  });

  // Get asset by id
  router.get('/api/v1/assets/:id', authenticate, async (request: Request) => {
    try {
      const url = new URL(request.url);
      const id = url.pathname.split('/').pop();

      if (!id) {
        return new Response(JSON.stringify({ error: 'Asset ID required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const asset = await getAssetById(id, env);
      
      if (!asset) {
        return new Response(JSON.stringify({ error: 'Asset not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return addCorsHeaders(new Response(JSON.stringify(asset), {
        headers: { 'Content-Type': 'application/json' },
      }));

    } catch (error) {
      return databaseErrorHandler(error, request);
    }
  });

  // Update asset
  router.put('/api/v1/assets/:id', authenticate, async (request: Request) => {
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

      // Validate request body
      const validation = UpdateAssetSchema.safeParse(body);
      if (!validation.success) {
        return new Response(JSON.stringify({ 
          error: 'Validation failed', 
          details: validation.error.errors 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      await updateAsset(id, validation.data, env);

      return addCorsHeaders(new Response(JSON.stringify({ 
        message: 'Asset updated successfully' 
      }), {
        headers: { 'Content-Type': 'application/json' },
      }));

    } catch (error) {
      return databaseErrorHandler(error, request);
    }
  });

  // Delete asset
  router.delete('/api/v1/assets/:id', authenticate, requireRole(['ADMIN', 'MANAGER']), async (request: Request) => {
    try {
      const url = new URL(request.url);
      const id = url.pathname.split('/').pop();

      if (!id) {
        return new Response(JSON.stringify({ error: 'Asset ID required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      await deleteAsset(id, env);

      return addCorsHeaders(new Response(JSON.stringify({ 
        message: 'Asset deleted successfully' 
      }), {
        headers: { 'Content-Type': 'application/json' },
      }));

    } catch (error) {
      return databaseErrorHandler(error, request);
    }
  });
}
