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

	describe('its rows', () => {
		let emitted;

		const open = () => {
			emitted = [];
			filter = new MultiselectFilter({
				appendTo: document.body,
				buttonParent: document.body,
				label: 'tags',
				showCounts: true,
				initialSelected: ['party'],
				emit: values => emitted.push(values),
			});
			filter.setVocabulary({ 'co-op': 5, party: 3 });
			filter.button.elem.click();
		};

		const row = name => filter.list.elem.querySelector(`button[aria-label="${name}"]`);

		test('are toggle buttons named by their value, which say whether they are on', () => {
			open();

			expect(row('party').getAttribute('aria-pressed')).toBe('true');
			expect(row('co-op').getAttribute('aria-pressed')).toBe('false');
		});

		test('pressing one turns it on in place, keeping the keyboard on it', () => {
			open();

			const coop = row('co-op');

			coop.focus();
			coop.click();

			expect(emitted.at(-1)).toEqual(['party', 'co-op']);
			expect(row('co-op')).toBe(coop);
			expect(coop.getAttribute('aria-pressed')).toBe('true');
			expect(document.activeElement).toBe(coop);
		});
	});
});
