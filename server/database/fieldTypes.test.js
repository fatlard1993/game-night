import { describe, expect, test } from 'bun:test';

import { ValidationError, normalizeFields, validateFields } from '@vanilla-bean/components/app';

import { fileMap, linkArray } from './fieldTypes';

const spec = normalizeFields({
	name: { type: 'string', required: true },
	links: { type: linkArray },
	files: { type: fileMap },
});

describe("a game's own field types", () => {
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
