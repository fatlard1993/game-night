import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';

import * as api from '../api';

const deleteGame = mock();

mock.module('../api', () => ({ ...api, deleteGame }));

const { default: confirmDeleteGame } = await import('./confirmDeleteGame');

const openDialog = () => [...document.querySelectorAll('dialog')].find(dialog => dialog.open);

const pressButton = (dialog, label) =>
	[...dialog.querySelectorAll('.footer button')].find(button => button.textContent === label).click();

// Dialogs open a frame after they render
const opened = () => new Promise(resolve => setTimeout(resolve, 50));

describe('confirmDeleteGame', () => {
	let onDeleted;

	beforeEach(() => {
		deleteGame.mockReset();
		onDeleted = mock();
	});

	afterEach(() => {
		for (const elem of document.querySelectorAll('dialog')) elem.remove();
	});

	test('asks in a danger confirm, Cancel first', async () => {
		const deleting = confirmDeleteGame({ id: 'g1', name: 'Chess' }, onDeleted);

		await opened();

		const confirm = openDialog();

		expect(confirm.textContent).toContain('Delete "Chess"?');
		expect(confirm.className).toContain('danger');
		expect([...confirm.querySelectorAll('.footer button')].map(button => button.textContent)).toEqual([
			'Cancel',
			'Delete',
		]);

		pressButton(confirm, 'Cancel');

		expect(await deleting).toBe(false);
		expect(deleteGame).not.toHaveBeenCalled();
	});

	test('a failed delete says why in a danger toast', async () => {
		deleteGame.mockResolvedValue({
			status: 'error',
			response: { ok: false, status: 500 },
			body: { error: 'disk full' },
		});

		const deleting = confirmDeleteGame({ id: 'g1', name: 'Chess' }, onDeleted);

		await opened();
		pressButton(openDialog(), 'Delete');

		expect(await deleting).toBe(false);
		expect(deleteGame).toHaveBeenCalledWith('g1');
		expect(onDeleted).not.toHaveBeenCalled();
		expect(document.body.textContent).toContain('Delete failed: disk full');
	});

	test('a delete that lands reports it', async () => {
		deleteGame.mockResolvedValue({ status: 'success', response: { ok: true, status: 200 }, body: {} });

		const deleting = confirmDeleteGame({ id: 'g1', name: 'Chess' }, onDeleted);

		await opened();
		pressButton(openDialog(), 'Delete');

		expect(await deleting).toBe(true);
		expect(onDeleted).toHaveBeenCalled();
	});
});
