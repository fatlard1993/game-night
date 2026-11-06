import fs from 'fs';
import os from 'os';
import path from 'path';

import { afterAll, afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test';

import database from '../database/database';
import games from '../database/games';

import { storeGameFile } from './gameFiles';

const dbPath = path.join(os.tmpdir(), `gameNight-files-test-${process.pid}.json`);

await database.init({ path: dbPath });

afterAll(() => {
	fs.rmSync(dbPath, { force: true });
	fs.rmSync(path.join(os.tmpdir(), `gameNight-files-test-${process.pid}-files`), { recursive: true, force: true });
});

let game;
let update;

beforeEach(async () => {
	database.data.games = {};
	game = await games.create({ name: 'Uno' });
});

afterEach(() => update?.mockRestore());

const bytes = Buffer.from('hello');
const meta = { name: 'rules.txt', contentType: 'text/plain' };

const filesOnDisk = () => {
	const dir = path.join(database.filesDir, game.id);

	return fs.existsSync(dir) ? fs.readdirSync(dir) : [];
};

describe('storeGameFile', () => {
	test('writes the bytes and lists them on the game', async () => {
		const stored = await storeGameFile(game.id, bytes, meta);
		const [fileId, listed] = Object.entries(stored.files)[0];

		expect(listed).toEqual({ name: 'rules.txt', type: 'text/plain', size: 5 });
		expect(filesOnDisk()).toEqual([fileId]);
	});

	// The bytes land on disk before the record knows them; a record that then refuses them left a file
	// nothing listed and nothing would ever delete
	test('a record that refuses the file leaves nothing on disk', async () => {
		update = spyOn(games, 'update').mockRejectedValue(new Error('disk full'));

		await expect(storeGameFile(game.id, bytes, meta)).rejects.toThrow('disk full');
		expect(filesOnDisk()).toEqual([]);
	});

	test('a game gone between the check and the write leaves nothing on disk', async () => {
		update = spyOn(games, 'update').mockResolvedValue(false);

		expect(await storeGameFile(game.id, bytes, meta)).toBe(false);
		expect(filesOnDisk()).toEqual([]);
	});
});
