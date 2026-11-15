import { describe, expect, test } from 'bun:test';

import { gamePath, paths, tagSearchPath } from './paths';

describe('paths', () => {
	test('a game page is built from the game route', () => {
		expect(paths.game).toBe('/games/:id');
		expect(gamePath('abc123')).toBe('/games/abc123');
	});

	test("a tag's search is the library with the tag as its filter", () => {
		expect(tagSearchPath('deck building')).toBe('/games?tag=deck+building');
	});
});
