#!/usr/bin/env node

/**
 * CoverizeJS Build Script
 * Combines and minifies CSS/JS files for distribution
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { transform } from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple CSS minifier
function minifyCSS(css) {
  return css
    // Remove comments
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    // Remove whitespace around special characters
    .replace(/\s*([{}:;,>+~])\s*/g, '$1')
    // Remove trailing semicolons before }
    .replace(/;}/g, '}')
    // Remove leading/trailing whitespace
    .trim();
}

// Professional JS minifier using esbuild
async function minifyJS(js) {
  try {
    const result = await transform(js, {
      minify: true,
      target: 'es2015', // Support older browsers
      format: 'iife', // Keep it as IIFE format
      keepNames: false, // Allow name mangling for smaller output
    });
    return result.code;
  } catch (error) {
    console.warn('⚠️  esbuild minification failed, falling back to original code:', error.message);
    // Fallback: return original code with just comments removed (safer than the old minifier)
    return js
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
      .replace(/\/\/.*$/gm, ''); // Remove single-line comments
  }
}

// Create dist directory
function ensureDistDir() {
  const distDir = path.join(__dirname, 'dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
  }
  return distDir;
}

// Read file with error handling
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    process.exit(1);
  }
}

// Write file with error handling
function writeFile(filePath, content) {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    const size = (content.length / 1024).toFixed(1);
    console.log(`✓ Created ${path.basename(filePath)} (${size}KB)`);
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error.message);
    process.exit(1);
  }
}

// Build process
async function build() {
  console.log('🔨 Building CoverizeJS distribution files...\n');
  
  const distDir = ensureDistDir();
  
  // Read source files
  const cssContent = readFile('coverize.css');
  const jsContent = readFile('coverize.js');
  
  // Check if texture.css exists and include it
  let textureContent = '';
  if (fs.existsSync('texture.css')) {
    textureContent = readFile('texture.css');
    console.log('📦 Including texture.css');
  }
  
  // Combine CSS files
  const combinedCSS = [
    '/*! CoverizeJS CSS - Combined Distribution */',
    cssContent,
    textureContent
  ].filter(Boolean).join('\n\n');
  
  // Add header to JS
  const combinedJS = [
    '/*! CoverizeJS - Combined Distribution */',
    jsContent
  ].join('\n\n');
  
  // Read package.json for version
  let version = '1.0.0';
  try {
    const packageJson = JSON.parse(readFile('package.json'));
    version = packageJson.version;
  } catch (error) {
    console.warn('Could not read version from package.json, using default');
  }

  // Create self-contained JS with embedded CSS
  const minifiedCSS = minifyCSS(combinedCSS);
  const escapedCSS = minifiedCSS.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
  
  const selfContainedJS = `/*!
 * CoverizeJS v${version}
 * A lightweight JavaScript library for generating book covers
 * https://github.com/aosmcleod/coverize-js
 * License: GPL-3.0
 */
(function() {
  'use strict';
  
  // Inject CSS styles
  function injectStyles() {
    var css = \`${escapedCSS}\`;
    var style = document.createElement('style');
    style.type = 'text/css';
    style.id = 'coverize-styles';
    
    // Avoid duplicate injection
    if (!document.getElementById('coverize-styles')) {
      if (style.styleSheet) {
        style.styleSheet.cssText = css; // IE8 and below
      } else {
        style.appendChild(document.createTextNode(css));
      }
      document.head.appendChild(style);
    }
  }
  
  // Inject styles immediately
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectStyles);
  } else {
    injectStyles();
  }
  
  // Main library code
  ${await minifyJS(jsContent.replace(/^\s*\/\*[\s\S]*?\*\/\s*/g, ''))}
  
})();`;

  // Create distribution files
  const files = [
    // Only the versioned standalone file
    { name: `coverize-${version}.min.js`, content: selfContainedJS }
  ];
  
  // Write all files
  files.forEach(file => {
    writeFile(path.join(distDir, file.name), file.content);
  });
  
  // Calculate savings
  const originalSize = cssContent.length + jsContent.length + textureContent.length;
  const standaloneSize = files.find(f => f.name === `coverize-${version}.min.js`).content.length;
  const savings = ((originalSize - standaloneSize) / originalSize * 100).toFixed(1);
  
  console.log(`\n📊 Build complete!`);
  console.log(`   Original: ${(originalSize / 1024).toFixed(1)}KB`);
  console.log(`   Standalone: ${(standaloneSize / 1024).toFixed(1)}KB (single file with CSS)`);
  console.log(`   Savings: ${savings}%`);
  console.log(`\n📁 Distribution files created in ./dist/`);
  console.log(`   • coverize-${version}.min.js - Standalone distributable file`);
}

// Run build
build().catch(error => {
  console.error('Build failed:', error);
  process.exit(1);
});

export { build, minifyCSS, minifyJS };
