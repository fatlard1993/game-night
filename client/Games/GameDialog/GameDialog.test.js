import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';

import * as api from '../../api';

const deleteGame = mock();

mock.module('../../api', () => ({ ...api, deleteGame, getGames: mock(async () => ({})) }));

const { default: GameDialog } = await import('./GameDialog');

const openDialogs = () => [...document.querySelectorAll('dialog')].filter(dialog => dialog.open);

const pressButton = (dialog, label) =>
	[...dialog.querySelectorAll('.footer button')].find(button => button.textContent === label).click();

// Dialogs open a frame after they render
const opened = () => new Promise(resolve => setTimeout(resolve, 50));

describe('GameDialog delete', () => {
	let dialog;
	let onDeleted;

	beforeEach(async () => {
		deleteGame.mockReset();
		onDeleted = mock();
		dialog = new GameDialog({ game: { id: 'g1', name: 'Chess' }, onDeleted });

		await opened();
	});

	afterEach(() => {
		for (const elem of document.querySelectorAll('dialog')) elem.remove();
	});

	const askToDelete = async () => {
		const deleting = dialog.delete();

		await opened();

		const confirm = openDialogs().find(elem => elem.textContent.includes('Delete "Chess"?'));

		return { deleting, confirm };
	};

	test('the edit dialog stays open behind the confirm, and Cancel keeps both the game and the dialog', async () => {
		const { deleting, confirm } = await askToDelete();

		expect(confirm).toBeDefined();
		expect(dialog.elem.open).toBe(true);

		pressButton(confirm, 'Cancel');

		expect(await deleting).toBe(false);
		expect(deleteGame).not.toHaveBeenCalled();
		expect(dialog.elem.open).toBe(true);
	});

	test('a failed delete keeps the dialog open with the reason', async () => {
		deleteGame.mockResolvedValue({ status: 'error', response: { ok: false, status: 500 }, body: { error: 'disk full' } });

		const { deleting, confirm } = await askToDelete();

		pressButton(confirm, 'Delete');

		expect(await deleting).toBe(false);
		expect(deleteGame).toHaveBeenCalledWith('g1');
		expect(dialog.elem.open).toBe(true);
		expect(dialog.body.elem.textContent).toContain('Delete failed: disk full');
		expect(onDeleted).not.toHaveBeenCalled();
	});

	test('a delete that lands closes the dialog and reports it', async () => {
		deleteGame.mockResolvedValue({ status: 'success', response: { ok: true, status: 200 }, body: {} });

		const { deleting, confirm } = await askToDelete();

		pressButton(confirm, 'Delete');

		expect(await deleting).toBe(true);
		expect(dialog.elem.open).toBe(false);
		expect(onDeleted).toHaveBeenCalled();
	});
});
