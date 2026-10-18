import { describe, expect, test } from 'bun:test';

import { ValidationError, normalizeFields, validateFields } from '@vanilla-bean/components/app';

import { fileMap, linkArray } from './fieldTypes';

const spec = normalizeFields({
	name: { type: 'string', required: true },
	playersMin: { type: 'number' },
	tags: { type: 'stringArray' },
	links: { type: linkArray },
	files: { type: fileMap },
	steamEnriched: { type: 'boolean' },
});

describe("a game's fields", () => {
	// Each type supplies its own unset value, so a container field arrives as a container
	test('known fields kept, the rest defaulted to their own kind of empty', () => {
		expect(validateFields(spec, { name: 'Uno', nope: 'ignored' })).toEqual({
			name: 'Uno',
			playersMin: '',
			tags: [],
			links: [],
			files: {},
			steamEnriched: false,
		});
	});

	// A game whose name was an object used to be stored as given, and the library grid then died
	// on name.localeCompare for everyone until the json was hand-edited
	test('containers are refused where text belongs', () => {
		expect(() => validateFields(spec, { name: { evil: 1 } })).toThrow(ValidationError);
		expect(() => validateFields(spec, { name: ['a'] })).toThrow(ValidationError);
	});

	test('links and files are checked inside, not just their outer shape', () => {
		expect(validateFields(spec, { name: 'a', links: [{ url: 'https://x.test' }] }).links).toEqual([
			{ label: '', url: 'https://x.test' },
		]);
		expect(validateFields(spec, { name: 'a', files: { f1: { name: 'r.pdf', size: '12' } } }).files).toEqual({
			f1: { name: 'r.pdf', type: '', size: 12 },
		});
		expect(() => validateFields(spec, { name: 'a', links: 'not-a-list' })).toThrow(ValidationError);
		expect(() => validateFields(spec, { name: 'a', links: [{ url: {} }] })).toThrow(ValidationError);
		expect(() => validateFields(spec, { name: 'a', files: { id: 'not-metadata' } })).toThrow(ValidationError);
		expect(() => validateFields(spec, { name: 'a', files: [] })).toThrow(/files/);
	});

	test('the empty link list and file map are fresh each time', () => {
		const first = validateFields(spec, { name: 'One' });

		first.links.push({ label: 'mine', url: '' });
		first.files.mine = {};

		expect(validateFields(spec, { name: 'Two' })).toMatchObject({ links: [], files: {} });
	});
});
