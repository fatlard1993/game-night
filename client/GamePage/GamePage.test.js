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

test('a failed load offers Try again, filled, with the way back flat beside it', async () => {
	getGame.mockImplementationOnce(async () => ({
		status: 'error',
		response: { ok: false, status: 500 },
		body: { error: 'store locked' },
	}));

	const page = new GamePage({ appendTo: document.body, id: 'g1' });

	await settled();

	const back = page.content.elem.querySelector('a');

	expect(back.textContent.trim()).toBe('Back to library');
	expect(back.classList.contains('variant-flat')).toBe(true);
	expect(button(page.content.elem, 'Try again').classList.contains('variant-flat')).toBe(false);

	page.destroy();
});

test('a game that is gone offers only the way back, filled', async () => {
	getGame.mockImplementationOnce(async () => ({
		status: 'error',
		response: { ok: false, status: 404 },
		body: { error: 'not found' },
	}));

	const page = new GamePage({ appendTo: document.body, id: 'g1' });

	await settled();

	const back = page.content.elem.querySelector('a');

	expect(back.textContent.trim()).toBe('Back to library');
	expect(back.classList.contains('variant-flat')).toBe(false);

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

	test('the back arrow, an icon alone, is flat', () => {
		const back = page.header.elem.querySelector('a');

		expect(back.title).toBe('Back to library');
		expect(back.classList.contains('variant-flat')).toBe(true);
	});

	test('on a phone Edit details is an icon, named by its tooltip', async () => {
		const matchMedia = window.matchMedia;

		window.matchMedia = query => ({
			...matchMedia.call(window, query),
			matches: true,
			addEventListener() {},
			removeEventListener() {},
		});
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

		const textarea = page.body.elem.querySelector('textarea');

		textarea.value = 'Changed';
		textarea.dispatchEvent(new Event('input', { bubbles: true }));
		button(page.body.elem, 'Cancel').click();

		await settled();

		const confirm = [...document.querySelectorAll('dialog')].find(dialog => dialog.open);

		expect(confirm.textContent).toContain('Discard changes?');
		expect(confirm.className).toContain('danger');

		button(confirm, 'Keep editing').click();
	});

	test("the description and rules are the form's fields, and Save sends what's typed in them", async () => {
		updateGame.mockImplementationOnce(async (id, { body }) => ({
			status: 'success',
			response: { ok: true, status: 200 },
			body: { ...game, ...body },
		}));

		await startEditing();

		const [description, rules] = page.body.elem.querySelectorAll('textarea');
		const label = textarea => document.querySelector(`label[for="${textarea.id}"]`).textContent;

		expect([label(description), label(rules)]).toEqual(['Description', 'Rules']);

		rules.value = 'Stalemate draws';
		rules.dispatchEvent(new Event('input', { bubbles: true }));
		button(page.body.elem, 'Save').click();

		await settled();

		expect(updateGame).toHaveBeenLastCalledWith('g1', {
			body: { description: 'Two players', rules: 'Stalemate draws' },
		});
		expect(page.body.elem.querySelector('textarea')).toBeNull();
	});

	test('a failed save says why inside the form and keeps what was typed', async () => {
		updateGame.mockImplementationOnce(async () => ({
			status: 'error',
			response: { ok: false, status: 500 },
			body: { error: 'store locked' },
		}));

		await startEditing();

		const rules = page.body.elem.querySelectorAll('textarea')[1];

		rules.value = 'Kept';
		rules.dispatchEvent(new Event('input', { bubbles: true }));
		button(page.body.elem, 'Save').click();

		await settled();

		const alert = page.editForm.elem.querySelector('[role="alert"]');

		expect(alert.textContent).toBe('Save failed: store locked');
		expect(page.body.elem.querySelectorAll('textarea')[1].value).toBe('Kept');
		// Between the editors and the buttons it answers
		expect(
			alert.compareDocumentPosition(button(page.body.elem, 'Save')) & Node.DOCUMENT_POSITION_FOLLOWING,
		).toBeTruthy();
		expect(alert.compareDocumentPosition(rules) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
	});
});
