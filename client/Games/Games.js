import uFuzzy from '@leeoniya/ufuzzy';
import { View, Icon, Button, styled, Component } from '@vanilla-bean/components';

import { getGames, requestError } from '../api';
import { navigate } from '../navigate';
import context from '../context';

import { Content } from '../Layout';
import GamesToolbar from './GamesToolbar';
import GameCard from './GameCard';
import GameDialog from './GameDialog/GameDialog';
import ContextMenu from './ContextMenu';
import confirmDeleteGame from './confirmDeleteGame';
import { gameHaystack, gameMatchesFilters, asNumber, tagCounts, filtersFromUrl, filtersToQuery } from './gameModel';

// Tolerant fuzzy: allows insertions, substitutions, transpositions, and deletions within matches
const fuzzy = new uFuzzy({ intraMode: 1, intraIns: 5, intraSub: 1, intraTrn: 1, intraDel: 1 });

const CardGrid = styled.Component`
	display: grid;
	/* Columns flex to fill the row: ~200px+ tracks on wide screens, two-up on
	   phones (the 50% term undercuts 200px there, minus half the gap) */
	grid-template-columns: repeat(auto-fill, minmax(min(200px, calc(50% - 6px)), 1fr));
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
		const receive = response => {
			this.games = response;

			// The initial response also lands here; loaded gates a redundant first paint
			if (this.loaded) this.refreshContent();
		};

		this.games = await getGames({ onSuccess: receive, onError: receive });

		this.addCleanup('gamesRequest', () => this.games?.unsubscribe?.());

		this.loaded = true;
		this.refreshContent();
	}

	// The body is only a games map on success; a failed request leaves an Error (network) or the
	// server's error text there, and reading either as data is what made a failed load render as
	// an empty library
	gamesById() {
		return this.games?.status === 'success' && this.games.body ? this.games.body : {};
	}

	refreshContent() {
		// A failed refetch keeps the tag vocabulary it last had rather than emptying the filter
		if (this.games?.status !== 'error') this.toolbar.setTagVocabulary(tagCounts(this.gamesById()));

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
		const games = Object.values(this.gamesById());

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
		this.content.empty();

		if (this.games?.status === 'error') return this.renderError();

		const games = this.getFilteredGames();
		const hasAnyGames = Object.keys(this.gamesById()).length > 0;

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
						onPointerPress: () => navigate(`/games/${game.id}`),
						onTagPress: tag => this.toolbar.addTagFilter(tag),
					}),
			),
		});
	}

	// Distinct from the empty-library message on purpose: "no games yet" and "the library did not
	// load" look identical to someone holding a phone, and only one of them is worth a retry
	renderError() {
		new EmptyMessage({
			appendTo: this.content,
			append: [
				new Component({ textContent: `Could not load the library: ${requestError(this.games)}` }),
				new Button({
					textContent: 'Try again',
					style: { margin: '12px auto 0' },
					onPointerPress: () => {
						this.renderLoader();
						this.games.refetch?.();
					},
				}),
			],
		});
	}

	showContextMenu(event) {
		event.preventDefault();
		event.stopPropagation();

		const gameId = event.target.closest?.('[data-game-id]')?.dataset.gameId;
		const game = this.gamesById()[gameId];

		// Every item here writes; without a session the menu would offer nothing the server accepts
		if (!context.admin) return;

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
