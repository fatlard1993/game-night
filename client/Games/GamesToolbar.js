import { Button, Input, Select, debounce } from '@vanilla-bean/components';

import context from '../context';

import { Toolbar } from '../Layout';
import ContextMenu from './ContextMenu';
import GameDialog from './GameDialog';
import MultiselectFilter from './MultiselectFilter';
import SearchChips from './SearchChips';
import SteamImportDialog from './SteamImportDialog';
import { COMPLEXITY_LEVELS, SETTINGS } from './util';

const TIME_FILTERS = [
	{ label: 'Any length', value: '' },
	{ label: '< 15 min', value: '15' },
	{ label: '< 30 min', value: '30' },
	{ label: '< 1 hour', value: '60' },
	{ label: '< 2 hours', value: '120' },
];

export default class GamesToolbar extends Toolbar {
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
			placeholder: 'Search games, tags, descriptions...',
			initialText: initial.search?.text || context.preRenderSearch || '',
			initialChips: initial.search?.chips || [],
			onSearchChange: value => this._emitSearch(value),
		});

		// Setting is the primary "where-like" axis, sits up front with players and time
		this.setting = new Select({
			appendTo: this.elem,
			value: initial.setting || '',
			options: [{ label: 'Any setting', value: '' }, ...SETTINGS],
			styles: () => `
				width: auto;
				flex: none;
				margin: 6px 0;
				height: 2.4rem;
			`,
			onChange: ({ value }) => this._emit({ setting: value }),
		});

		this.players = new Input({
			type: 'number',
			appendTo: this.elem,
			placeholder: 'Players',
			min: 1,
			value: initial.players || '',
			styles: () => `
				width: 5.4rem;
				margin: 6px 0;
				height: 2.4rem;
			`,
			// 'input' also covers the native number spinners
			onInput: debounce(({ value }) => this._emit({ players: value }), 300),
		});

		this.time = new Select({
			appendTo: this.elem,
			value: initial.maxTime || '',
			options: TIME_FILTERS,
			styles: () => `
				width: auto;
				flex: none;
				margin: 6px 0;
				height: 2.4rem;
			`,
			onChange: ({ value }) => this._emit({ maxTime: value }),
		});

		this.complexity = new Select({
			appendTo: this.elem,
			value: initial.maxComplexity || '',
			options: [
				{ label: 'Any complexity', value: '' },
				...COMPLEXITY_LEVELS.map((level, index) => ({ label: index === 0 ? level : `≤ ${level}`, value: level })),
			],
			styles: () => `
				width: auto;
				flex: none;
				margin: 6px 0;
				height: 2.4rem;
			`,
			onChange: ({ value }) => this._emit({ maxComplexity: value }),
		});

		this.tagFilter = new MultiselectFilter({
			appendTo: this,
			buttonParent: this.elem,
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

		new Button({
			appendTo: this.elem,
			styles: () => `
				&:empty {
					padding: 0;
					margin: 6px;
					font-size: 1.3em;
					height: 2.4rem;
					width: 2.4rem;
				}
			`,
			icon: 'plus',
			title: 'Add Game',
			onPointerPress: event => {
				event.preventDefault();
				event.stopPropagation();

				this.addMenu.options.items = [
					{ textContent: 'Add Game', onPointerPress: () => new GameDialog() },
					{ textContent: 'Import Steam Library', onPointerPress: () => new SteamImportDialog() },
				];

				this.addMenu.show({ x: event.clientX, y: event.clientY });
			},
		});

		this.addMenu = new ContextMenu({ appendTo: this, reticle: false });
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
