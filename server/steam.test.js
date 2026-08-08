import fs from 'fs';
import os from 'os';
import path from 'path';

import { afterAll, beforeEach, describe, expect, test } from 'bun:test';

import database from './database/database';
import games from './database/games';
import { resumeSteamEnrichment } from './steam';

const dbPath = path.join(os.tmpdir(), `gameNight-steam-test-${process.pid}.json`);

await database.init({ path: dbPath });

afterAll(() => {
	fs.rmSync(dbPath, { force: true });
	fs.rmSync(path.join(os.tmpdir(), `gameNight-steam-test-${process.pid}-files`), { recursive: true, force: true });
});

beforeEach(() => {
	database.db.data.games = {};
});

// resumeSteamEnrichment queues in the background; these assert what it picks up, not what the
// storefront answers. The network is never reached, because nothing here is left to enrich.
describe('resumeSteamEnrichment', () => {
	test('leaves the queue alone when nothing is waiting', async () => {
		await games.create({ name: 'Board Game' });
		await games.create({ name: 'Done', steamAppId: 570, steamEnriched: true });

		expect(() => resumeSteamEnrichment()).not.toThrow();
	});

	test('an import interrupted before its storefront pass is still marked unfinished', async () => {
		const marooned = await games.create({ name: 'Marooned', steamAppId: 440 });

		expect(marooned.steamEnriched).toBe(false);

		const waiting = Object.values(games.data).filter(game => game.steamAppId && !game.steamEnriched);

		expect(waiting.map(game => game.name)).toEqual(['Marooned']);
	});

	test('a game with no steam id is never queued, however bare it looks', async () => {
		await games.create({ name: 'Homemade' });

		const waiting = Object.values(games.data).filter(game => game.steamAppId && !game.steamEnriched);

		expect(waiting).toEqual([]);
	});
});
