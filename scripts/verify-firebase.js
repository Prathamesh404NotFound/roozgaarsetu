#!/usr/bin/env node

import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// ANSI color codes for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

console.log('🔍 Verifying Firebase configuration...');

// Check if firebase.json exists
const firebaseJsonPath = path.join(rootDir, 'firebase.json');
if (!fs.existsSync(firebaseJsonPath)) {
  console.error(`${colors.red}❌ Error: firebase.json not found${colors.reset}`);
  process.exit(1);
}

// Read and parse firebase.json
let firebaseJson;
try {
  const firebaseJsonContent = fs.readFileSync(firebaseJsonPath, 'utf8');
  firebaseJson = JSON.parse(firebaseJsonContent);
} catch (err) {
  console.error(`${colors.red}❌ Error: Failed to parse firebase.json${colors.reset}`);
  process.exit(1);
}

// Check if hosting.public is set to "dist"
if (!firebaseJson.hosting || firebaseJson.hosting.public !== 'dist') {
  const publicDir = firebaseJson.hosting?.public || 'undefined';
  console.error(`${colors.red}❌ Error: firebase.json hosting.public is set to '${publicDir}', expected 'dist'${colors.reset}`);
  process.exit(1);
}

// Check if .firebaserc exists
const firebasercPath = path.join(rootDir, '.firebaserc');
if (!fs.existsSync(firebasercPath)) {
  console.error(`${colors.red}❌ Error: .firebaserc not found${colors.reset}`);
  process.exit(1);
}

// Read and parse .firebaserc
let firebaserc;
try {
  const firebasercContent = fs.readFileSync(firebasercPath, 'utf8');
  firebaserc = JSON.parse(firebasercContent);
} catch (err) {
  console.error(`${colors.red}❌ Error: Failed to parse .firebaserc${colors.reset}`);
  process.exit(1);
}

// Check if projects.default matches "roozgaarsetu"
if (!firebaserc.projects || firebaserc.projects.default !== 'roozgaarsetu') {
  const defaultProject = firebaserc.projects?.default || 'undefined';
  console.error(`${colors.red}❌ Error: .firebaserc projects.default is set to '${defaultProject}', expected 'roozgaarsetu'${colors.reset}`);
  process.exit(1);
}

// Check if Firebase CLI is authenticated
try {
  execSync('firebase projects:list', { stdio: 'pipe' });
} catch (err) {
  console.error(`${colors.red}❌ Error: Firebase CLI is not authenticated. Run 'firebase login' first.${colors.reset}`);
  process.exit(1);
}

console.log(`${colors.green}✅ Firebase configuration verified successfully${colors.reset}`);
console.log(`${colors.green}   - firebase.json exists with hosting.public = 'dist'${colors.reset}`);
console.log(`${colors.green}   - .firebaserc exists with projects.default = 'roozgaarsetu'${colors.reset}`);
console.log(`${colors.green}   - Firebase CLI is authenticated${colors.reset}`);
