#!/usr/bin/env node

import { execSync } from 'child_process';
import { copyFileSync, existsSync, mkdirSync } from 'fs';

console.log('🚀 Building optimized production server for deployment...');

try {
  // Create dist directory
  if (!existsSync('dist')) {
    mkdirSync('dist', { recursive: true });
  }

  // Build client first
  console.log('📦 Building client application...');
  execSync('npx vite build', { stdio: 'inherit' });

  // Build optimized production server
  console.log('🔧 Building production server...');
  execSync('npx esbuild server/production.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/index.js --define:process.env.NODE_ENV=\\"production\\"', { stdio: 'inherit' });

  console.log('✅ Production build completed successfully!');
  console.log('🎯 Server optimized for deployment health checks');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}