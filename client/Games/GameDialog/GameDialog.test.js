import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';

import * as api from '../../api';

const deleteGame = mock();
const updateGame = mock();
const uploadGameFile = mock();

mock.module('../../api', () => ({ ...api, deleteGame, updateGame, uploadGameFile, getGames: mock(async () => ({})) }));

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
		deleteGame.mockResolvedValue({
			status: 'error',
			response: { ok: false, status: 500 },
			body: { error: 'disk full' },
		});

		const { deleting, confirm } = await askToDelete();

		pressButton(confirm, 'Delete');

		expect(await deleting).toBe(false);
		expect(deleteGame).toHaveBeenCalledWith('g1');
		expect(dialog.elem.open).toBe(true);
		expect(dialog.elem.querySelector('.failure').textContent).toBe('disk full');
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

describe('GameDialog size', () => {
	afterEach(() => {
		for (const elem of document.querySelectorAll('dialog')) elem.remove();
	});

	// A form hugs its content, however long, rather than filling the screen
	test('is fit, as a form is', async () => {
		const dialog = new GameDialog();

		await opened();

		expect(dialog.elem.classList.contains('size-fit')).toBe(true);
	});
});

describe('GameDialog save', () => {
	afterEach(() => {
		for (const elem of document.querySelectorAll('dialog')) elem.remove();
	});

	// The Steam fields are the import's to write; a stale copy from the dialog reset its progress
	test('sends each range the right way up, and none of the fields it does not edit', async () => {
		updateGame.mockReset();
		updateGame.mockResolvedValue({ status: 'success', response: { ok: true, status: 200 }, body: { id: 'g1' } });

		const dialog = new GameDialog({
			game: {
				id: 'g1',
				name: 'Chess',
				playersMin: '6',
				playersMax: '2',
				playTimeMin: '',
				playTimeMax: '30',
				description: 'kept',
				rules: 'kept',
				steamAppId: 570,
				steamEnriched: true,
			},
		});

		await opened();

		expect(await dialog.save()).toBe(true);

		const [, { body }] = updateGame.mock.calls[0];

		expect(body).toMatchObject({ name: 'Chess', playersMin: 2, playersMax: 6, playTimeMin: '', playTimeMax: 30 });
		for (const key of ['description', 'rules', 'steamAppId', 'steamEnriched', 'id'])
			expect(body).not.toHaveProperty(key);
	});

	test('an upload failing after the game saved says so beside the reason', async () => {
		updateGame.mockResolvedValue({ status: 'success', response: { ok: true, status: 200 }, body: { id: 'g1' } });
		uploadGameFile.mockResolvedValue({
			status: 'error',
			response: { ok: false, status: 413 },
			body: { error: 'too big' },
		});

		const dialog = new GameDialog({ game: { id: 'g1', name: 'Chess' } });

		await opened();

		dialog.form.getPendingFiles = () => [{ name: 'board.png' }];

		const { reportError } = globalThis;

		globalThis.reportError = () => {};

		const saved = await dialog.save();

		globalThis.reportError = reportError;

		expect(saved).toBe(false);
		expect(dialog.elem.open).toBe(true);
		expect(dialog.elem.querySelector('.failure').textContent).toBe(
			'"board.png" upload failed (the game itself saved): too big',
		);
	});
});
