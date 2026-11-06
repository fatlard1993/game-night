import { View, Component, Content, ContextMenu, EmptyState, styled, failureReason } from '@vanilla-bean/components';

import { getGames } from '../api';
import { navigate } from '../navigate';
import context from '../context';

import GamesToolbar from './GamesToolbar';
import GameCard from './GameCard';
import GameDialog from './GameDialog/GameDialog';
import confirmDeleteGame from './confirmDeleteGame';
import { searchGames, gameMatchesFilters, asNumber, tagCounts, filtersFromUrl, filtersToQuery } from './gameModel';

const CardGrid = styled(
	Component,
	({ space }) => `
		display: grid;
		/* Columns flex to fill the row: ~200px+ tracks on wide screens, two-up on
		   phones (the 50% term undercuts 200px there, minus half the gap) */
		grid-template-columns: repeat(auto-fill, minmax(min(200px, calc(50% - ${space.sm})), 1fr));
		gap: ${space.md};
		padding: 0 ${space.md} ${space.md};
	`,
);

export default class Games extends View {
	constructor(options) {
		super({
			onContextMenu: event => this.showContextMenu(event),
			// A touch screen has no right-click; holding a card brings the same menu
			onLongPress: event => this.showContextMenu(event),
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

		this.games = await getGames({ onSuccess: receive, onError: receive, scope: this.signal });

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

		new EmptyState({ appendTo: this.content, loading: true });
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

		return searchGames(filtered, this.filters.search);
	}

	renderContent() {
		this.content.empty();

		if (this.games?.status === 'error') return this.renderError();

		const games = this.getFilteredGames();
		const hasAnyGames = Object.keys(this.gamesById()).length > 0;

		if (games.length === 0) {
			new EmptyState({
				appendTo: this.content,
				icon: hasAnyGames ? 'magnifying-glass' : 'dice',
				message: hasAnyGames
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
		new EmptyState({
			appendTo: this.content,
			message: `Could not load the library: ${failureReason(this.games)}`,
			action: {
				textContent: 'Try again',
				onPointerPress: () => {
					this.renderLoader();
					this.games.refetch?.();
				},
			},
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

		this.contextMenu.open({ x: event.clientX, y: event.clientY });
	}
}
