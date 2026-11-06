import fs from 'fs';
import os from 'os';
import path from 'path';

import { afterAll, beforeEach, describe, expect, test } from 'bun:test';

import database from './database/database';
import games from './database/games';
import { awaitingEnrichment } from './steam';

const dbPath = path.join(os.tmpdir(), `gameNight-steam-test-${process.pid}.json`);

await database.init({ path: dbPath });

afterAll(() => {
	fs.rmSync(dbPath, { force: true });
	fs.rmSync(path.join(os.tmpdir(), `gameNight-steam-test-${process.pid}-files`), { recursive: true, force: true });
});

beforeEach(() => {
	database.db.data.games = {};
});

// What resumeSteamEnrichment queues on boot, asserted without the queue: the pass itself reaches the storefront
describe('awaitingEnrichment', () => {
	test('an import interrupted before its storefront pass is picked up', async () => {
		await games.create({ name: 'Board Game' });
		await games.create({ name: 'Done', steamAppId: 570, steamEnriched: true });
		const marooned = await games.create({ name: 'Marooned', steamAppId: 440 });

		expect(awaitingEnrichment().map(game => game.id)).toEqual([marooned.id]);
	});

	test('a game with no steam id is never queued, however bare it looks', async () => {
		await games.create({ name: 'Homemade' });
		await games.create({ name: 'Also homemade', steamEnriched: false });

		expect(awaitingEnrichment()).toEqual([]);
	});
});
