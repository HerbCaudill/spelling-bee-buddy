#!/usr/bin/env node
/**
 * Generate PNG icons from the SVG source icon for PWA
 * Run with: node scripts/generate-icons.mjs
 */

import sharp from "sharp"

const sizes = [192, 512]
const svgPath = "public/icon.svg"

async function generateIcons() {
  for (const size of sizes) {
    await sharp(svgPath).resize(size, size).png().toFile(`public/icon-${size}.png`)
    console.log(`Generated public/icon-${size}.png`)
  }
}

generateIcons().catch(console.error)
