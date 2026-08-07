import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

import database from './database/database';

const COOKIE_NAME = 'gameNightSession';
const SESSION_DAYS = 30;

const settings = () => (database.db.data.settings ||= {});

// Reading the library needs no login; everything that writes does. The password lives only as
// an argon2 hash, the signing secret only in the db file, both generated on first boot.
export const initAuth = async ({ password } = {}) => {
	const auth = (settings().auth ||= {});

	auth.secret ||= randomBytes(32).toString('hex');

	if (password) auth.passwordHash = await Bun.password.hash(password);
	else if (!auth.passwordHash) {
		const generated = randomBytes(9).toString('base64url');

		auth.passwordHash = await Bun.password.hash(generated);

		console.log(
			`\n  Admin password (needed to add or edit games): ${generated}\n` +
				'  Set your own with --password or GAME_NIGHT_PASSWORD; this one is only printed once.\n',
		);
	}

	await database.write();
};

// Tokens are signed with the password hash mixed in, so changing the password logs every
// device out instead of leaving old sessions valid
const sign = expiry => {
	const { secret, passwordHash } = settings().auth;

	return createHmac('sha256', secret).update(`${expiry}.${passwordHash}`).digest('hex');
};

const mintToken = () => {
	const expiry = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;

	return `${expiry}.${sign(expiry)}`;
};

const verifyToken = token => {
	const [expiry, signature] = String(token || '').split('.');

	if (!expiry || !signature || Number(expiry) < Date.now()) return false;

	const expected = Buffer.from(sign(Number(expiry)));
	const actual = Buffer.from(signature);

	return expected.length === actual.length && timingSafeEqual(expected, actual);
};

const readCookie = request => {
	const header = request.headers.get('cookie');

	if (!header) return null;

	for (const part of header.split(';')) {
		const [name, ...value] = part.trim().split('=');

		if (name === COOKIE_NAME) return decodeURIComponent(value.join('='));
	}

	return null;
};

export const isAdmin = request => verifyToken(readCookie(request));

export const checkPassword = async password => {
	const { passwordHash } = settings().auth;

	// A wrong-shaped body still pays the hash cost, so a bad guess and a missing field
	// take the same time from outside
	return await Bun.password.verify(String(password ?? ''), passwordHash);
};

// SameSite=Strict is what keeps another site's fetch from riding along on these cookies;
// Secure is deliberately absent, this serves plain http on a LAN
const cookie = (value, maxAge) =>
	`${COOKIE_NAME}=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}`;

export const sessionCookie = () => cookie(mintToken(), SESSION_DAYS * 24 * 60 * 60);

export const clearedCookie = () => cookie('', 0);
