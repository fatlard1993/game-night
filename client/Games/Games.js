import uFuzzy from '@leeoniya/ufuzzy';
import { View, Icon, styled, Component } from '@vanilla-bean/components';

import { getGames } from '../api';
import { navigate } from '../router';
import context from '../context';

import { Content } from '../Layout';
import GamesToolbar from './GamesToolbar';
import GameCard from './GameCard';
import GameDialog from './GameDialog';
import ContextMenu from './ContextMenu';
import confirmDeleteGame from './confirmDeleteGame';
import { gameHaystack, gameMatchesFilters, asNumber, tagCounts, filtersFromUrl, filtersToQuery } from './util';

// Tolerant fuzzy: allows insertions, substitutions, transpositions, and deletions within matches
const fuzzy = new uFuzzy({ intraMode: 1, intraIns: 5, intraSub: 1, intraTrn: 1, intraDel: 1 });

const CardGrid = styled.Component`
	display: flex;
	flex-wrap: wrap;
	gap: 12px;
	padding: 0 12px 12px;
`;

const EmptyMessage = styled(
	Component,
	() => `
		margin: 6px auto;
		padding: 6px 12px;
		text-align: center;
	`,
);

export default class Games extends View {
	constructor(options) {
		super({
			onContextMenu: event => this.showContextMenu(event),
			onConnected: () => this.load(),
			...options,
		});
	}

	build() {
		// Seed from the URL so a shared/bookmarked filtered view restores exactly
		this.filters = filtersFromUrl();
		context.libraryUrl = `/games${filtersToQuery(this.filters)}`;

		this.toolbar = new GamesToolbar({
			appendTo: this,
			initial: this.filters,
			onFilterChange: change => this.applyFilterChange(change),
		});
		this.content = new Content({ appendTo: this });
		this.contextMenu = new ContextMenu({ appendTo: this });

		this.renderLoader();
	}

	async load() {
		this.games = await getGames({
			onSuccess: response => {
				this.games = response;

				// The initial response also lands here; loaded gates a redundant first paint
				if (this.loaded) this.refreshContent();
			},
		});

		this.addCleanup('gamesRequest', () => this.games?.unsubscribe?.());

		this.loaded = true;
		this.refreshContent();
	}

	refreshContent() {
		this.toolbar.setTagVocabulary(tagCounts(this.games.body || {}));
		this.renderContent();
	}

	applyFilterChange(change) {
		this.filters = { ...this.filters, ...change };

		// Reflect the live filter state in the URL (replaceState, no history spam, no reload)
		const query = filtersToQuery(this.filters);
		window.history.replaceState(null, '', `${window.location.pathname}${query}`);

		// Remembered so a game page's back arrow returns to this filtered view
		context.libraryUrl = `/games${query}`;

		// Controls can emit during their initial setup, before the library has loaded
		if (this.loaded) this.renderContent();
	}

	renderLoader() {
		this.content.empty();

		new Icon({
			appendTo: this.content,
			icon: 'spinner',
			animation: 'spin-pulse',
			styles: ({ colors }) => ({
				fontSize: '20vh',
				marginTop: '20%',
				display: 'flex',
				justifyContent: 'center',
				color: colors.blue,
			}),
		});
	}

	getFilteredGames() {
		const games = Object.values(this.games.body || {});

		const filtered = games.filter(game =>
			gameMatchesFilters(game, {
				players: asNumber(this.filters.players),
				maxTime: asNumber(this.filters.maxTime),
				setting: this.filters.setting,
				maxComplexity: this.filters.maxComplexity,
				tags: this.filters.tags,
			}),
		);

		const { chips = [], text = '' } = this.filters.search || {};
		const liveText = text.trim();
		const terms = [...chips, liveText].filter(Boolean);

		if (terms.length === 0) return filtered.sort((a, b) => a.name.localeCompare(b.name));

		const haystacks = filtered.map(game => gameHaystack(game));

		// Every term (committed chips + live text) must match, AND semantics
		let allowed = null;
		let textOrder = null;

		for (const term of terms) {
			const matches = fuzzy.filter(haystacks, term) || [];
			const matchSet = new Set(matches);

			allowed = allowed === null ? matchSet : new Set([...allowed].filter(index => matchSet.has(index)));

			if (term === liveText) textOrder = matches;
		}

		// The live text term's fuzzy order is relevance order, use it when present;
		// chips-only searches read better alphabetized
		if (textOrder) return textOrder.filter(index => allowed.has(index)).map(index => filtered[index]);

		return [...allowed].map(index => filtered[index]).sort((a, b) => a.name.localeCompare(b.name));
	}

	renderContent() {
		const games = this.getFilteredGames();
		const hasAnyGames = Object.keys(this.games.body || {}).length > 0;

		this.content.empty();

		if (games.length === 0) {
			new EmptyMessage({
				appendTo: this.content,
				textContent: hasAnyGames
					? 'No games match the current search/filters'
					: 'No games yet .. Add them with the + button above',
			});

			return;
		}

		new CardGrid({
			appendTo: this.content,
			append: games.map(
				game =>
					new GameCard({
						game,
						attributes: { 'data-game-id': game.id },
						// Primary button only; right-press falls through to the contextmenu handler
						onPointerPress: event => {
							if (event.button === 0) navigate(`/games/${game.id}`);
						},
						onTagPress: tag => this.toolbar.addTagFilter(tag),
					}),
			),
		});
	}

	showContextMenu(event) {
		event.preventDefault();
		event.stopPropagation();

		const gameId = event.target.closest?.('[data-game-id]')?.dataset.gameId;
		const game = this.games.body?.[gameId];

		this.contextMenu.options.items = [
			...(game
				? [
						{
							textContent: `Edit ${game.name}`,
							onPointerPress: () => new GameDialog({ game }),
						},
						{
							textContent: `Delete ${game.name}`,
							onPointerPress: () => confirmDeleteGame(game),
						},
					]
				: []),
			{
				textContent: 'Add Game',
				onPointerPress: () => new GameDialog(),
			},
		];

		this.contextMenu.show({ x: event.clientX, y: event.clientY });
	}
}
