import { storeGameFile } from './gameFiles';

// Wikimedia's UA policy throttles by User-Agent: a contact address gets served, a bare project URL
// gets 429'd after a handful of requests. Keep the email here or covers silently stop landing.
const UA = { 'User-Agent': 'game-night-seed/1.0 (justfatlard@gmail.com)' };

// Fetch with a couple of backoff retries when the CDN rate-limits (429) or the connection blips.
const fetchWithRetry = async (url, attempts = 3) => {
	for (let attempt = 0; attempt < attempts; attempt++) {
		try {
			const response = await fetch(url, { headers: UA });

			if (response.status !== 429) return response;
		} catch (error) {
			if (attempt === attempts - 1) throw error;
		}

		await Bun.sleep(2000 * (attempt + 1));
	}

	return fetch(url, { headers: UA });
};

// Fetch, downscale, and store a cover for each seeded game carrying an imageSource url. Runs in the
// background after seeding so startup never waits on the network; a fresh install with no network
// keeps its fallback icons.
export const fetchSeedCovers = async items => {
	let stored = 0;
	let skipped = 0;

	for (const { id, source } of items) {
		try {
			const response = await fetchWithRetry(source.url);
			const contentType = response.headers.get('content-type')?.split(';')[0];

			if (!response.ok || !contentType?.startsWith('image/')) {
				console.warn(`Seed cover skipped for ${id}: HTTP ${response.status} ${contentType || ''}`);
				skipped++;
				continue;
			}

			const buffer = Buffer.from(await response.arrayBuffer());

			await storeGameFile(id, buffer, { name: `cover.${contentType.split('/')[1]}`, contentType });

			stored++;
		} catch (error) {
			console.error(`Seed cover failed for ${id}:`, error.message);
			skipped++;
		}

		await Bun.sleep(400); // space out requests so the CDN doesn't rate-limit the burst
	}

	console.log(`Seeded ${stored} covers${skipped ? ` (${skipped} skipped)` : ''}`);
};
