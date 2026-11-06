import fs from 'fs';
import os from 'os';
import path from 'path';

import { afterAll, beforeEach, describe, expect, test } from 'bun:test';

import database from './database';
import games from './games';

const dbPath = path.join(os.tmpdir(), `gameNight-games-test-${process.pid}.json`);

await database.init({ path: dbPath });

afterAll(() => {
	fs.rmSync(dbPath, { force: true });
	fs.rmSync(path.join(os.tmpdir(), `gameNight-games-test-${process.pid}-files`), { recursive: true, force: true });
});

beforeEach(() => {
	database.data.games = {};
});

// The store itself is the component library's; what is ours here is the hook that follows a game out
describe('games', () => {
	test("deleting a game deletes its files' folder too", async () => {
		const { id } = await games.create({ name: 'Uno' });
		const folder = path.join(database.filesDir, id);

		fs.mkdirSync(folder, { recursive: true });
		fs.writeFileSync(path.join(folder, 'cover'), 'x');

		expect(await games.delete({ id })).toBe(id);
		expect(fs.existsSync(folder)).toBe(false);
	});
});
