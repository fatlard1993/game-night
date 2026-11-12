import { afterEach, describe, expect, mock, test } from 'bun:test';

import SearchChips from './SearchChips';

const type = (elem, value) => {
	elem.value = value;
	elem.dispatchEvent(new Event('input', { bubbles: true }));
};

const press = (elem, key) => elem.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));

describe('SearchChips', () => {
	let search;

	afterEach(() => search.destroy());

	test('its field is an Input, seeded from initialText', () => {
		search = new SearchChips({ appendTo: document.body, initialText: 'chess' });

		expect(search.input.elem.classList.contains('vbc-input')).toBe(true);
		expect(search.input.elem.value).toBe('chess');
		expect(search.value).toEqual({ chips: [], text: 'chess' });
	});

	test('what is typed is the value, and Enter makes it a chip', () => {
		const onSearchChange = mock();

		search = new SearchChips({ appendTo: document.body, onSearchChange });

		type(search.input.elem, 'dice');

		expect(onSearchChange).toHaveBeenLastCalledWith({ chips: [], text: 'dice' });

		press(search.input.elem, 'Enter');

		expect(search.value).toEqual({ chips: ['dice'], text: '' });
		expect(search.input.elem.value).toBe('');
	});

	test('Backspace in an empty field removes the last chip', () => {
		search = new SearchChips({ appendTo: document.body, initialChips: ['coop', 'party'] });

		press(search.input.elem, 'Backspace');

		expect(search.value.chips).toEqual(['coop']);
	});

	test('setting text fills the field', () => {
		search = new SearchChips({ appendTo: document.body });

		search.text = 'catan';

		expect(search.input.elem.value).toBe('catan');
		expect(search.value.text).toBe('catan');
	});
});
