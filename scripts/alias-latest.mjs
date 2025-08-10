#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync } from 'fs';

// Read environment variables
const token = process.env.VERCEL_TOKEN;
const scope = process.env.VERCEL_SCOPE;

if (!token) {
  console.error('❌ VERCEL_TOKEN environment variable is required');
  console.error('Set it with: export VERCEL_TOKEN=your_token_here');
  process.exit(1);
}

console.log('🔍 Finding latest production deployment...\n');

try {
  // Get latest production deployment
  const scopeFlag = scope ? `--scope ${scope}` : '';
  const command = `npx vercel list --prod --json --token ${token} ${scopeFlag}`;
  
  console.log(`Running: ${command}\n`);
  
  const output = execSync(command, { encoding: 'utf8' });
  const deployments = JSON.parse(output);
  
  if (!deployments || deployments.length === 0) {
    throw new Error('No deployments found');
  }
  
  // Get the latest deployment (first in the list)
  const latest = deployments[0];
  const deploymentUrl = latest.url;
  
  console.log('✅ Latest production deployment found:');
  console.log(`   URL: ${deploymentUrl}`);
  console.log(`   Created: ${new Date(latest.created).toISOString()}`);
  console.log(`   State: ${latest.state}\n`);
  
  console.log('🚀 Run these commands to alias both domains:');
  console.log(`   npx vercel alias set ${deploymentUrl} www.gradeidea.cc --token $VERCEL_TOKEN`);
  console.log(`   npx vercel alias set ${deploymentUrl} gradeidea.cc --token $VERCEL_TOKEN\n`);
  
  console.log('📋 Or copy-paste this block:');
  console.log('```bash');
  console.log(`npx vercel alias set ${deploymentUrl} www.gradeidea.cc --token $VERCEL_TOKEN`);
  console.log(`npx vercel alias set ${deploymentUrl} gradeidea.cc --token $VERCEL_TOKEN`);
  console.log('```\n');
  
} catch (error) {
  console.error('❌ Failed to get deployments automatically');
  console.error('Error:', error.message);
  console.log('\n📋 Manual fallback instructions:');
  console.log('1. Go to Vercel Dashboard → Your Project → Deployments');
  console.log('2. Copy the .vercel.app URL from the latest Production deployment');
  console.log('3. Replace PLACEHOLDER_URL below with your actual deployment URL:');
  console.log('\n   npx vercel alias set PLACEHOLDER_URL www.gradeidea.cc --token $VERCEL_TOKEN');
  console.log('   npx vercel alias set PLACEHOLDER_URL gradeidea.cc --token $VERCEL_TOKEN\n');
}
