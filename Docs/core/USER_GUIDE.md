# Asset Tokenization Microservice - User Guide

**Version**: 1.0.0  
**Last Updated**: August 7, 2025

---

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Authentication](#authentication)
4. [Asset Management](#asset-management)
5. [Document Management](#document-management)
6. [Token Management](#token-management)
7. [Trading & Settlement](#trading--settlement)
8. [Compliance & Reporting](#compliance--reporting)
9. [Analytics](#analytics)
10. [Best Practices](#best-practices)
11. [Troubleshooting](#troubleshooting)

---

## Introduction

The Asset Tokenization Microservice (ATMS) is a comprehensive platform for tokenizing real-world assets. This guide will walk you through all aspects of using the platform, from basic asset creation to advanced trading and compliance features.

### What is Asset Tokenization?

Asset tokenization is the process of converting real-world assets (real estate, commodities, securities, etc.) into digital tokens on a blockchain. This enables:

- **Fractional Ownership**: Divide expensive assets into smaller, tradeable units
- **Liquidity**: Trade assets that were previously illiquid
- **Transparency**: Immutable records of ownership and transactions
- **Automation**: Smart contracts handle compliance and settlement

### Key Concepts

- **Asset**: A real-world item being tokenized (building, artwork, etc.)
- **Token**: Digital representation of the asset on blockchain
- **Token Holder**: Person or entity that owns tokens
- **Order**: Request to buy or sell tokens
- **Trade**: Executed transaction between buyers and sellers
- **Settlement**: Final transfer of tokens and payment

---

## Getting Started

### Prerequisites

- API access credentials (JWT token or API key)
- Understanding of REST APIs
- Basic knowledge of blockchain concepts

### Base URL

```
Production: https://your-worker.your-subdomain.workers.dev
Staging: https://your-worker-staging.your-subdomain.workers.dev
```

### Authentication

All API requests require authentication. Include your credentials in the request headers:

```bash
# Using JWT Token
Authorization: Bearer YOUR_JWT_TOKEN

# Using API Key
Authorization: ApiKey YOUR_API_KEY
```

### Rate Limits

- **Standard**: 1000 requests/hour
- **Premium**: 10000 requests/hour
- **Burst**: 100 requests/minute

---

## Authentication

### JWT Token Authentication

JWT tokens provide user-specific access with role-based permissions.

#### Login
```bash
curl -X POST https://your-worker.your-subdomain.workers.dev/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "your-password"
  }'
```

#### Response
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "roles": ["USER", "ASSET_CREATOR"]
  }
}
```

### API Key Authentication

API keys provide service-to-service authentication.

#### Generate API Key
```bash
curl -X POST https://your-worker.your-subdomain.workers.dev/api/v1/auth/api-keys \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Service Integration",
    "permissions": ["assets:read", "assets:write"]
  }'
```

### User Roles

- **USER**: Basic access to view assets and tokens
- **ASSET_CREATOR**: Can create and manage assets
- **VERIFIER**: Can verify asset ownership and documents
- **VALUER**: Can provide asset valuations
- **TRADER**: Can place orders and trade tokens
- **ADMIN**: Full system access
- **COMPLIANCE**: Access to compliance and reporting features

---

## Asset Management

### Creating Assets

Assets represent real-world items that can be tokenized.

#### Create a Real Estate Asset
```bash
curl -X POST https://your-worker.your-subdomain.workers.dev/api/v1/assets \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Downtown Office Building",
    "type": "REAL_ESTATE",
    "description": "Class A office building in downtown business district",
    "totalValue": 5000000,
    "currency": "USD",
    "location": "New York, NY",
    "metadata": {
      "squareFootage": 50000,
      "floors": 10,
      "yearBuilt": 2010,
      "occupancyRate": 0.85
    }
  }'
```

#### Asset Types

- **REAL_ESTATE**: Buildings, land, commercial properties
- **COMMODITY**: Gold, oil, agricultural products
- **SECURITY**: Stocks, bonds, investment funds
- **ART**: Paintings, sculptures, collectibles

#### Response
```json
{
  "id": "asset-123",
  "name": "Downtown Office Building",
  "type": "REAL_ESTATE",
  "status": "PENDING",
  "totalValue": 5000000,
  "currency": "USD",
  "createdAt": "2024-12-01T10:00:00Z"
}
```

### Managing Assets

#### List Assets
```bash
curl -X GET https://your-worker.your-subdomain.workers.dev/api/v1/assets \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Get Asset Details
```bash
curl -X GET https://your-worker.your-subdomain.workers.dev/api/v1/assets/asset-123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Update Asset
```bash
curl -X PUT https://your-worker.your-subdomain.workers.dev/api/v1/assets/asset-123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "totalValue": 5500000,
    "metadata": {
      "squareFootage": 50000,
      "floors": 10,
      "yearBuilt": 2010,
      "occupancyRate": 0.90
    }
  }'
```

---

## Document Management

### Uploading Documents

Documents provide proof of ownership and compliance.

#### Upload Asset Document
```bash
curl -X POST https://your-worker.your-subdomain.workers.dev/api/v1/documents/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@deed.pdf" \
  -F "assetId=asset-123" \
  -F "type=DEED" \
  -F "description=Property deed for downtown office building"
```

#### Document Types

- **DEED**: Property ownership documents
- **CERTIFICATE**: Asset certificates
- **INSURANCE**: Insurance policies
- **OTHER**: Miscellaneous documents

#### Response
```json
{
  "id": "doc-456",
  "url": "documents/1701234567890-deed.pdf",
  "hash": "a1b2c3d4e5f6...",
  "type": "DEED",
  "uploadedAt": "2024-12-01T10:30:00Z"
}
```

### Managing Documents

#### List Asset Documents
```bash
curl -X GET https://your-worker.your-subdomain.workers.dev/api/v1/assets/asset-123/documents \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Download Document
```bash
curl -X GET https://your-worker.your-subdomain.workers.dev/api/v1/documents/doc-456/download \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  --output deed.pdf
```

---

## Token Management

### Creating Tokens

Tokens represent digital ownership of assets.

#### Create ERC-20 Token
```bash
curl -X POST https://your-worker.your-subdomain.workers.dev/api/v1/tokens \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "assetId": "asset-123",
    "symbol": "DOB",
    "name": "Downtown Office Building Token",
    "totalSupply": 1000000,
    "decimals": 18,
    "tokenStandard": "ERC20",
    "metadata": {
      "description": "Token representing ownership in downtown office building",
      "website": "https://example.com/dob-token"
    }
  }'
```

#### Token Standards

- **ERC20**: Fungible tokens (like shares of stock)
- **ERC721**: Non-fungible tokens (unique items)
- **ERC1400**: Security tokens (regulated securities)

#### Response
```json
{
  "id": "token-789",
  "contractAddress": "0x1234567890abcdef...",
  "symbol": "DOB",
  "name": "Downtown Office Building Token",
  "totalSupply": "1000000000000000000000000",
  "decimals": 18,
  "status": "DEPLOYED"
}
```

### Token Operations

#### Mint Tokens
```bash
curl -X POST https://your-worker.your-subdomain.workers.dev/api/v1/tokens/token-789/mint \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "0xabcdef1234567890...",
    "amount": "1000000000000000000000"
  }'
```

#### Transfer Tokens
```bash
curl -X POST https://your-worker.your-subdomain.workers.dev/api/v1/tokens/token-789/transfer \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "0xabcdef1234567890...",
    "to": "0xfedcba0987654321...",
    "amount": "100000000000000000000"
  }'
```

#### Get Token Holders
```bash
curl -X GET https://your-worker.your-subdomain.workers.dev/api/v1/tokens/token-789/holders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Trading & Settlement

### Order Management

Orders represent requests to buy or sell tokens.

#### Place Buy Order
```bash
curl -X POST https://your-worker.your-subdomain.workers.dev/api/v1/orders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tokenId": "token-789",
    "orderType": "BUY",
    "orderMethod": "LIMIT",
    "quantity": "1000000000000000000000",
    "price": "5000000000000000000",
    "expiresAt": "2024-12-31T23:59:59Z"
  }'
```

#### Order Types

- **BUY**: Purchase tokens
- **SELL**: Sell tokens

#### Order Methods

- **MARKET**: Execute at current market price
- **LIMIT**: Execute only at specified price or better

#### Response
```json
{
  "id": "order-101",
  "tokenId": "token-789",
  "orderType": "BUY",
  "status": "PENDING",
  "quantity": "1000000000000000000000",
  "price": "5000000000000000000",
  "createdAt": "2024-12-01T11:00:00Z"
}
```

### Order Management

#### List Orders
```bash
curl -X GET https://your-worker.your-subdomain.workers.dev/api/v1/orders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Cancel Order
```bash
curl -X DELETE https://your-worker.your-subdomain.workers.dev/api/v1/orders/order-101 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Settlement

Trades are automatically settled when orders match.

#### Get Settlement Status
```bash
curl -X GET https://your-worker.your-subdomain.workers.dev/api/v1/settlement/status/trade-202 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Compliance & Reporting

### KYC/AML Integration

Know Your Customer (KYC) and Anti-Money Laundering (AML) compliance.

#### Verify KYC
```bash
curl -X POST https://your-worker.your-subdomain.workers.dev/api/v1/kyc/verify \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "documentType": "PASSPORT",
    "documentNumber": "123456789",
    "country": "US"
  }'
```

#### Check KYC Status
```bash
curl -X GET https://your-worker.your-subdomain.workers.dev/api/v1/kyc/status/user-123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Regulatory Reporting

Generate compliance reports for regulatory authorities.

#### Generate Report
```bash
curl -X POST https://your-worker.your-subdomain.workers.dev/api/v1/reports/regulatory/generate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reportType": "TRANSACTION_SUMMARY",
    "startDate": "2024-01-01",
    "endDate": "2024-12-01",
    "format": "PDF"
  }'
```

### Audit Trail

Track all system activities for compliance and security.

#### Get Audit Log
```bash
curl -X GET https://your-worker.your-subdomain.workers.dev/api/v1/audit \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Analytics

### Performance Analytics

Track portfolio and asset performance.

#### Get Portfolio Performance
```bash
curl -X GET https://your-worker.your-subdomain.workers.dev/api/v1/analytics/performance \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Market Data

Access real-time market information.

#### Get Market Data
```bash
curl -X GET https://your-worker.your-subdomain.workers.dev/api/v1/analytics/market-data \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Risk Analytics

Monitor risk metrics and alerts.

#### Get Risk Assessment
```bash
curl -X GET https://your-worker.your-subdomain.workers.dev/api/v1/analytics/risk \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Best Practices

### Security

1. **Secure Credentials**: Never share JWT tokens or API keys
2. **HTTPS Only**: Always use HTTPS for API calls
3. **Input Validation**: Validate all input data before sending
4. **Rate Limiting**: Respect API rate limits
5. **Error Handling**: Implement proper error handling

### Performance

1. **Caching**: Cache frequently accessed data
2. **Pagination**: Use pagination for large datasets
3. **Batch Operations**: Use batch endpoints when available
4. **Connection Pooling**: Reuse HTTP connections

### Compliance

1. **KYC Verification**: Complete KYC before trading
2. **Document Upload**: Upload all required documents
3. **Audit Trail**: Monitor audit logs regularly
4. **Regulatory Reports**: Generate reports as required

### Error Handling

```javascript
// Example error handling
try {
  const response = await fetch('/api/v1/assets', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(assetData)
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('API Error:', error.message);
    return;
  }

  const result = await response.json();
  console.log('Success:', result);
} catch (error) {
  console.error('Network Error:', error);
}
```

---

## Troubleshooting

### Common Issues

#### Authentication Errors

**Problem**: 401 Unauthorized
```
{
  "error": "UNAUTHORIZED",
  "message": "Authentication failed"
}
```

**Solution**: 
- Check JWT token expiration
- Verify API key is correct
- Ensure proper Authorization header format

#### Rate Limiting

**Problem**: 429 Too Many Requests
```
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Rate limit exceeded"
}
```

**Solution**:
- Implement exponential backoff
- Reduce request frequency
- Upgrade to premium tier if needed

#### Validation Errors

**Problem**: 400 Bad Request
```
{
  "error": "VALIDATION_ERROR",
  "details": [
    {
      "field": "totalValue",
      "message": "Must be a positive number"
    }
  ]
}
```

**Solution**:
- Check input data format
- Ensure required fields are provided
- Validate data types and ranges

### Support

For additional support:

- **Documentation**: Check the [API Documentation](./API_DOCUMENTATION.md)
- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Ask questions in GitHub Discussions
- **Enterprise Support**: Contact enterprise@yourcompany.com

---

## API Reference

For complete API documentation, see [API Documentation](./API_DOCUMENTATION.md).

### Endpoint Summary

| Category | Endpoints | Description |
|----------|-----------|-------------|
| Assets | `/api/v1/assets` | Create, read, update, delete assets |
| Documents | `/api/v1/documents` | Upload and manage documents |
| Tokens | `/api/v1/tokens` | Create and manage tokens |
| Trading | `/api/v1/orders` | Place and manage orders |
| Compliance | `/api/v1/kyc` | KYC/AML verification |
| Analytics | `/api/v1/analytics` | Performance and risk analytics |

---

*This user guide covers the essential features of the Asset Tokenization Microservice. For advanced usage and customization, refer to the technical documentation.*
