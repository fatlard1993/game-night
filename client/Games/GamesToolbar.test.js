import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';

import * as api from '../api';

const logOut = mock();

mock.module('../api', () => ({ ...api, logOut }));

const { default: context } = await import('../context');
const { default: GamesToolbar } = await import('./GamesToolbar');

describe('GamesToolbar log out', () => {
	let toolbar;

	beforeEach(() => {
		logOut.mockReset();
		context.admin = true;
		toolbar = new GamesToolbar({ appendTo: document.body, onFilterChange: () => {} });
	});

	afterEach(() => {
		toolbar.destroy();
		context.admin = false;
	});

	test('a refused logout keeps the session and says why in a danger toast', async () => {
		logOut.mockResolvedValue({
			status: 'error',
			response: { ok: false, status: 500 },
			body: { error: 'store locked' },
		});

		await toolbar.logOut();

		expect(context.admin).toBe(true);
		expect(document.body.textContent).toContain('Log out failed: store locked');
	});

	test('a logout that lands ends the session', async () => {
		logOut.mockResolvedValue({ status: 'success', response: { ok: true, status: 200 }, body: {} });

		await toolbar.logOut();

		expect(context.admin).toBe(false);
	});
});

describe('GamesToolbar add menu', () => {
	test('its labels are sentence case and start with a verb', () => {
		context.admin = true;

		const toolbar = new GamesToolbar({ appendTo: document.body, onFilterChange: () => {} });

		toolbar.addButton.elem.click();

		expect(toolbar.addButton.elem.title).toBe('Add a game');
		expect(toolbar.addMenu.options.items.map(item => item.textContent)).toEqual([
			'Add a game',
			'Import a Steam library',
		]);

		toolbar.destroy();
		context.admin = false;
	});
});
