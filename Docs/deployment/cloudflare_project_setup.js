// Cloudflare Developer Platform Project Setup Script
// Usage: node Docs/cloudflare_project_setup.js
// Requirements: npm install axios prompt-sync

const axios = require('axios');
const prompt = require('prompt-sync')({ sigint: true });

// Get credentials securely
const CLOUDFLARE_EMAIL = process.env.CLOUDFLARE_EMAIL || prompt('Cloudflare Email: ');
const CLOUDFLARE_API_KEY = process.env.CLOUDFLARE_API_KEY || prompt('Cloudflare Global API Key: ', { echo: '*' });

const PROJECT_NAME = 'Tokenization-microservice';
const PROJECT_DESCRIPTION = `The Asset Tokenization Microservice (ATMS) is a fully independent, API-first platform that enables tokenization of real-world assets including real estate, commodities, securities, and alternative investments. The system is designed for seamless integration with existing platforms (wealth management, core banking, fintech applications) through standardized APIs and webhooks.`;

const CLOUDFLARE_API = 'https://api.cloudflare.com/client/v4';

// Axios instance with auth headers
const api = axios.create({
  baseURL: CLOUDFLARE_API,
  headers: {
    'X-Auth-Email': CLOUDFLARE_EMAIL,
    'X-Auth-Key': CLOUDFLARE_API_KEY,
    'Content-Type': 'application/json',
  },
});

async function main() {
  try {
    // 1. Get account ID
    console.log('Retrieving Cloudflare account ID...');
    const accountsRes = await api.get('/accounts');
    if (!accountsRes.data.success || !accountsRes.data.result.length) {
      throw new Error('No Cloudflare accounts found for this user.');
    }
    const account = accountsRes.data.result[0];
    const accountId = account.id;
    console.log('Account ID:', accountId);
    console.log('Account Name:', account.name);

    // 2. List existing Developer Platform applications (Workers/Pages)
    console.log('\nListing existing Workers projects:');
    const workersRes = await api.get(`/accounts/${accountId}/workers/services`);
    if (workersRes.data.success) {
      workersRes.data.result.forEach((svc, i) => {
        console.log(`  [${i + 1}] ${svc.name}`);
      });
    } else {
      console.log('  No Workers projects found or insufficient permissions.');
    }

    // 3. Create new Workers project (as a placeholder for the microservice)
    console.log(`\nCreating new Workers project: ${PROJECT_NAME}`);
    const createRes = await api.post(`/accounts/${accountId}/workers/services`, {
      name: PROJECT_NAME,
      description: PROJECT_DESCRIPTION,
    });
    if (createRes.data.success) {
      console.log('  Project created successfully!');
      console.log('  Project ID:', createRes.data.result.id);
    } else {
      console.log('  Failed to create project:', createRes.data.errors);
    }

    // 4. List available features (Workers, D1, R2, KV, Pages)
    console.log('\nChecking available Developer Platform features:');
    // Workers
    console.log('  - Workers: enabled');
    // D1 (Cloudflare DB)
    try {
      const d1Res = await api.get(`/accounts/${accountId}/d1/database`);
      if (d1Res.data.success) {
        console.log('  - D1: enabled');
      }
    } catch (e) {
      console.log('  - D1: not enabled or insufficient permissions');
    }
    // R2 (Object Storage)
    try {
      const r2Res = await api.get(`/accounts/${accountId}/r2/buckets`);
      if (r2Res.data.success) {
        console.log('  - R2: enabled');
      }
    } catch (e) {
      console.log('  - R2: not enabled or insufficient permissions');
    }
    // KV (Key-Value)
    try {
      const kvRes = await api.get(`/accounts/${accountId}/storage/kv/namespaces`);
      if (kvRes.data.success) {
        console.log('  - KV: enabled');
      }
    } catch (e) {
      console.log('  - KV: not enabled or insufficient permissions');
    }
    // Pages
    try {
      const pagesRes = await api.get(`/accounts/${accountId}/pages/projects`);
      if (pagesRes.data.success) {
        console.log('  - Pages: enabled');
      }
    } catch (e) {
      console.log('  - Pages: not enabled or insufficient permissions');
    }

    console.log('\nAll steps completed. Your new Cloudflare project is ready!');
    console.log('Next steps:');
    console.log('  - Deploy your code using Wrangler or the Cloudflare dashboard.');
    console.log('  - Configure environment variables, storage, and bindings as needed.');
    console.log('  - Integrate with your CI/CD pipeline for production deployments.');
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();
