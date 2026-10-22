#!/usr/bin/env bun

// Capture a README screenshot from a running instance using the system Chrome:
//   bun scripts/screenshot.js [url] [outputPath] [readySelector]

import { chromium } from 'playwright-core';

const [url = 'http://localhost:8034/games', out = '.github/screenshot.png', readySelector = '[data-game-id]'] =
	process.argv.slice(2);

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });

// Not networkidle: it never comes while the page holds a live update connection open
await page.goto(url, { waitUntil: 'load' });
await page.waitForSelector(readySelector);

// Cards skip painting off-screen (content-visibility: auto) and their covers load lazily,
// so the shot waits for the covers in view to decode and then for a painted frame
await page.evaluate(async () => {
	await document.fonts.ready;

	const inView = [...document.images].filter(image => {
		const { top, bottom } = image.getBoundingClientRect();

		return bottom > 0 && top < innerHeight;
	});

	await Promise.all(
		inView.map(async image => {
			if (!image.complete) {
				await new Promise(resolve => {
					image.addEventListener('load', resolve, { once: true });
					image.addEventListener('error', resolve, { once: true });
				});
			}

			await image.decode().catch(() => {});
		}),
	);

	await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
});

await page.screenshot({ path: out });
await browser.close();

console.log(`Saved ${out}`);
