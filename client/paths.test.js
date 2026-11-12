import { describe, expect, test } from 'bun:test';

import { gamePath, paths } from './paths';

describe('paths', () => {
	test('a game page is built from the game route', () => {
		expect(paths.game).toBe('/games/:id');
		expect(gamePath('abc123')).toBe('/games/abc123');
	});
});
