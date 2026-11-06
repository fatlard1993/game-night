import { describe, expect, test } from 'bun:test';

import { COMPLEXITY_LEVELS, SETTINGS } from '../../client/Games/gameModel';

import { seed } from './seedGames';

// Fifteen hundred lines of hand-written games: the next typo in them should fail here, not on a fresh install
describe('the seed', () => {
	test('every game has a name of its own, a description, rules and a cover or none', () => {
		const names = seed.map(game => game.name.trim().toLowerCase());

		expect(new Set(names).size).toBe(seed.length);

		for (const game of seed) {
			expect(game.name).toBe(game.name.trim());
			expect(game.description).toBeTruthy();
			expect(game.rules).toBeTruthy();
			if (game.imageSource) expect(game.imageSource.url).toStartWith('https://');
		}
	});

	test('setting and complexity are values the filters know', () => {
		for (const game of seed) {
			expect(SETTINGS).toContain(game.setting);
			expect(COMPLEXITY_LEVELS).toContain(game.complexity);
		}
	});

	test('no range runs backwards', () => {
		for (const game of seed) {
			if (game.playersMin !== undefined && game.playersMax !== undefined)
				expect(game.playersMin).toBeLessThanOrEqual(game.playersMax);
			if (game.playTimeMin !== undefined && game.playTimeMax !== undefined)
				expect(game.playTimeMin).toBeLessThanOrEqual(game.playTimeMax);
		}
	});

	// The tag filter and the related-games weighting match tags exactly; 'Card game' and 'card-game' would be two shelves
	test('tags are lowercase kebab, and never repeat on one game', () => {
		for (const game of seed) {
			for (const tag of game.tags) expect(tag).toMatch(/^[\da-z]+(-[\da-z]+)*$/);
			expect(new Set(game.tags).size).toBe(game.tags.length);
		}
	});

	test('links are https, and every pinned related game exists', () => {
		const names = new Set(seed.map(game => game.name.toLowerCase()));

		for (const game of seed) {
			for (const link of game.links || []) expect(link.url).toStartWith('https://');
			for (const related of game.related || []) expect(names).toContain(related.toLowerCase());
		}
	});
});
