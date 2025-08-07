# Cloudflare Deployment Guide for Asset Tokenization Microservice

This guide explains how to deploy the microservice to Cloudflare (Workers/Pages) with R2 for document storage and secure environment configuration.

---

## 1. Prerequisites
- Cloudflare account with Workers and R2 enabled
- Wrangler CLI installed (`npm install -g wrangler`)
- R2 bucket created in your Cloudflare dashboard
- PostgreSQL (or D1) database connection string

## 2. Project Setup
- Clone the repository and install dependencies:
  ```sh
  git clone <repo-url>
  cd Tokenization-microservice
  npm install
  ```

## 3. Configure Environment Variables
- Set secrets and config using Wrangler:
  ```sh
  wrangler secret put JWT_SECRET
  wrangler secret put API_KEY
  wrangler secret put DATABASE_URL
  wrangler secret put R2_ACCESS_KEY_ID
  wrangler secret put R2_SECRET_ACCESS_KEY
  wrangler secret put R2_BUCKET
  wrangler secret put R2_ENDPOINT
  ```
- (Optional) Add any other secrets required by your deployment.

## 4. Bind R2 to Your Worker/Pages Project
- In your `wrangler.toml`, add:
  ```toml
  [[r2_buckets]]
  binding = "R2"
  bucket_name = "<your-bucket-name>"
  preview_bucket_name = "<your-bucket-name>"
  ```
- In your code, access the R2 binding via `env.R2` (for Workers) or use the S3-compatible endpoint for Node.js.

## 5. Update Document Upload Logic
- In `src/routes/documents.ts`, update `uploadToCloud` to use the R2 SDK or S3-compatible SDK:
  ```js
  import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
  // ...
  const s3 = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
  async function uploadToCloud(fileBuffer, filename) {
    await s3.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: filename,
      Body: fileBuffer,
    }));
    return `https://${process.env.R2_BUCKET}.${process.env.R2_ENDPOINT}/${filename}`;
  }
  ```

## 6. Deploy with Wrangler
- Build and deploy your project:
  ```sh
  wrangler deploy
  ```
- For Pages Functions, use the appropriate build and deploy commands.

## 7. Best Practices
- Use environment variables for all secrets and config.
- Use RBAC and API key/JWT for all protected endpoints.
- Monitor logs and errors via Cloudflare dashboard or external log service.
- Regularly rotate secrets and review access permissions.

---

For more details, see Cloudflare Workers and R2 documentation.
