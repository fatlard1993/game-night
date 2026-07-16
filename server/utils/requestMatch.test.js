import { describe, expect, test } from 'bun:test';

import requestMatch from './requestMatch';

const request = (method, url) => ({ method, url: `http://localhost${url}` });

describe('requestMatch', () => {
	test('matches an exact path', () => {
		expect(requestMatch('GET', '/api/games', request('GET', '/api/games'))).toEqual({});
	});

	test('rejects a different method', () => {
		expect(requestMatch('POST', '/api/games', request('GET', '/api/games'))).toBe(false);
	});

	test('rejects a different path', () => {
		expect(requestMatch('GET', '/api/games', request('GET', '/api/gamers'))).toBe(false);
	});

	test('extracts path params', () => {
		expect(requestMatch('GET', '/api/games/:id', request('GET', '/api/games/abc123'))).toEqual({ id: 'abc123' });
	});

	test('extracts multiple params', () => {
		expect(requestMatch('DELETE', '/api/games/:id/files/:fileId', request('DELETE', '/api/games/g1/files/f1'))).toEqual(
			{ id: 'g1', fileId: 'f1' },
		);
	});

	test('a param never spans path segments', () => {
		expect(requestMatch('GET', '/api/games/:id', request('GET', '/api/games/abc/files'))).toBe(false);
	});

	test('decodes param values', () => {
		expect(requestMatch('GET', '/api/games/:id', request('GET', '/api/games/a%20b'))).toEqual({ id: 'a b' });
	});

	test('includes query params in the match', () => {
		expect(requestMatch('GET', '/api/games', request('GET', '/api/games?limit=5'))).toEqual({ limit: '5' });
	});

	test('path params win over identically named query params', () => {
		expect(requestMatch('GET', '/api/games/:id', request('GET', '/api/games/real?id=fake'))).toEqual({ id: 'real' });
	});

	test('regex characters in the pattern are literal', () => {
		expect(requestMatch('GET', '/api/v1.0/games', request('GET', '/api/v1x0/games'))).toBe(false);
		expect(requestMatch('GET', '/api/v1.0/games', request('GET', '/api/v1.0/games'))).toEqual({});
	});
});
