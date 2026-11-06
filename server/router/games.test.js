import fs from 'fs';
import os from 'os';
import path from 'path';

import { afterAll, beforeEach, describe, expect, test } from 'bun:test';

import database from '../database/database';
import games from '../database/games';

import gamesRouter from './games';
import sessionRouter from './session';

const dbPath = path.join(os.tmpdir(), `gameNight-routes-test-${process.pid}.json`);

await database.init({ path: dbPath });

afterAll(() => {
	fs.rmSync(dbPath, { force: true });
	fs.rmSync(path.join(os.tmpdir(), `gameNight-routes-test-${process.pid}-files`), { recursive: true, force: true });
});

let game;

beforeEach(async () => {
	database.data.games = {};
	game = await games.create({ name: 'Uno' });
});

const json = (method, url, body) =>
	new Request(`http://test${url}`, {
		method,
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(body),
	});

const upload = (body, id = game.id) => gamesRouter(json('POST', `/api/games/${id}/files`, body));

const text = { name: 'rules.txt', dataUri: `data:text/plain;base64,${Buffer.from('hello').toString('base64')}` };

const filesOnDisk = () => {
	const dir = path.join(database.filesDir, game.id);

	return fs.existsSync(dir) ? fs.readdirSync(dir) : [];
};

describe('uploading a file', () => {
	test('stores the bytes and registers them on the game', async () => {
		const response = await upload(text);
		const [fileId, meta] = Object.entries((await response.json()).files)[0];

		expect(response.status).toBe(200);
		expect(meta).toEqual({ name: 'rules.txt', type: 'text/plain', size: 5 });
		expect(filesOnDisk()).toEqual([fileId]);
	});

	// A body that parses but is no object used to destructure into a TypeError, and answer 500 with a stack trace
	test('a body that is not an object is a bad request, not a server error', async () => {
		await expect(upload(null)).rejects.toMatchObject({ status: 400 });
		await expect(upload([1])).rejects.toMatchObject({ status: 400 });
	});

	test('refuses what is not a base64 data uri with a real type', async () => {
		expect((await upload({ name: 'a', dataUri: 'nope' })).status).toBe(400);
		expect((await upload({ name: 'a' })).status).toBe(400);
		expect((await upload({ name: 'a', dataUri: 'data:text/plain;base64,!!!!' })).status).toBe(400);
		expect((await upload({ name: 'a', dataUri: 'data:text/plain"x;base64,aGk=' })).status).toBe(400);
		expect(filesOnDisk()).toEqual([]);
	});

	// The bytes were written before the record refused the name, and stayed on disk with nothing listing them
	test('a name the record will not take leaves no orphan on disk', async () => {
		expect((await upload({ ...text, name: { evil: 1 } })).status).toBe(400);
		expect(filesOnDisk()).toEqual([]);
		expect(games.read({ id: game.id }).files).toEqual({});
	});

	test('a game that is gone is not found', async () => {
		expect((await upload(text, 'nope')).status).toBe(404);
	});
});

describe('logging in', () => {
	test('a body that is not an object is a bad request', async () => {
		await expect(sessionRouter(json('POST', '/api/session', null))).rejects.toMatchObject({ status: 400 });
	});
});
