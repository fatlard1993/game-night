import { afterEach, describe, expect, test } from 'bun:test';

import MultiselectFilter from './MultiselectFilter';

describe('MultiselectFilter', () => {
	let filter;

	afterEach(() => filter.destroy());

	test('its search field is named, not only by its placeholder', () => {
		filter = new MultiselectFilter({
			appendTo: document.body,
			buttonParent: document.body,
			label: 'tags',
			searchable: true,
		});

		expect(filter.search.elem.getAttribute('aria-label')).toBe('Filter tags');
	});

	test('it hangs from its button, which toggles it', () => {
		filter = new MultiselectFilter({ appendTo: document.body, buttonParent: document.body, label: 'tags' });

		filter.button.elem.click();

		expect(filter.isOpen).toBe(true);
		expect(filter.button.elem.getAttribute('aria-haspopup')).toBe('dialog');
		expect(filter.button.elem.getAttribute('aria-expanded')).toBe('true');

		filter.button.elem.click();

		expect(filter.isOpen).toBe(false);
		expect(filter.button.elem.getAttribute('aria-expanded')).toBe('false');
	});

	test('Escape closes it and hands the keyboard back to its button', () => {
		filter = new MultiselectFilter({
			appendTo: document.body,
			buttonParent: document.body,
			label: 'tags',
			searchable: true,
		});

		filter.button.elem.click();
		filter.search.elem.focus();

		document.dispatchEvent(new KeyboardEvent('keyup', { key: 'Escape' }));

		expect(filter.isOpen).toBe(false);
		expect(document.activeElement).toBe(filter.button.elem);
	});
});
