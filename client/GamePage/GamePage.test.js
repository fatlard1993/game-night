import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';

import * as api from '../api';

const game = { id: 'g1', name: 'Chess', description: 'Two players', rules: 'Checkmate wins' };

const getGame = mock(async () => ({ status: 'success', response: { ok: true, status: 200 }, body: { ...game } }));
const getGames = mock(async () => ({ status: 'success', response: { ok: true, status: 200 }, body: { g1: game } }));
const updateGame = mock();

mock.module('../api', () => ({ ...api, getGame, getGames, updateGame }));

const { default: context } = await import('../context');
const { default: GamePage } = await import('./GamePage');

// Fetches resolve, then the page paints; dialogs open a frame after they render
const settled = () => new Promise(resolve => setTimeout(resolve, 50));

const buttons = (root, selector = 'button') => [...root.querySelectorAll(selector)];

const button = (root, label) => buttons(root).find(elem => elem.textContent.trim() === label);

test('shows a loading EmptyState until the game arrives', async () => {
	const page = new GamePage({ appendTo: document.body, id: 'g1' });

	expect(page.content.elem.querySelector('.loading')).not.toBeNull();

	await settled();

	expect(page.content.elem.querySelector('.loading')).toBeNull();
	expect(page.header.options.heading).toBe('Chess');

	page.destroy();
});

describe('GamePage', () => {
	let page;

	beforeEach(async () => {
		context.admin = true;
		updateGame.mockReset();
		page = new GamePage({ appendTo: document.body, id: 'g1' });

		await settled();
	});

	afterEach(() => {
		page.destroy();
		context.admin = false;
		for (const elem of document.querySelectorAll('dialog')) elem.remove();
	});

	const startEditing = async () => {
		button(page.header.elem, 'Edit').click();

		await settled();
	};

	test('the header fills only Edit; Edit details and Delete are flat', () => {
		const [edit, details, trash] = buttons(page.header.elem);

		expect(edit.textContent.trim()).toBe('Edit');
		expect(edit.classList.contains('variant-flat')).toBe(false);
		expect(details.textContent.trim()).toBe('Edit details');
		expect(details.classList.contains('variant-flat')).toBe(true);
		expect(trash.title).toBe('Delete game');
		expect(trash.classList.contains('variant-flat')).toBe(true);
	});

	test('on a phone Edit details is an icon, named by its tooltip', async () => {
		const matchMedia = window.matchMedia;

		window.matchMedia = query => ({ ...matchMedia.call(window, query), matches: true, addEventListener() {}, removeEventListener() {} });
		page.renderContent();
		window.matchMedia = matchMedia;

		await settled();

		const details = buttons(page.header.elem)[1];
		const name = document.getElementById(details.getAttribute('aria-labelledby'));

		expect(details.childNodes.length).toBe(1);
		expect(details.classList.contains('icon')).toBe(true);
		expect(name.textContent).toBe('Edit details');
	});

	test('the editor ends with Cancel, quiet, then Save, filled', async () => {
		await startEditing();

		const [cancel, save] = buttons(page.body.elem).slice(-2);

		expect(cancel.textContent).toBe('Cancel');
		expect(cancel.classList.contains('variant-flat')).toBe(true);
		expect(save.textContent).toBe('Save');
		expect(save.classList.contains('variant-flat')).toBe(false);
	});

	test('discarding unsaved edits asks in a danger confirm', async () => {
		await startEditing();

		page.descriptionEditor.editor.options.value = 'Changed';
		button(page.body.elem, 'Cancel').click();

		await settled();

		const confirm = [...document.querySelectorAll('dialog')].find(dialog => dialog.open);

		expect(confirm.textContent).toContain('Discard changes?');
		expect(confirm.className).toContain('danger');

		button(confirm, 'Keep editing').click();
	});
});
