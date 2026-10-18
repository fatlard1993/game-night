import fs from 'fs';
import os from 'os';
import path from 'path';

import { afterAll, beforeEach, describe, expect, test } from 'bun:test';

import { ValidationError } from '@vanilla-bean/components/app';

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

describe('games', () => {
	test('a game is stored with its known fields, in the file, under a generated id', async () => {
		const game = await games.create({ name: 'Uno', playersMin: '2', extra: 'dropped' });

		expect(game).toMatchObject({ name: 'Uno', playersMin: 2, links: [], files: {} });
		expect(game.extra).toBeUndefined();
		expect(JSON.parse(fs.readFileSync(dbPath, 'utf8')).games[game.id]).toEqual(game);
	});

	test('a body the fields cannot hold is refused, and a stored game keeps its name', async () => {
		await expect(games.create({})).rejects.toThrow(ValidationError);

		const { id } = await games.create({ name: 'Uno' });

		await expect(games.update({ id, update: { name: [] } })).rejects.toThrow(ValidationError);
		expect(games.read({ id }).name).toBe('Uno');
	});

	// Every plain object inherits toString and constructor, so a truthiness check treated them as
	// stored games: PATCH /api/games/toString persisted a game that was never created
	test('inherited keys are no game', async () => {
		expect(games.read({ id: 'toString' })).toBe(false);
		expect(await games.update({ id: '__proto__', update: { name: 'PHANTOM' } })).toBe(false);
		expect(await games.delete({ id: 'constructor' })).toBe(false);
		expect({}.name).toBeUndefined();
	});

	test("deleting a game deletes its files' folder too", async () => {
		const { id } = await games.create({ name: 'Uno' });
		const folder = path.join(database.filesDir, id);

		fs.mkdirSync(folder, { recursive: true });
		fs.writeFileSync(path.join(folder, 'cover'), 'x');

		expect(await games.delete({ id })).toBe(id);
		expect(fs.existsSync(folder)).toBe(false);
	});
});
