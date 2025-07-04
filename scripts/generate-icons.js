#!/usr/bin/env node

/**
 * Icon Generation Script for Tauri App
 * 
 * This script provides instructions for generating the required icon files
 * for the Tauri application. You'll need to create these icons manually
 * or use online tools to convert the SVG to the required formats.
 */

const fs = require('fs');
const path = require('path');

const iconSizes = [
  { size: '32x32', format: 'png' },
  { size: '128x128', format: 'png' },
  { size: '128x128@2x', format: 'png' },
  { size: 'icon', format: 'ico' },
  { size: 'icon', format: 'icns' },
];

const iconsDir = path.join(__dirname, '..', 'src-tauri', 'icons');

console.log('🎨 Tauri Icon Generation Guide');
console.log('================================');
console.log('');
console.log('Required icon files for Tauri application:');
console.log('');

iconSizes.forEach(({ size, format }) => {
  const filename = `${size}.${format}`;
  const filepath = path.join(iconsDir, filename);
  
  console.log(`📁 ${filename}`);
  
  if (format === 'png') {
    const dimensions = size.includes('@2x') 
      ? size.replace('@2x', '').split('x').map(n => parseInt(n) * 2).join('x')
      : size;
    console.log(`   Size: ${dimensions} pixels`);
  } else if (format === 'ico') {
    console.log('   Size: 16x16, 32x32, 48x48, 256x256 (multi-size ICO)');
  } else if (format === 'icns') {
    console.log('   Size: Multiple sizes for macOS (16x16 to 1024x1024)');
  }
  
  console.log(`   Path: ${filepath}`);
  console.log('');
});

console.log('🛠️  How to generate icons:');
console.log('');
console.log('1. **Online Tools (Recommended)**:');
console.log('   - https://realfavicongenerator.net/');
console.log('   - https://www.icoconverter.com/');
console.log('   - https://iconverticons.com/');
console.log('');
console.log('2. **Command Line Tools**:');
console.log('   - ImageMagick: convert icon.svg -resize 32x32 32x32.png');
console.log('   - Inkscape: inkscape -w 32 -h 32 icon.svg -o 32x32.png');
console.log('');
console.log('3. **Design Tools**:');
console.log('   - Export from Figma, Sketch, or Adobe Illustrator');
console.log('   - Use the SVG file in src-tauri/icons/icon.svg as source');
console.log('');
console.log('📝 Steps:');
console.log('1. Use the icon.svg file as your source');
console.log('2. Generate all required sizes and formats');
console.log('3. Place them in the src-tauri/icons/ directory');
console.log('4. Run "npm run tauri:dev" to test');
console.log('');
console.log('✨ The SVG icon is already created at:');
console.log(`   ${path.join(iconsDir, 'icon.svg')}`);