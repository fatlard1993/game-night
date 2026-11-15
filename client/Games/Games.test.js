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
		const link = card.querySelector('a.name');

		expect(link.textContent).toBe('Chess');
		expect(link.getAttribute('href')).toBe('/games/g%201');
	});

	test("a card's tags are links to the library searched for them, beside the game's link and not inside it", async () => {
		window.happyDOM.setURL('http://localhost/games?players=4&tag=co-op');
		getGames.mockResolvedValue({
			status: 'success',
			response: { ok: true, status: 200 },
			body: { g1: { id: 'g1', name: 'Pandemic', playersMin: 2, playersMax: 4, tags: ['co-op', 'deck building'] } },
		});

		view = new Games({ appendTo: document.body });

		await settled();

		const card = view.content.elem.querySelector('[data-game-id="g1"]');
		const tags = [...card.querySelectorAll('ul.tags a[href]')];

		// No link holds another
		expect(card.querySelectorAll('a a')).toHaveLength(0);
		expect(card.closest('a')).toBeNull();
		expect(tags.map(tag => tag.textContent)).toEqual(['co-op', 'deck building']);
		// Each is the library as it's filtered now, with its tag added
		expect(tags.map(tag => tag.getAttribute('href'))).toEqual([
			'/games?players=4&tag=co-op',
			'/games?players=4&tag=co-op&tag=deck+building',
		]);
	});

	test('a plain press on a tag searches for it in place; one for a new tab is left to the browser', async () => {
		window.happyDOM.setURL('http://localhost/games');
		getGames.mockResolvedValue({
			status: 'success',
			response: { ok: true, status: 200 },
			body: {
				g1: { id: 'g1', name: 'Pandemic', tags: ['co-op'] },
				g2: { id: 'g2', name: 'Chess', tags: ['abstract'] },
			},
		});

		view = new Games({ appendTo: document.body });

		await settled();

		const tagLink = () => view.content.elem.querySelector('[data-game-id="g1"] ul.tags a');
		const newTab = new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true });

		tagLink().dispatchEvent(newTab);

		expect(newTab.defaultPrevented).toBe(false);
		expect(view.filters.tags).toEqual([]);

		const plain = new MouseEvent('click', { bubbles: true, cancelable: true });

		tagLink().dispatchEvent(plain);
		await settled();

		expect(plain.defaultPrevented).toBe(true);
		expect(view.filters.tags).toEqual(['co-op']);
		expect(window.location.search).toBe('?tag=co-op');
		expect([...view.content.elem.querySelectorAll('[data-game-id]')].map(card => card.dataset.gameId)).toEqual(['g1']);
	});
});
