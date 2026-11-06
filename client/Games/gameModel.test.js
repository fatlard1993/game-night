import { describe, expect, test } from 'bun:test';

import { MAX_UPLOAD_BYTES as SERVER_MAX_UPLOAD_BYTES } from '../../server/router/games';

import {
	MAX_UPLOAD_BYTES,
	asNumber,
	coverIcon,
	filtersFromUrl,
	filtersToQuery,
	gameMatchesFilters,
	fixLink,
	orderedRange,
	parseLinks,
	searchGames,
	serializeLinks,
	otherGameNames,
	playersLabel,
	playTimeLabel,
	relatedGames,
	tagCounts,
} from './gameModel';

// The form refuses a file by this size before reading it, and the server by the same size after; one that
// drifted would have the client send a file only to be told what it could have said itself
test("the upload limit is the server's", () => {
	expect(MAX_UPLOAD_BYTES).toBe(SERVER_MAX_UPLOAD_BYTES);
});

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
	test('fixLink adds a protocol only when missing', () => {
		expect(fixLink('example.com')).toBe('https://example.com');
		expect(fixLink('localhost:8034')).toBe('https://localhost:8034');
		expect(fixLink('http://example.com')).toBe('http://example.com');
	});

	// `https://mailto:...` is what a mail link used to become
	test('fixLink leaves mail and phone links as they are', () => {
		expect(fixLink('mailto:someone@example.com')).toBe('mailto:someone@example.com');
		expect(fixLink('tel:+15555550100')).toBe('tel:+15555550100');
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

describe('otherGameNames', () => {
	const games = {
		a: { id: 'a', name: 'Hearts' },
		b: { id: 'b', name: 'Spades' },
		c: { id: 'c', name: 'Euchre' },
	};

	test('alphabetizes every other game, excluding the given id', () => {
		expect(otherGameNames(games, 'b')).toEqual(['Euchre', 'Hearts']);
	});

	test('tolerates a missing/undefined library', () => {
		expect(otherGameNames(undefined, 'a')).toEqual([]);
	});
});

describe('orderedRange', () => {
	test('swaps a range typed backwards and leaves the rest alone', () => {
		expect(orderedRange(10, 2)).toEqual([2, 10]);
		expect(orderedRange(2, 10)).toEqual([2, 10]);
		expect(orderedRange(4, 4)).toEqual([4, 4]);
		expect(orderedRange(undefined, 2)).toEqual([undefined, 2]);
		expect(orderedRange(10, undefined)).toEqual([10, undefined]);
	});
});

describe('coverIcon', () => {
	test('the medium tag picks the icon, however the tags are ordered', () => {
		expect(coverIcon({ tags: ['party', 'no-equipment', 'card-game'] })).toBe('heart');
		expect(coverIcon({ tags: ['paper-and-pen', 'words'] })).toBe('pencil');
		expect(coverIcon({ tags: ['party'] })).toBe('puzzle-piece');
		expect(coverIcon({})).toBe('puzzle-piece');
	});
});

describe('searchGames', () => {
	const games = [
		{ id: 'a', name: 'Spoons', description: 'Grab a spoon when the pig is called', tags: ['card-game'] },
		{ id: 'b', name: 'Pig', description: 'One die, one decision', tags: ['dice-game'] },
		{ id: 'c', name: 'Yahtzee', description: 'Five dice, thirteen categories', tags: ['dice-game'] },
	];
	const names = found => found.map(game => game.name);

	test('no terms: everything, alphabetized', () => {
		expect(names(searchGames(games, {}))).toEqual(['Pig', 'Spoons', 'Yahtzee']);
		expect(names(searchGames(games))).toEqual(['Pig', 'Spoons', 'Yahtzee']);
	});

	// filter() alone answers in the order the games were added; a name match has to come first
	test('live text ranks by relevance', () => {
		expect(names(searchGames(games, { text: 'pig' }))).toEqual(['Pig', 'Spoons']);
	});

	test('chips alone alphabetize', () => {
		expect(names(searchGames(games, { chips: ['dice-game'] }))).toEqual(['Pig', 'Yahtzee']);
	});

	test('every term must match', () => {
		expect(names(searchGames(games, { chips: ['dice-game'], text: 'pig' }))).toEqual(['Pig']);
		expect(names(searchGames(games, { chips: ['card-game'], text: 'yahtzee' }))).toEqual([]);
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

	test('one open end of a player range still rules a game out', () => {
		expect(gameMatchesFilters({ ...game, playersMax: '' }, { players: 1 })).toBe(false);
		expect(gameMatchesFilters({ ...game, playersMin: '' }, { players: 9 })).toBe(false);
	});

	test('maxTime uses the shortest advertised time', () => {
		expect(gameMatchesFilters(game, { maxTime: 30 })).toBe(true);
		expect(gameMatchesFilters(game, { maxTime: 15 })).toBe(false);
	});

	test('maxComplexity is an at-or-below cutoff', () => {
		expect(gameMatchesFilters(game, { maxComplexity: 'Medium' })).toBe(true);
		expect(gameMatchesFilters(game, { maxComplexity: 'Light' })).toBe(false);
	});

	// Homemade entries and Steam imports mid-enrichment have no player count, time, or
	// complexity; excluding them made whole shelves disappear with nothing explaining why
	test('games with no data on a filtered axis are kept, not hidden', () => {
		const bare = { ...game, playersMin: '', playersMax: '', playTimeMin: '', playTimeMax: '', complexity: '' };

		expect(gameMatchesFilters(bare, { players: 4 })).toBe(true);
		expect(gameMatchesFilters(bare, { maxTime: 15 })).toBe(true);
		expect(gameMatchesFilters(bare, { maxComplexity: 'Light' })).toBe(true);
	});

	test('setting and tags still exclude on their own evidence', () => {
		const bare = { ...game, playersMin: '', playersMax: '' };

		expect(gameMatchesFilters(bare, { players: 4, setting: 'Couch' })).toBe(false);
		expect(gameMatchesFilters(bare, { players: 4, tags: ['dice-game'] })).toBe(false);
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
