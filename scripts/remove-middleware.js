#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const middlewarePath = path.join(process.cwd(), 'middleware.ts');

if (fs.existsSync(middlewarePath)) {
  try {
    fs.unlinkSync(middlewarePath);
    console.log('✓ Removed middleware.ts');
    process.exit(0);
  } catch (error) {
    console.error('✗ Error removing middleware.ts:', error.message);
    process.exit(1);
  }
} else {
  console.log('✓ middleware.ts does not exist (already clean)');
  process.exit(0);
}

