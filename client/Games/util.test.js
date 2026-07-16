import { describe, expect, test } from 'bun:test';

import {
	asNumber,
	filtersFromUrl,
	filtersToQuery,
	gameMatchesFilters,
	isLink,
	fixLink,
	parseLinks,
	serializeLinks,
	parseRelated,
	serializeRelated,
	playersLabel,
	playTimeLabel,
	relatedGames,
	tagCounts,
} from './util';

describe('asNumber', () => {
	test('parses numeric strings', () => {
		expect(asNumber('4')).toBe(4);
		expect(asNumber(0)).toBe(0);
	});

	test('treats blank and non-numeric as unset', () => {
		expect(asNumber('')).toBeUndefined();
		expect(asNumber(null)).toBeUndefined();
		expect(asNumber('abc')).toBeUndefined();
	});
});

describe('links', () => {
	test('isLink accepts domains and localhost', () => {
		expect(isLink('https://example.com/page')).toBe(true);
		expect(isLink('example.com')).toBe(true);
		expect(isLink('localhost:8034')).toBe(true);
		expect(isLink('not a url')).toBe(false);
	});

	test('fixLink adds a protocol only when missing', () => {
		expect(fixLink('example.com')).toBe('https://example.com');
		expect(fixLink('http://example.com')).toBe('http://example.com');
	});

	test('parse/serialize round-trips labeled and bare links', () => {
		const text = 'Wikipedia | https://en.wikipedia.org/wiki/Yahtzee\nhttps://example.com';
		const links = parseLinks(text);

		expect(links).toEqual([
			{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Yahtzee' },
			{ label: 'https://example.com', url: 'https://example.com' },
		]);
		expect(serializeLinks(links)).toBe(text);
	});

	test('parseLinks keeps pipes inside the url', () => {
		expect(parseLinks('Label | https://example.com/a|b')).toEqual([{ label: 'Label', url: 'https://example.com/a|b' }]);
	});

	test('parseLinks skips blank lines and serializeLinks tolerates non-arrays', () => {
		expect(parseLinks('\n\n')).toEqual([]);
		expect(serializeLinks(undefined)).toBe('');
	});
});

describe('related', () => {
	test('parse/serialize round-trips names', () => {
		expect(parseRelated(' Hearts \n\nSpades\n')).toEqual(['Hearts', 'Spades']);
		expect(serializeRelated(['Hearts', 'Spades'])).toBe('Hearts\nSpades');
	});
});

describe('labels', () => {
	test('playersLabel formats ranges, single values, and pluralization', () => {
		expect(playersLabel({ playersMin: 2, playersMax: 6 })).toBe('2-6 players');
		expect(playersLabel({ playersMin: 1, playersMax: 1 })).toBe('1 player');
		expect(playersLabel({ playersMin: '', playersMax: '' })).toBe('');
	});

	test('playTimeLabel handles open-ended ranges', () => {
		expect(playTimeLabel({ playTimeMin: 30, playTimeMax: '' })).toBe('30 min');
		expect(playTimeLabel({ playTimeMin: '', playTimeMax: 45 })).toBe('45 min');
	});
});

describe('gameMatchesFilters', () => {
	const game = {
		setting: 'Table',
		complexity: 'Medium',
		playersMin: 2,
		playersMax: 6,
		playTimeMin: 30,
		playTimeMax: 60,
		tags: ['card-game', 'bluffing'],
	};

	test('no filters matches everything', () => {
		expect(gameMatchesFilters(game)).toBe(true);
	});

	test('players must fall inside the range', () => {
		expect(gameMatchesFilters(game, { players: 4 })).toBe(true);
		expect(gameMatchesFilters(game, { players: 7 })).toBe(false);
	});

	test('a players filter excludes games with no player data', () => {
		expect(gameMatchesFilters({ ...game, playersMin: '', playersMax: '' }, { players: 4 })).toBe(false);
	});

	test('maxTime uses the shortest advertised time', () => {
		expect(gameMatchesFilters(game, { maxTime: 30 })).toBe(true);
		expect(gameMatchesFilters(game, { maxTime: 15 })).toBe(false);
	});

	test('maxComplexity is an at-or-below cutoff and unrated games are excluded', () => {
		expect(gameMatchesFilters(game, { maxComplexity: 'Medium' })).toBe(true);
		expect(gameMatchesFilters(game, { maxComplexity: 'Light' })).toBe(false);
		expect(gameMatchesFilters({ ...game, complexity: '' }, { maxComplexity: 'Heavy' })).toBe(false);
	});

	test('tags are OR semantics', () => {
		expect(gameMatchesFilters(game, { tags: ['bluffing', 'dice-game'] })).toBe(true);
		expect(gameMatchesFilters(game, { tags: ['dice-game'] })).toBe(false);
	});

	test('setting is an exact match', () => {
		expect(gameMatchesFilters(game, { setting: 'Couch' })).toBe(false);
	});
});

describe('filter state <-> URL query', () => {
	test('round-trips every filter', () => {
		const filters = {
			search: { text: 'trick', chips: ['co-op', 'two words'] },
			setting: 'Table',
			players: '4',
			maxTime: '60',
			maxComplexity: 'Medium',
			tags: ['card-game', 'bluffing'],
		};

		expect(filtersFromUrl(filtersToQuery(filters))).toEqual(filters);
	});

	test('empty filters produce an empty query', () => {
		expect(filtersToQuery({})).toBe('');
		expect(filtersFromUrl('')).toEqual({
			search: { text: '', chips: [] },
			setting: '',
			players: '',
			maxTime: '',
			maxComplexity: '',
			tags: [],
		});
	});
});

describe('tagCounts', () => {
	test('counts tags across the library', () => {
		const games = {
			a: { tags: ['card-game', 'bluffing'] },
			b: { tags: ['card-game'] },
			c: {},
		};

		expect(tagCounts(games)).toEqual({ 'card-game': 2, bluffing: 1 });
	});
});

describe('relatedGames', () => {
	const library = {
		a: { id: 'a', name: 'Hearts', tags: ['trick-taking', 'card-game'] },
		b: { id: 'b', name: 'Spades', tags: ['trick-taking', 'card-game'] },
		c: { id: 'c', name: 'Yahtzee', tags: ['dice-game'] },
		d: { id: 'd', name: 'Euchre', tags: ['card-game'] },
	};

	test('manual names come first, then weighted tag overlap', () => {
		const related = relatedGames({ ...library.a, related: ['yahtzee'] }, library);

		expect(related.map(game => game.name)).toEqual(['Yahtzee', 'Spades', 'Euchre']);
	});

	test('rarer shared tags outweigh common ones', () => {
		const games = {
			x: { id: 'x', name: 'X', tags: ['common', 'rare'] },
			y: { id: 'y', name: 'Y', tags: ['rare'] },
			z: { id: 'z', name: 'Z', tags: ['common'] },
			w: { id: 'w', name: 'W', tags: ['common'] },
		};

		expect(relatedGames(games.x, games).map(game => game.name)).toEqual(['Y', 'Z', 'W']);
	});

	test('games with no overlap are excluded and the limit applies', () => {
		expect(relatedGames(library.c, library, 1)).toEqual([]);
		expect(relatedGames(library.a, library, 1).map(game => game.name)).toEqual(['Spades']);
	});
});
