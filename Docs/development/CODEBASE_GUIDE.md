# Asset Tokenization Microservice - Codebase Guide

**Version**: 1.0.0  
**Architecture**: Cloudflare Workers (Serverless)  
**Language**: TypeScript  
**Last Updated**: August 7, 2025

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Architecture Overview](#architecture-overview)
3. [Core Components](#core-components)
4. [Database Schema](#database-schema)
5. [API Design Patterns](#api-design-patterns)
6. [Security Implementation](#security-implementation)
7. [Error Handling](#error-handling)
8. [Testing Strategy](#testing-strategy)
9. [Deployment Architecture](#deployment-architecture)
10. [Development Guidelines](#development-guidelines)

---

## Project Structure

```
Tokenization-microservice/
├── src/                          # Source code
│   ├── worker.ts                 # Main Workers entry point
│   ├── middleware/               # Middleware functions
│   │   ├── auth.ts              # Authentication & authorization
│   │   ├── error-handler.ts     # Error handling
│   │   └── cors.ts              # CORS handling
│   ├── routes/                  # API route handlers
│   │   ├── assets.ts            # Asset management
│   │   ├── documents.ts         # Document management
│   │   ├── tokens.ts            # Token operations
│   │   ├── orders.ts            # Trading orders
│   │   ├── compliance.ts        # KYC/AML integration
│   │   └── analytics.ts         # Analytics & reporting
│   └── models/                  # TypeScript interfaces
│       ├── asset.ts             # Asset data model
│       ├── token.ts             # Token data model
│       └── user.ts              # User data model
├── contracts/                   # Smart contracts
│   ├── ERC20Token.sol          # ERC-20 implementation
│   ├── ERC721Token.sol         # ERC-721 implementation
│   └── ERC1400Token.sol        # ERC-1400 implementation
├── docs/                       # Documentation
├── scripts/                    # Build & deployment scripts
├── wrangler.toml              # Cloudflare Workers config
├── package.json               # Dependencies & scripts
└── tsconfig.json              # TypeScript configuration
```

---

## Architecture Overview

### Cloudflare Workers Architecture

The microservice is built on Cloudflare Workers, a serverless platform that provides:

- **Global Edge Computing**: Deploy to 200+ locations worldwide
- **Zero Cold Starts**: Instant request processing
- **Automatic Scaling**: Handle traffic spikes automatically
- **Built-in Security**: DDoS protection and SSL/TLS

### Core Architecture Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Workers                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │   Router    │ │ Middleware  │ │   Route Handlers        │ │
│  │ (itty-router)│ │ (Auth, CORS)│ │  (Assets, Tokens, etc.) │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                    Cloudflare Services                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │     D1      │ │     R2      │ │      KV                 │ │
│  │  Database   │ │   Storage   │ │    Cache/Sessions       │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Request**: HTTP request arrives at Cloudflare edge
2. **Routing**: itty-router matches request to handler
3. **Middleware**: Authentication, CORS, rate limiting
4. **Handler**: Business logic execution
5. **Database**: D1 for structured data, R2 for files
6. **Response**: JSON response with proper headers

---

## Core Components

### 1. Worker Entry Point (`src/worker.ts`)

The main entry point for all requests:

```typescript
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      const response = await router.handle(request, env, ctx);
      return response || new Response('Not found', { status: 404 });
    } catch (error) {
      return errorHandler(error, request, env);
    }
  }
};
```

**Key Features**:
- Request routing with itty-router
- Environment variable access
- Error handling middleware
- CORS support

### 2. Authentication Middleware (`src/middleware/auth.ts`)

Handles JWT and API key authentication:

```typescript
export async function authenticate(request: Request, env: Env): Promise<Response | void> {
  const authHeader = request.headers.get('Authorization');
  
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const payload = await verifyJWT(token, env.JWT_SECRET);
    (request as any).user = payload;
    return;
  }
  
  // API key authentication...
}
```

**Features**:
- JWT token verification with Web Crypto API
- API key authentication
- Role-based access control (RBAC)
- Rate limiting

### 3. Error Handling (`src/middleware/error-handler.ts`)

Centralized error handling with structured responses:

```typescript
export function errorHandler(error: any, request: Request, env: Env): Response {
  const timestamp = new Date().toISOString();
  const requestId = request.headers.get('CF-Ray') || 'unknown';
  
  let status = 500;
  let errorMessage = 'Internal server error';
  let errorCode = 'INTERNAL_ERROR';
  
  // Error classification logic...
  
  return new Response(JSON.stringify({
    error: errorCode,
    message: errorMessage,
    timestamp,
    requestId,
  }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

**Features**:
- Error classification by type
- Structured error responses
- Request ID tracking
- Security-conscious error messages

---

## Database Schema

### D1 Database Tables

The microservice uses Cloudflare D1 (SQLite-based) for structured data:

#### Assets Table
```sql
CREATE TABLE assets (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    total_value REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    location TEXT,
    metadata TEXT, -- JSON
    status TEXT NOT NULL DEFAULT 'PENDING',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    created_by TEXT NOT NULL,
    verified_by TEXT,
    verified_at TEXT
);
```

#### Tokens Table
```sql
CREATE TABLE tokens (
    id TEXT PRIMARY KEY,
    asset_id TEXT NOT NULL,
    contract_address TEXT NOT NULL,
    blockchain TEXT NOT NULL,
    token_standard TEXT NOT NULL,
    symbol TEXT NOT NULL,
    name TEXT NOT NULL,
    total_supply TEXT NOT NULL,
    decimals INTEGER NOT NULL DEFAULT 18,
    metadata TEXT, -- JSON
    deployed_at TEXT NOT NULL,
    deployed_by TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'DEPLOYED'
);
```

#### Orders Table
```sql
CREATE TABLE orders (
    id TEXT PRIMARY KEY,
    token_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    order_type TEXT NOT NULL, -- BUY, SELL
    order_method TEXT NOT NULL, -- MARKET, LIMIT
    quantity TEXT NOT NULL,
    price TEXT,
    total_value TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    expires_at TEXT,
    executed_at TEXT,
    executed_price TEXT
);
```

### R2 Storage

Cloudflare R2 is used for document storage:

```
R2 Bucket Structure:
├── documents/
│   ├── {timestamp}-{filename}     # Asset documents
│   └── {timestamp}-{filename}     # User documents
├── contracts/
│   └── {contract-address}.json    # Smart contract metadata
└── reports/
    └── {report-id}.pdf            # Generated reports
```

---

## API Design Patterns

### 1. RESTful Design

All endpoints follow REST conventions:

```typescript
// Asset endpoints
GET    /api/v1/assets              # List assets
POST   /api/v1/assets              # Create asset
GET    /api/v1/assets/:id          # Get asset
PUT    /api/v1/assets/:id          # Update asset
DELETE /api/v1/assets/:id          # Delete asset

// Token endpoints
GET    /api/v1/tokens              # List tokens
POST   /api/v1/tokens              # Create token
GET    /api/v1/tokens/:id          # Get token
POST   /api/v1/tokens/:id/mint     # Mint tokens
POST   /api/v1/tokens/:id/transfer # Transfer tokens
```

### 2. Request Validation

All requests are validated using Zod schemas:

```typescript
const CreateAssetSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['REAL_ESTATE', 'COMMODITY', 'SECURITY', 'ART']),
  totalValue: z.number().positive(),
  currency: z.string().length(3),
  location: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

// Usage in route handler
const validation = CreateAssetSchema.safeParse(body);
if (!validation.success) {
  return new Response(JSON.stringify({ 
    error: 'Validation failed', 
    details: validation.error.errors 
  }), { status: 400 });
}
```

### 3. Response Formatting

Consistent response format across all endpoints:

```typescript
// Success response
{
  "data": { ... },
  "message": "Asset created successfully",
  "timestamp": "2024-12-01T10:00:00Z"
}

// Error response
{
  "error": "VALIDATION_ERROR",
  "message": "Request validation failed",
  "details": [ ... ],
  "timestamp": "2024-12-01T10:00:00Z",
  "requestId": "cf-ray-1234567890abcdef"
}
```

---

## Security Implementation

### 1. Authentication

**JWT Token Security**:
- RS256 signing algorithm
- Configurable expiration times
- Token refresh mechanism
- Secure token storage

**API Key Security**:
- Scoped permissions
- Rate limiting per key
- Automatic rotation
- Audit logging

### 2. Authorization

Role-based access control (RBAC):

```typescript
export function requireRole(roles: string[]) {
  return async (request: Request, env: Env): Promise<Response | void> => {
    const user = (request as any).user;
    
    if (!user.roles || !user.roles.some((role: string) => roles.includes(role))) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  };
}
```

### 3. Data Protection

- **Encryption**: TLS 1.3 for data in transit
- **Input Sanitization**: All user inputs validated and sanitized
- **SQL Injection Prevention**: Parameterized queries with D1
- **XSS Protection**: Content Security Policy headers
- **CSRF Protection**: Token-based CSRF protection

### 4. Rate Limiting

Configurable rate limiting per endpoint:

```typescript
export async function rateLimit(
  request: Request, 
  env: Env, 
  limit: number = 100, 
  window: number = 3600
): Promise<Response | void> {
  const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
  const key = `rate_limit:${clientIP}`;
  
  const current = await env.CACHE.get(key);
  const count = current ? parseInt(current) : 0;
  
  if (count >= limit) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  await env.CACHE.put(key, (count + 1).toString(), { expirationTtl: window });
}
```

---

## Error Handling

### 1. Error Classification

Errors are classified by type and severity:

```typescript
// Error types
enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  BLOCKCHAIN_ERROR = 'BLOCKCHAIN_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}
```

### 2. Error Response Format

Structured error responses with context:

```typescript
interface ErrorResponse {
  error: string;
  message: string;
  code?: string;
  timestamp: string;
  requestId?: string;
  details?: any[];
}
```

### 3. Error Logging

Comprehensive error logging for debugging:

```typescript
console.error('Error occurred:', {
  error: errorMessage,
  code: errorCode,
  status,
  requestId,
  url: request.url,
  method: request.method,
  userAgent: request.headers.get('User-Agent'),
  timestamp,
});
```

---

## Testing Strategy

### 1. Unit Testing

Jest-based unit tests for all components:

```typescript
// Example test for asset creation
describe('Asset Creation', () => {
  it('should create asset with valid data', async () => {
    const assetData = {
      name: 'Test Asset',
      type: 'REAL_ESTATE',
      totalValue: 1000000,
      currency: 'USD'
    };
    
    const result = await createAsset(assetData, mockEnv);
    expect(result).toBeDefined();
    expect(result.name).toBe(assetData.name);
  });
});
```

### 2. Integration Testing

End-to-end testing with real Cloudflare services:

```typescript
// Integration test setup
describe('API Integration Tests', () => {
  it('should handle complete asset lifecycle', async () => {
    // Create asset
    const asset = await createAsset(testData);
    
    // Upload document
    const document = await uploadDocument(asset.id, testFile);
    
    // Create token
    const token = await createToken(asset.id, tokenData);
    
    // Verify all operations
    expect(asset.status).toBe('VERIFIED');
    expect(token.contractAddress).toBeDefined();
  });
});
```

### 3. Performance Testing

Load testing with realistic scenarios:

```typescript
// Performance test
describe('Performance Tests', () => {
  it('should handle 1000 concurrent requests', async () => {
    const promises = Array(1000).fill(null).map(() => 
      fetch('/api/v1/assets', { headers: { Authorization: `Bearer ${token}` } })
    );
    
    const responses = await Promise.all(promises);
    const successCount = responses.filter(r => r.ok).length;
    
    expect(successCount).toBeGreaterThan(950); // 95% success rate
  });
});
```

---

## Deployment Architecture

### 1. Cloudflare Workers Deployment

```bash
# Development
npm run dev

# Staging deployment
npm run deploy:staging

# Production deployment
npm run deploy:production
```

### 2. Environment Configuration

```toml
# wrangler.toml
name = "asset-tokenization-microservice"
main = "src/worker.ts"
compatibility_date = "2024-01-01"

[env.production]
name = "asset-tokenization-microservice-prod"

[env.staging]
name = "asset-tokenization-microservice-staging"

[[r2_buckets]]
binding = "R2"
bucket_name = "asset-tokenization-docs"

[[d1_databases]]
binding = "DB"
database_name = "asset-tokenization-db"
```

### 3. CI/CD Pipeline

GitHub Actions workflow for automated deployment:

```yaml
name: Deploy to Cloudflare
on:
  push:
    branches: [main, staging]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test
      - run: npm run deploy:${{ github.ref_name == 'main' && 'production' || 'staging' }}
```

---

## Development Guidelines

### 1. Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Enforced code quality rules
- **Prettier**: Consistent code formatting
- **Comments**: JSDoc for all public functions

### 2. Git Workflow

```bash
# Feature development
git checkout -b feature/asset-management
git add .
git commit -m "feat: add asset creation endpoint"
git push origin feature/asset-management

# Create pull request for review
```

### 3. Commit Message Convention

```
type(scope): description

feat(assets): add asset creation endpoint
fix(auth): resolve JWT token validation issue
docs(api): update API documentation
test(orders): add order management tests
```

### 4. Code Review Checklist

- [ ] TypeScript types are correct
- [ ] Error handling is implemented
- [ ] Input validation is present
- [ ] Tests are included
- [ ] Documentation is updated
- [ ] Security considerations addressed

### 5. Performance Guidelines

- **Database Queries**: Use indexes and optimize queries
- **Caching**: Implement appropriate caching strategies
- **File Uploads**: Stream large files to R2
- **Memory Usage**: Monitor and optimize memory consumption

---

## Monitoring and Observability

### 1. Health Checks

```typescript
// Health check endpoint
router.get('/health', () => {
  return new Response(JSON.stringify({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

### 2. Metrics Collection

- **Request Count**: Total requests per endpoint
- **Response Time**: Average and percentile response times
- **Error Rate**: Error percentage by type
- **Database Performance**: Query execution times
- **Storage Usage**: R2 bucket usage statistics

### 3. Logging Strategy

Structured JSON logging for all operations:

```typescript
console.log('API Request', {
  method: request.method,
  url: request.url,
  userAgent: request.headers.get('User-Agent'),
  timestamp: new Date().toISOString(),
  requestId: request.headers.get('CF-Ray'),
});
```

---

## Security Best Practices

### 1. Input Validation

- Validate all user inputs
- Use Zod schemas for type safety
- Sanitize data before database operations
- Implement proper error messages

### 2. Authentication

- Use secure JWT tokens
- Implement token refresh
- Store sensitive data in environment variables
- Regular security audits

### 3. Authorization

- Implement least privilege principle
- Use role-based access control
- Audit all permission changes
- Regular access reviews

### 4. Data Protection

- Encrypt sensitive data
- Implement data retention policies
- Regular backup testing
- Compliance with data protection regulations

---

*This codebase guide provides a comprehensive overview of the Asset Tokenization Microservice architecture and implementation details. For specific implementation questions, refer to the individual component documentation.*
