import fs from 'fs';
import os from 'os';
import path from 'path';

import { afterAll, describe, expect, test } from 'bun:test';

import { checkPassword, clearedCookie, initAuth, isAdmin, sessionCookie } from './auth';
import database from './database/database';

const dbPath = path.join(os.tmpdir(), `gameNight-auth-test-${process.pid}.json`);

await database.init({ path: dbPath });
await initAuth({ password: 'correct horse' });

afterAll(() => {
	fs.rmSync(dbPath, { force: true });
	fs.rmSync(path.join(os.tmpdir(), `gameNight-auth-test-${process.pid}-files`), { recursive: true, force: true });
});

const cookieValue = header => header.split(';')[0].split('=').slice(1).join('=');

// The test preload registers happy-dom, whose Request drops a cookie header on the way in (the
// fetch spec forbids scripts from setting one). Building the shape isAdmin actually reads keeps
// these tests testing the signature check rather than the absence of a header, which every
// negative case here would otherwise pass without running any of it.
const requestWith = value => ({ headers: { get: name => (name === 'cookie' ? `gameNightSession=${value}` : null) } });

const requestWithoutCookie = { headers: { get: () => null } };

describe('the stored password', () => {
	test('is never written to the db in the clear', () => {
		expect(JSON.stringify(database.db.data.settings.auth)).not.toContain('correct horse');
	});

	test('accepts the real password and nothing else', async () => {
		expect(await checkPassword('correct horse')).toBe(true);
		expect(await checkPassword('correct horse ')).toBe(false);
		expect(await checkPassword('')).toBe(false);
		expect(await checkPassword(undefined)).toBe(false);
		expect(await checkPassword({})).toBe(false);
	});
});

describe('the session cookie', () => {
	test('is accepted on the way back in', () => {
		expect(isAdmin(requestWith(cookieValue(sessionCookie())))).toBe(true);
	});

	test('cannot be read by scripts or sent by another site', () => {
		expect(sessionCookie()).toContain('HttpOnly');
		expect(sessionCookie()).toContain('SameSite=Strict');
	});

	test('means nothing without a signature that checks out', () => {
		const [expiry, signature] = cookieValue(sessionCookie()).split('.');

		expect(isAdmin(requestWith(`${expiry}.${'0'.repeat(signature.length)}`))).toBe(false);
		expect(isAdmin(requestWith(`${Number(expiry) + 1000}.${signature}`))).toBe(false);
		expect(isAdmin(requestWith(expiry))).toBe(false);
		expect(isAdmin(requestWith(''))).toBe(false);
	});

	test('is not accepted once its expiry has passed', () => {
		const past = Date.now() - 1000;

		expect(isAdmin(requestWith(`${past}.anything`))).toBe(false);
	});

	test('is absent from a request that carries no cookie', () => {
		expect(isAdmin(requestWithoutCookie)).toBe(false);
	});

	test('is found among the other cookies a browser sends', () => {
		const token = cookieValue(sessionCookie());
		const mixed = { headers: { get: () => `theme=dark; gameNightSession=${token}; other=1` } };

		expect(isAdmin(mixed)).toBe(true);
	});

	test('logging out sends back a cookie that expires immediately', () => {
		expect(clearedCookie()).toContain('Max-Age=0');
	});

	// The signature mixes in the password hash, so the household doesn't stay logged in on a
	// password the owner has since changed
	test('stops working when the password changes', async () => {
		const before = cookieValue(sessionCookie());

		await initAuth({ password: 'a new one' });

		expect(isAdmin(requestWith(before))).toBe(false);
		expect(isAdmin(requestWith(cookieValue(sessionCookie())))).toBe(true);
	});
});
