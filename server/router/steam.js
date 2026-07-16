import { importSteamLibrary, steamSettings, storedSteamCredentials } from '../utils/steam';

import requestMatch from '../utils/requestMatch';

const steamRouter = async request => {
	let match;

	match = requestMatch('GET', '/api/steam/settings', request);
	if (match) return Response.json(steamSettings());

	match = requestMatch('POST', '/api/steam/import', request);
	if (match) {
		const body = await request.json();
		const stored = storedSteamCredentials();

		const apiKey = body.apiKey?.trim() || stored.apiKey;
		const steamId = body.steamId?.trim() || stored.steamId;

		if (!apiKey) return Response.json({ error: 'A Steam Web API key is required' }, { status: 400 });
		if (!steamId)
			return Response.json({ error: 'A Steam id, vanity name, or profile url is required' }, { status: 400 });

		try {
			const result = await importSteamLibrary({ apiKey, steamId, minHours: Number(body.minHours) || 0 });

			return Response.json(result);
		} catch (error) {
			console.error('Steam import failed:', error.message);

			return Response.json({ error: error.message }, { status: 502 });
		}
	}
};

export default steamRouter;
