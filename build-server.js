#!/usr/bin/env node
import { build } from 'esbuild';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function buildServer() {
  try {
    console.log('Building server...');
    
    await build({
      entryPoints: ['server/index.ts'],
      bundle: true,
      platform: 'node',
      target: 'node18',
      format: 'esm',
      outdir: 'dist',
      external: ['@neondatabase/serverless'],
      banner: {
        js: `import { createRequire } from 'module';const require = createRequire(import.meta.url);`
      },
      define: {
        'import.meta.dirname': '__dirname'
      }
    });

    console.log('✓ Server built successfully');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

buildServer();