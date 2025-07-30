#!/usr/bin/env node

/**
 * CoverizeJS Release Script
 * Prepares release files and updates version
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function updateVersion(type = 'patch') {
  const packagePath = path.join(__dirname, 'package.json');
  const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  const [major, minor, patch] = packageData.version.split('.').map(Number);
  
  let newVersion;
  switch (type) {
    case 'major':
      newVersion = `${major + 1}.0.0`;
      break;
    case 'minor':
      newVersion = `${major}.${minor + 1}.0`;
      break;
    case 'patch':
    default:
      newVersion = `${major}.${minor}.${patch + 1}`;
      break;
  }
  
  packageData.version = newVersion;
  fs.writeFileSync(packagePath, JSON.stringify(packageData, null, 2) + '\n');
  
  return newVersion;
}

function createReleaseNotes(version) {
  const date = new Date().toISOString().split('T')[0];
  const notesPath = path.join(__dirname, 'CHANGELOG.md');
  
  let changelog = '';
  if (fs.existsSync(notesPath)) {
    changelog = fs.readFileSync(notesPath, 'utf8');
  } else {
    changelog = '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n';
  }
  
  const newEntry = `## [${version}] - ${date}

### Added
- Release build with minified distribution files

### Changed
- Updated build process

### Fixed
- Minor bug fixes and improvements

`;
  
  // Insert new entry after the header
  const lines = changelog.split('\n');
  const headerIndex = lines.findIndex(line => line.startsWith('# Changelog'));
  if (headerIndex !== -1) {
    lines.splice(headerIndex + 3, 0, newEntry);
  } else {
    lines.unshift(newEntry);
  }
  
  fs.writeFileSync(notesPath, lines.join('\n'));
  return notesPath;
}

function release() {
  const args = process.argv.slice(2);
  const versionType = args[0] || 'patch';
  
  if (!['major', 'minor', 'patch'].includes(versionType)) {
    console.error('Usage: npm run release [major|minor|patch]');
    process.exit(1);
  }
  
  console.log(`🚀 Creating ${versionType} release...\n`);
  
  // Build distribution files
  console.log('📦 Building distribution files...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // Update version
  const newVersion = updateVersion(versionType);
  console.log(`📝 Updated version to ${newVersion}`);
  
  // Create changelog entry
  const changelogPath = createReleaseNotes(newVersion);
  console.log(`📋 Updated ${path.basename(changelogPath)}`);
  
  // Create release assets
  const distFiles = fs.readdirSync(path.join(__dirname, 'dist'));
  console.log(`\n📁 Release assets created:`);
  distFiles.forEach(file => {
    const filePath = path.join(__dirname, 'dist', file);
    const size = (fs.statSync(filePath).size / 1024).toFixed(1);
    console.log(`   • ${file} (${size}KB)`);
  });
  
  console.log(`\n✅ Release ${newVersion} ready!`);
  console.log(`\nNext steps:`);
  console.log(`1. Review changes in CHANGELOG.md`);
  console.log(`2. Commit changes: git add . && git commit -m "Release v${newVersion}"`);
  console.log(`3. Create tag: git tag v${newVersion}`);
  console.log(`4. Push: git push origin main --tags`);
  console.log(`5. Create GitHub release with dist/ files`);
}

release();
