import { Router } from 'itty-router';
import { z } from 'zod';
import { Env } from '../worker';
import { authenticate, requireRole } from '../middleware/auth';
import { addCorsHeaders } from '../middleware/cors';
import { databaseErrorHandler } from '../middleware/error-handler';

// Validation schemas
const UploadDocumentSchema = z.object({
  assetId: z.string().uuid(),
  type: z.enum(['DEED', 'CERTIFICATE', 'INSURANCE', 'OTHER']),
  description: z.string().optional(),
});

// R2 file upload function
async function uploadToR2(fileBuffer: ArrayBuffer, filename: string, env: Env): Promise<string> {
  const key = `documents/${Date.now()}-${filename}`;
  
  await env.R2.put(key, fileBuffer, {
    httpMetadata: {
      contentType: 'application/octet-stream',
    },
  });

  return key;
}

// Database operations for Workers
async function saveDocument(data: any, env: Env) {
  const result = await env.DB.prepare(`
    INSERT INTO documents (id, asset_id, type, url, hash, description, uploaded_by, uploaded_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    crypto.randomUUID(),
    data.assetId,
    data.type,
    data.url,
    data.hash,
    data.description || null,
    data.uploadedBy,
    new Date().toISOString()
  ).run();

  return result;
}

async function getDocuments(assetId: string, env: Env) {
  const result = await env.DB.prepare(`
    SELECT * FROM documents WHERE asset_id = ? ORDER BY uploaded_at DESC
  `).bind(assetId).all();
  
  return result.results;
}

// Route handlers
export function documentRoutes(router: Router, env: Env) {
  // Upload document
  router.post('/api/v1/documents/upload', authenticate, async (request: Request) => {
    try {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const assetId = formData.get('assetId') as string;
      const type = formData.get('type') as string;
      const description = formData.get('description') as string;

      if (!file || !assetId || !type) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        return new Response(JSON.stringify({ error: 'File too large (max 5MB)' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Upload to R2
      const fileBuffer = await file.arrayBuffer();
      const url = await uploadToR2(fileBuffer, file.name, env);

      // Generate hash
      const hash = await crypto.subtle.digest('SHA-256', fileBuffer);
      const hashHex = Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // Save to database
      const user = (request as any).user;
      await saveDocument({
        assetId,
        type,
        url,
        hash: hashHex,
        description,
        uploadedBy: user.id,
      }, env);

      return addCorsHeaders(new Response(JSON.stringify({ 
        message: 'Document uploaded successfully',
        url,
        hash: hashHex
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }));

    } catch (error) {
      return databaseErrorHandler(error, request);
    }
  });

  // List documents for asset
  router.get('/api/v1/assets/:assetId/documents', authenticate, async (request: Request) => {
    try {
      const url = new URL(request.url);
      const assetId = url.pathname.split('/')[3]; // /api/v1/assets/{assetId}/documents

      if (!assetId) {
        return new Response(JSON.stringify({ error: 'Asset ID required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const documents = await getDocuments(assetId, env);

      return addCorsHeaders(new Response(JSON.stringify(documents), {
        headers: { 'Content-Type': 'application/json' },
      }));

    } catch (error) {
      return databaseErrorHandler(error, request);
    }
  });

  // Download document
  router.get('/api/v1/documents/:id/download', authenticate, async (request: Request) => {
    try {
      const url = new URL(request.url);
      const id = url.pathname.split('/').pop();

      if (!id) {
        return new Response(JSON.stringify({ error: 'Document ID required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Get document from database
      const document = await env.DB.prepare(`
        SELECT * FROM documents WHERE id = ?
      `).bind(id).first();

      if (!document) {
        return new Response(JSON.stringify({ error: 'Document not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Get file from R2
      const object = await env.R2.get(document.url);
      
      if (!object) {
        return new Response(JSON.stringify({ error: 'File not found in storage' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(object.body, {
        headers: {
          'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${document.url.split('/').pop()}"`,
        },
      });

    } catch (error) {
      return databaseErrorHandler(error, request);
    }
  });
}
