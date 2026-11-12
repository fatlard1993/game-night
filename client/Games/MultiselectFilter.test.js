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
});
