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

describe('uploading a file', () => {
	// A body that parses but is no object used to destructure into a TypeError, and answer 500 with a stack trace
	test('a body that is not an object is a bad request, not a server error', async () => {
		await expect(upload(null)).rejects.toMatchObject({ status: 400 });
		await expect(upload([1])).rejects.toMatchObject({ status: 400 });
	});
});

describe('logging in', () => {
	test('a body that is not an object is a bad request', async () => {
		await expect(sessionRouter(json('POST', '/api/session', null))).rejects.toMatchObject({ status: 400 });
	});
});
