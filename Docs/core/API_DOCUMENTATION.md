# API Documentation Summary

This file summarizes the main API endpoints for the Asset Tokenization Microservice. Full OpenAPI/Swagger docs are generated in code and available at /docs.

## Asset Management
- POST /api/v1/assets — Create asset
- GET /api/v1/assets — List assets
- GET /api/v1/assets/:id — Get asset details
- PUT /api/v1/assets/:id — Update asset
- DELETE /api/v1/assets/:id — Delete asset
- POST /api/v1/assets/:id/verify — Verify asset
- POST /api/v1/assets/:id/valuate — Add valuation
- POST /api/v1/assets/:id/documents — Upload document
- GET /api/v1/assets/:id/documents — List documents

## Token Management
- POST /api/v1/tokens — Deploy new token contract
- GET /api/v1/tokens — List tokens
- POST /api/v1/tokens/:id/mint — Mint tokens
- POST /api/v1/tokens/:id/burn — Burn tokens
- POST /api/v1/tokens/:id/transfer — Transfer tokens
- GET /api/v1/tokens/:id/holders — List token holders

## Trading & Settlement
- POST /api/v1/orders — Create order
- GET /api/v1/orders — List orders
- GET /api/v1/orders/:id — Get order
- PUT /api/v1/orders/:id — Update order
- DELETE /api/v1/orders/:id — Cancel order
- POST /api/v1/orders/match — Run matching engine
- POST /api/v1/trades/:id/settle — Settle trade
- GET /api/v1/trades — List trades
- GET /api/v1/tx/:hash — Get transaction status
- GET /api/v1/settlement/reports — Settlement reports

## Compliance & Analytics
- POST /api/v1/compliance/kyc — Verify KYC
- GET /api/v1/compliance/kyc/:userId — Get KYC status
- GET /api/v1/compliance/reports — Regulatory reports
- GET /api/v1/compliance/audit — Audit logs
- GET /api/v1/risk/alerts — List risk alerts
- POST /api/v1/risk/alerts — Create risk alert
- GET /api/v1/analytics/performance — Portfolio performance
- GET /api/v1/analytics/market-data — Market data
- GET /api/v1/analytics/valuations — Asset valuations
- GET /api/v1/analytics/risk — Risk assessments

## Integration & Events
- POST /api/v1/integration/webhooks — Register webhook
- GET /api/v1/integration/webhooks — List webhooks
- DELETE /api/v1/integration/webhooks/:id — Delete webhook
- POST /api/v1/events/emit — Emit event to webhooks

---

*See /docs for full OpenAPI/Swagger documentation with request/response examples.*
