import { afterEach, describe, expect, mock, test } from 'bun:test';

import * as api from '../api';

const getGames = mock();

mock.module('../api', () => ({ ...api, getGames }));

const { default: Games } = await import('./Games');

const settled = () => new Promise(resolve => setTimeout(resolve, 50));

describe('Games', () => {
	let view;

	afterEach(() => {
		view.destroy();
		window.happyDOM.setURL('about:blank');
	});

	test('the header is a bar, as on the game page', async () => {
		getGames.mockResolvedValue({ status: 'success', response: { ok: true, status: 200 }, body: {} });

		view = new Games({ appendTo: document.body });

		expect(view.toolbar.elem.classList.contains('variant-bar')).toBe(true);
	});

	test('a failed load says it failed, why, and offers Try again', async () => {
		getGames.mockResolvedValue({ status: 'error', response: { ok: false, status: 500 }, body: { error: 'disk full' } });

		view = new Games({ appendTo: document.body });

		await settled();

		const content = view.content.elem;

		expect(content.textContent).toContain('Could not load the library');
		expect(content.textContent).toContain('disk full');
		expect(content.querySelector('.fa-triangle-exclamation, [class*="triangle-exclamation"]')).not.toBeNull();
		expect([...content.querySelectorAll('button')].map(button => button.textContent)).toContain('Try again');
	});

	test('nothing matching names what was searched for', async () => {
		window.happyDOM.setURL('http://localhost/games?q=zzz&players=4');
		getGames.mockResolvedValue({
			status: 'success',
			response: { ok: true, status: 200 },
			body: { g1: { id: 'g1', name: 'Chess', playersMin: 2, playersMax: 2 } },
		});

		view = new Games({ appendTo: document.body });

		await settled();

		expect(view.content.elem.textContent).toContain('No games match "zzz", 4 players');
	});

	test('a game card is a link to its game', async () => {
		getGames.mockResolvedValue({
			status: 'success',
			response: { ok: true, status: 200 },
			body: { 'g 1': { id: 'g 1', name: 'Chess' } },
		});

		view = new Games({ appendTo: document.body });

		await settled();

		const card = view.content.elem.querySelector('[data-game-id="g 1"]');

		expect(card.tagName).toBe('A');
		expect(card.getAttribute('href')).toBe('/games/g%201');
	});
});
