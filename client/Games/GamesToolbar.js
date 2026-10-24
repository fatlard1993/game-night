import { Button, Component, ContextMenu, Input, Select, Toolbar, debounce, styled } from '@vanilla-bean/components';

import { logOut } from '../api';
import context from '../context';

import GameDialog from './GameDialog/GameDialog';
import LoginDialog from './LoginDialog';
import MultiselectFilter from './MultiselectFilter';
import SearchChips from './SearchChips';
import SteamImportDialog from './SteamImportDialog';
import { COMPLEXITY_LEVELS, SETTINGS } from './gameModel';

// Selects size to their label rather than the field default's full width
const selectStyles = () => `
	width: auto;
	flex: none;
`;

const TIME_FILTERS = [
	{ label: 'Any length', value: '' },
	{ label: '< 15 min', value: '15' },
	{ label: '< 30 min', value: '30' },
	{ label: '< 1 hour', value: '60' },
	{ label: '< 2 hours', value: '120' },
];

// The filters are one row that scrolls sideways when it runs out of room, so on a phone the search takes a row of
// its own and the filters one more, instead of the controls wrapping into a stack above the games
const Filters = styled(
	Component,
	({ space }) => `
		display: flex;
		align-items: center;
		gap: ${space.sm};
		flex: 0 1 auto;
		min-width: 0;
		overflow-x: auto;
		scrollbar-width: none;
		/* Room for the focus ring, which overflow would otherwise clip */
		padding: 3px;
		margin: -3px;
	`,
);

export default class GamesToolbar extends styled(
	Toolbar,
	({ media }) => `
		@media ${media.phone} {
			& > .searchChips {
				flex-basis: 100%;
			}

			& > .filters {
				flex: 1;
			}
		}
	`,
) {
	static schema = {
		onFilterChange: {},
		initial: {},
	};

	build() {
		// Initial filter values seeded from the URL by Games; blank when absent
		const initial = this.options.initial || {};

		this._emitSearch = debounce(value => this._emit({ search: value }), 300);

		this.search = new SearchChips({
			appendTo: this.elem,
			addClass: 'searchChips',
			placeholder: 'Search games, tags, descriptions...',
			initialText: initial.search?.text || context.preRenderSearch || '',
			initialChips: initial.search?.chips || [],
			onSearchChange: value => this._emitSearch(value),
		});

		this.filterRow = new Filters({ appendTo: this.elem, addClass: 'filters' });

		// Setting is the primary "where-like" axis, sits up front with players and time
		this.setting = new Select({
			appendTo: this.filterRow,
			value: initial.setting || '',
			options: [{ label: 'Any setting', value: '' }, ...SETTINGS],
			styles: selectStyles,
			onChange: ({ value }) => this._emit({ setting: value }),
		});

		this.players = new Input({
			type: 'number',
			appendTo: this.filterRow,
			placeholder: 'Players',
			min: 1,
			value: initial.players || '',
			styles: () => `
				width: 6.5rem;
				flex: none;
			`,
			// 'input' also covers the native number spinners
			onInput: debounce(({ value }) => this._emit({ players: value }), 300),
		});

		this.time = new Select({
			appendTo: this.filterRow,
			value: initial.maxTime || '',
			options: TIME_FILTERS,
			styles: selectStyles,
			onChange: ({ value }) => this._emit({ maxTime: value }),
		});

		this.complexity = new Select({
			appendTo: this.filterRow,
			value: initial.maxComplexity || '',
			options: [
				{ label: 'Any complexity', value: '' },
				...COMPLEXITY_LEVELS.map((level, index) => ({ label: index === 0 ? level : `≤ ${level}`, value: level })),
			],
			styles: selectStyles,
			onChange: ({ value }) => this._emit({ maxComplexity: value }),
		});

		this.tagFilter = new MultiselectFilter({
			appendTo: this,
			buttonParent: this.filterRow,
			label: 'tags',
			searchable: true,
			showCounts: true,
			minCount: 2, // singleton tags can't group anything, hidden from the filter
			initialSelected: initial.tags || [],
			emit: values => this._emit({ tags: values }),
		});

		const seededFromUrl = !!(initial.search?.text || initial.search?.chips?.length);

		requestAnimationFrame(() => {
			this.search.focus();
			// Buffered pre-render keystrokes only apply when a shared URL didn't already seed the search
			if (!seededFromUrl && context.preRenderSearch) this.search.text = context.preRenderSearch;
			// null marks the buffer spent so a later library view doesn't re-seed from stale keys
			context.preRenderSearch = null;
			context.searchElem = this.search.input.elem;
		});

		this.addCleanup('searchContext', () => {
			if (context.searchElem === this.search.input.elem) context.searchElem = null;
		});

		this.addButton = new Button({
			appendTo: this.elem,
			icon: 'plus',
			title: 'Add Game',
			onPointerPress: event => {
				event.preventDefault();
				event.stopPropagation();

				this.addMenu.options.items = [
					{ textContent: 'Add Game', onPointerPress: () => new GameDialog() },
					{ textContent: 'Import Steam Library', onPointerPress: () => new SteamImportDialog() },
				];

				this.addMenu.open({ x: event.clientX, y: event.clientY });
			},
		});

		this.sessionButton = new Button({
			appendTo: this.elem,
			variant: 'flat',
			onPointerPress: () => (context.admin ? logOut().then(() => (context.admin = false)) : new LoginDialog()),
		});

		this.addMenu = new ContextMenu({ appendTo: this, reticle: false });

		this._showSession(context.admin);

		const session = context.subscribe({ key: 'admin', callback: admin => this._showSession(admin) });

		this.addCleanup('sessionSubscription', () => session.unsubscribe());
	}

	// The add button is meaningless without a session; the key/logout button is how one is
	// started or ended, and it is the only editing affordance a guest ever sees
	_showSession(admin) {
		this.addButton.elem.style.display = admin ? '' : 'none';

		this.sessionButton.options.icon = admin ? 'lock-open' : 'lock';
		this.sessionButton.options.title = admin ? 'Log out of admin' : 'Admin login';
	}

	// Games passes the live vocabulary so the tag checklist reflects the current library
	setTagVocabulary(counts) {
		this.tagFilter.setVocabulary(counts);
	}

	addTagFilter(tag) {
		this.tagFilter.addValue(tag);
	}

	_emit(change) {
		this.options.onFilterChange(change);
	}
}
