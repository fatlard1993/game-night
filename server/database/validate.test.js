import { describe, expect, test } from 'bun:test';

import { isSafeKey, validateFields, ValidationError } from './validate';

const spec = {
	name: { type: 'string', required: true },
	description: { type: 'string' },
	playersMin: { type: 'number' },
	tags: { type: 'stringArray' },
	links: { type: 'linkArray' },
	files: { type: 'fileMap' },
	steamEnriched: { type: 'boolean' },
};

describe('validateFields', () => {
	// Each type supplies its own unset value, so a container field arrives as a container
	test('keeps known fields and defaults the rest to their own kind of empty', () => {
		expect(validateFields(spec, { name: 'Uno', nope: 'ignored' })).toEqual({
			name: 'Uno',
			description: '',
			playersMin: '',
			tags: [],
			links: [],
			files: {},
			steamEnriched: false,
		});
	});

	test('the empty containers are fresh each time, not one shared instance', () => {
		const first = validateFields(spec, { name: 'One' });
		const second = validateFields(spec, { name: 'Two' });

		first.tags.push('mine');

		expect(second.tags).toEqual([]);
	});

	test('a partial update leaves absent fields out entirely', () => {
		expect(validateFields(spec, { description: 'new' }, { partial: true })).toEqual({ description: 'new' });
	});

	// A game whose name was an object used to be stored as given, and the library grid then died
	// on name.localeCompare for everyone until the json was hand-edited
	test('rejects containers where text belongs', () => {
		expect(() => validateFields(spec, { name: { evil: 1 } })).toThrow(ValidationError);
		expect(() => validateFields(spec, { name: ['a'] })).toThrow(ValidationError);
		expect(() => validateFields(spec, { name: true })).toThrow(ValidationError);
	});

	test('accepts a number where text belongs, since it renders the same', () => {
		expect(validateFields(spec, { name: 7 }).name).toBe('7');
	});

	test('numbers accept the empty string the db uses for unset', () => {
		expect(validateFields(spec, { name: 'a', playersMin: '' }).playersMin).toBe('');
		expect(validateFields(spec, { name: 'a', playersMin: '4' }).playersMin).toBe(4);
		expect(() => validateFields(spec, { name: 'a', playersMin: 'lots' })).toThrow(ValidationError);
	});

	test('requires a name on create but not on update', () => {
		expect(() => validateFields(spec, {})).toThrow(ValidationError);
		expect(() => validateFields(spec, { name: '' })).toThrow(ValidationError);
		expect(validateFields(spec, {}, { partial: true })).toEqual({});
	});

	test('checks inside lists and maps, not just their outer shape', () => {
		expect(validateFields(spec, { name: 'a', tags: ['ok'] }).tags).toEqual(['ok']);
		expect(() => validateFields(spec, { name: 'a', tags: 'not-a-list' })).toThrow(ValidationError);
		expect(() => validateFields(spec, { name: 'a', tags: [{}] })).toThrow(ValidationError);
		expect(() => validateFields(spec, { name: 'a', links: [{ url: {} }] })).toThrow(ValidationError);
		expect(() => validateFields(spec, { name: 'a', files: { id: 'not-metadata' } })).toThrow(ValidationError);
	});

	test('a non-object body is not a body', () => {
		expect(() => validateFields(spec, 'hello')).toThrow(ValidationError);
		expect(() => validateFields(spec, null)).toThrow(ValidationError);
		expect(() => validateFields(spec, ['a'])).toThrow(ValidationError);
	});

	test('names the field that was wrong', () => {
		expect(() => validateFields(spec, { name: 'a', playersMin: {} })).toThrow(/playersMin/);
	});
});

describe('isSafeKey', () => {
	test('rejects the keys that would land on the prototype', () => {
		expect(isSafeKey('__proto__')).toBe(false);
		expect(isSafeKey('constructor')).toBe(false);
		expect(isSafeKey('prototype')).toBe(false);
	});

	test('accepts a generated id', () => {
		expect(isSafeKey('abc123')).toBe(true);
	});
});
