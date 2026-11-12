import { afterEach, describe, expect, mock, test } from 'bun:test';

import * as api from '../api';

const getSteamSettings = mock(async () => ({ body: { steamId: 'gaben', configured: true } }));

mock.module('../api', () => ({ ...api, getSteamSettings }));

const { default: SteamImportDialog } = await import('./SteamImportDialog');

// Dialogs open a frame after they render, and the settings fetch lands after that
const opened = () => new Promise(resolve => setTimeout(resolve, 50));

describe('SteamImportDialog', () => {
	afterEach(() => {
		for (const elem of document.querySelectorAll('dialog')) elem.remove();
	});

	test('Cancel comes before Import', async () => {
		const dialog = new SteamImportDialog();

		await opened();

		expect([...dialog.elem.querySelectorAll('.footer button')].map(button => button.textContent)).toEqual([
			'Cancel',
			'Import',
		]);
	});

	test('the saved Steam ID fills the field through the form, and a saved key changes the hint', async () => {
		const dialog = new SteamImportDialog();

		await opened();

		const { steamId, apiKey } = dialog.form.inputElements;

		expect(dialog.form.options.data.steamId).toBe('gaben');
		expect(steamId.options.value).toBe('gaben');
		expect(steamId.elem.value).toBe('gaben');
		expect(apiKey.elem.placeholder).toBe('Using saved key (leave blank)');
	});
});
