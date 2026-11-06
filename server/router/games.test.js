import fs from 'fs';
import os from 'os';
import path from 'path';

import { afterAll, beforeEach, describe, expect, spyOn, test } from 'bun:test';

import { initAuth } from '../auth';
import database from '../database/database';
import games from '../database/games';

import gamesRouter from './games';
import sessionRouter from './session';

const dbPath = path.join(os.tmpdir(), `gameNight-routes-test-${process.pid}.json`);

await database.init({ path: dbPath });
await initAuth({ password: 'correct horse' });

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

describe('serving a file', () => {
	const stored = async name => {
		const response = await upload({ ...text, name });
		const [fileId] = Object.keys((await response.json()).files);

		return gamesRouter(new Request(`http://test/api/games/${game.id}/files/${fileId}`));
	};

	// filename="" holds an ASCII stand-in; the real name, spaces and quotes and all, travels in filename*
	test('names the download as it was uploaded', async () => {
		const response = await stored('house rules "final".txt');
		const disposition = response.headers.get('content-disposition');

		expect(disposition).toStartWith('inline; filename="house rules _final_.txt"');
		expect(disposition).toContain(`filename*=UTF-8''house%20rules%20%22final%22.txt`);
		expect(response.headers.get('x-content-type-options')).toBe('nosniff');
		expect(await response.text()).toBe('hello');
	});

	test('answers 404 for a file the game does not list, whoever asks', async () => {
		expect((await gamesRouter(new Request(`http://test/api/games/${game.id}/files/missing`))).status).toBe(404);
		expect((await gamesRouter(new Request(`http://test/api/games/toString/files/x`))).status).toBe(404);
	});
});

describe('logging in', () => {
	test('a body that is not an object is a bad request', async () => {
		await expect(sessionRouter(json('POST', '/api/session', null))).rejects.toMatchObject({ status: 400 });
	});

	// Without the let-go, someone who fumbled the password a few times waited the full penalty on every try
	// for the rest of the process
	test('wrong guesses wait longer each time, until a quiet quarter hour forgives them', async () => {
		const server = { requestIP: () => ({ address: '10.0.0.7' }) };
		const sleep = spyOn(Bun, 'sleep').mockResolvedValue();
		const now = spyOn(Date, 'now');
		const guess = () => sessionRouter(json('POST', '/api/session', { password: 'wrong' }), server);

		try {
			now.mockReturnValue(1_000_000);
			expect((await guess()).status).toBe(401);
			expect((await guess()).status).toBe(401);
			expect((await guess()).status).toBe(401);
			expect(sleep.mock.calls.map(([ms]) => ms)).toEqual([0, 250, 750]);

			now.mockReturnValue(1_000_000 + 16 * 60 * 1000);
			await guess();
			expect(sleep.mock.calls.at(-1)).toEqual([0]);
		} finally {
			sleep.mockRestore();
			now.mockRestore();
		}
	});
});
