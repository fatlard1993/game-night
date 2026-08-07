import database from './database/database';
import games from './database/games';
import { storeGameFile } from './utils/gameFiles';

const STEAM_API = 'https://api.steampowered.com';

// Accepts a steamid64, a vanity name, or either form of profile url
const resolveSteamId = async (apiKey, input) => {
	const trimmed = String(input || '').trim();

	const idMatch = trimmed.match(/steamcommunity\.com\/profiles\/(\d{17})/);

	if (idMatch) return idMatch[1];

	const vanityMatch = trimmed.match(/steamcommunity\.com\/id\/([^/]+)/);
	const vanity = vanityMatch ? vanityMatch[1] : trimmed;

	if (/^\d{17}$/.test(vanity)) return vanity;

	const response = await fetch(
		`${STEAM_API}/ISteamUser/ResolveVanityURL/v1/?key=${apiKey}&vanityurl=${encodeURIComponent(vanity)}`,
	);

	if (!response.ok) throw new Error(`Steam vanity lookup failed (${response.status})`);

	const { response: result } = await response.json();

	if (result?.success !== 1) throw new Error(`Could not resolve "${vanity}" to a Steam id`);

	return result.steamid;
};

// Games waiting on their storefront pass, drained by one loop for the whole process
const pending = [];
let draining = false;

// Storefront metadata + cover art, trickled slowly, the unauthenticated store API
// rate-limits hard (~200 requests per 5 minutes)
const enrichSteamGames = async () => {
	let count = 0;

	while (pending.length > 0) {
		const game = pending.shift();

		count++;

		try {
			const coverResponse = await fetch(`https://cdn.akamai.steamstatic.com/steam/apps/${game.steamAppId}/header.jpg`);

			if (coverResponse.ok && coverResponse.headers.get('content-type')?.startsWith('image/')) {
				const buffer = Buffer.from(await coverResponse.arrayBuffer());

				await storeGameFile(game.id, buffer, { name: 'cover.jpg', contentType: 'image/jpeg' });
			}

			const detailsResponse = await fetch(`https://store.steampowered.com/api/appdetails?appids=${game.steamAppId}`);

			if (detailsResponse.ok) {
				const payload = await detailsResponse.json();
				const data = payload?.[game.steamAppId]?.data;

				// Enrichment trickles for minutes on a big import; re-read so edits made in the
				// meantime survive, filling only what's still empty and merging tags instead of replacing
				const current = data && games.read({ id: game.id });

				if (current) {
					const update = {};

					if (data.short_description && !current.description) update.description = data.short_description;

					const genreTags = (data.genres || []).map(genre => genre.description.toLowerCase());

					update.tags = [...new Set([...(current.tags || []), 'video-game', ...genreTags])];

					const categories = (data.categories || []).map(category => category.description);
					const isMultiplayer = categories.some(category => /multi-player|co-op|pvp/i.test(category));
					const playersUnset = current.playersMin === '' && current.playersMax === '';

					if (playersUnset) {
						if (isMultiplayer) update.playersMin = 1;
						else if (categories.some(category => /single-player/i.test(category))) {
							update.playersMin = 1;
							update.playersMax = 1;
						}
					}

					await games.update({ id: game.id, update });
				}

				// Marked only once the storefront actually answered, so a rate-limited or failed
				// pass is picked up again on the next boot rather than left bare forever. A game
				// the store has no data for is still marked; retrying that one never helps.
				await games.update({ id: game.id, update: { steamEnriched: true } });
			}
		} catch (error) {
			console.error(`Steam enrichment failed for ${game.name}:`, error.message);
		}

		await Bun.sleep(1600);
	}

	console.log(`Steam enrichment finished (${count} games)`);
};

// A second import arriving mid-trickle joins the queue rather than starting a rival loop and
// doubling the request rate the store API is already unhappy about. The parameter is not named
// `games`: that is the db collection at module scope, and shadowing it here would be a quiet
// trap for the next edit.
const queueEnrichment = entries => {
	pending.push(...entries);

	if (draining) return;

	draining = true;

	enrichSteamGames()
		.catch(error => console.error('Steam enrichment error', error))
		.finally(() => {
			draining = false;
		});
};

// Games whose storefront pass never completed. An import interrupted by a restart or a deploy
// leaves these behind; nothing else would ever come back for them. Returns immediately: the
// queue drains in the background for as long as it takes.
export const resumeSteamEnrichment = () => {
	const awaiting = Object.values(games.data).filter(game => game.steamAppId && !game.steamEnriched);

	if (awaiting.length === 0) return;

	console.log(`Resuming Steam enrichment for ${awaiting.length} game(s)`);

	queueEnrichment(awaiting);
};

export const importSteamLibrary = async ({ apiKey, steamId, minHours = 0 }) => {
	const resolvedId = await resolveSteamId(apiKey, steamId);

	const response = await fetch(
		`${STEAM_API}/IPlayerService/GetOwnedGames/v1/?key=${apiKey}&steamid=${resolvedId}&include_appinfo=1&include_played_free_games=1&format=json`,
	);

	if (response.status === 401 || response.status === 403) throw new Error('Steam rejected the API key');
	if (!response.ok) throw new Error(`Steam API error (${response.status})`);

	const { response: result } = await response.json();

	if (!result?.games?.length) {
		throw new Error('Steam returned no games. Is "Game details" set to Public in the profile privacy settings?');
	}

	// Remember working credentials so future imports can omit them
	database.db.data.settings ||= {};
	database.db.data.settings.steam = { apiKey, steamId: resolvedId };
	await database.write();

	const existingAppIds = new Set();
	const existingNames = new Set();

	for (const game of Object.values(games.data)) {
		if (game.steamAppId) existingAppIds.add(String(game.steamAppId));
		existingNames.add(game.name.toLowerCase());
	}

	const eligible = result.games.filter(steamGame => (steamGame.playtime_forever || 0) >= minHours * 60);
	const created = [];
	let skipped = 0;

	for (const steamGame of eligible) {
		if (existingAppIds.has(String(steamGame.appid)) || existingNames.has(steamGame.name.toLowerCase())) {
			skipped++;
			continue;
		}

		created.push(
			await games.create({
				name: steamGame.name,
				setting: 'Couch',
				tags: ['video-game'],
				links: [{ label: 'Steam', url: `https://store.steampowered.com/app/${steamGame.appid}` }],
				steamAppId: steamGame.appid,
			}),
		);
	}

	// Covers and store metadata land in the background, the library list is usable immediately
	if (created.length > 0) queueEnrichment(created);

	return { total: result.game_count, eligible: eligible.length, imported: created.length, skipped };
};

export const steamSettings = () => {
	const settings = database.db.data.settings?.steam;

	return { configured: !!settings?.apiKey, steamId: settings?.steamId || '' };
};

export const storedSteamCredentials = () => database.db.data.settings?.steam || {};
