#!/usr/bin/env bun

// Capture a README screenshot from a running instance using the system Chrome:
//   bun scripts/screenshot.js [url] [outputPath]

import { chromium } from 'playwright-core';

const [url = 'http://localhost:8034/games', out = '.github/screenshot.png'] = process.argv.slice(2);

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });

await page.goto(url, { waitUntil: 'networkidle' });

// Fonts and the icon set land after networkidle; lazy images need a beat to decode
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1200);

await page.screenshot({ path: out });
await browser.close();

console.log(`Saved ${out}`);
