#!/usr/bin/env node

/**
 * Script de déploiement automatique des Edge Functions Supabase via API Management
 *
 * Usage:
 *   node deploy-edge-function.js <function_name>
 *   SUPABASE_ACCESS_TOKEN=xxx node deploy-edge-function.js ffa-verify-athlete
 *
 * Pour obtenir votre access token:
 *   1. Allez sur https://supabase.com/dashboard/account/tokens
 *   2. Créez un nouveau token
 *   3. Exportez-le: export SUPABASE_ACCESS_TOKEN=sbp_xxx
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const PROJECT_REF = 'fgstscztsighabpzzzix';
const FUNCTION_NAME = process.argv[2];
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!FUNCTION_NAME) {
  console.error('❌ Usage: node deploy-edge-function.js <function_name>');
  console.error('   Exemple: node deploy-edge-function.js ffa-verify-athlete');
  process.exit(1);
}

if (!ACCESS_TOKEN) {
  console.error('❌ SUPABASE_ACCESS_TOKEN non défini');
  console.error('');
  console.error('Pour obtenir votre token:');
  console.error('1. Allez sur https://supabase.com/dashboard/account/tokens');
  console.error('2. Créez un nouveau token');
  console.error('3. Exportez-le: export SUPABASE_ACCESS_TOKEN=sbp_xxx');
  console.error('4. Relancez ce script');
  process.exit(1);
}

const functionDir = path.join(__dirname, 'supabase', 'functions', FUNCTION_NAME);
const indexPath = path.join(functionDir, 'index.ts');

if (!fs.existsSync(indexPath)) {
  console.error(`❌ La fonction ${FUNCTION_NAME} n'existe pas dans supabase/functions/`);
  process.exit(1);
}

console.log(`🚀 Déploiement de la fonction: ${FUNCTION_NAME}`);
console.log(`📁 Depuis: ${functionDir}`);
console.log('');

// Lire le code de la fonction
const functionCode = fs.readFileSync(indexPath, 'utf8');

// Préparer les données de déploiement
const deployData = JSON.stringify({
  slug: FUNCTION_NAME,
  name: FUNCTION_NAME,
  verify_jwt: false,
  import_map: false,
  entrypoint_path: 'index.ts',
  import_map_path: null,
  files: [
    {
      name: 'index.ts',
      content: functionCode
    }
  ]
});

const options = {
  hostname: 'api.supabase.com',
  path: `/v1/projects/${PROJECT_REF}/functions/${FUNCTION_NAME}`,
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(deployData)
  }
};

console.log('📤 Envoi vers Supabase Management API...');

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('✅ Fonction déployée avec succès !');
      console.log('');
      console.log(`🔗 Testez-la sur: https://${PROJECT_REF}.supabase.co/functions/v1/${FUNCTION_NAME}`);
      console.log(`📊 Logs: https://supabase.com/dashboard/project/${PROJECT_REF}/functions/${FUNCTION_NAME}/logs`);
    } else if (res.statusCode === 404) {
      console.log('⚠️  La fonction n\'existe pas, création d\'une nouvelle...');

      // Essayer de créer la fonction
      const createOptions = {
        hostname: 'api.supabase.com',
        path: `/v1/projects/${PROJECT_REF}/functions`,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(deployData)
        }
      };

      const createReq = https.request(createOptions, (createRes) => {
        let createData = '';

        createRes.on('data', (chunk) => {
          createData += chunk;
        });

        createRes.on('end', () => {
          if (createRes.statusCode === 200 || createRes.statusCode === 201) {
            console.log('✅ Fonction créée avec succès !');
            console.log('');
            console.log(`🔗 Testez-la sur: https://${PROJECT_REF}.supabase.co/functions/v1/${FUNCTION_NAME}`);
            console.log(`📊 Logs: https://supabase.com/dashboard/project/${PROJECT_REF}/functions/${FUNCTION_NAME}/logs`);
          } else {
            console.error(`❌ Erreur lors de la création (${createRes.statusCode}):`, createData);
          }
        });
      });

      createReq.on('error', (e) => {
        console.error('❌ Erreur réseau:', e.message);
      });

      createReq.write(deployData);
      createReq.end();
    } else {
      console.error(`❌ Erreur lors du déploiement (${res.statusCode}):`);
      try {
        const parsed = JSON.parse(data);
        console.error(JSON.stringify(parsed, null, 2));
      } catch {
        console.error(data);
      }
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Erreur réseau:', e.message);
});

req.write(deployData);
req.end();
