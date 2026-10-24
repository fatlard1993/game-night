import { styled, Component, Elem, Icon, Input, Button, capitalize, isDescendantOf } from '@vanilla-bean/components';

// A multiselect OR filter: a button that opens a searchable checklist popover over a dynamic
// {value: count} vocabulary (counts shown, values below minCount hidden). Owns its own button.
export default class MultiselectFilter extends styled.Popover(
	({ colors, space }) => `
		display: flex;
		flex-direction: column;
		padding: 0;
		overflow: hidden;
		transform: scaleY(0);
		transform-origin: top;
		transition:
			opacity 0.2s,
			transform 0.15s,
			overlay 0.3s allow-discrete,
			display 0.3s allow-discrete;

		&:popover-open {
			opacity: 1;
			transform: scaleY(1);
			transition:
				overlay 0.3s allow-discrete,
				display 0.3s allow-discrete,
				opacity 0.3s,
				transform 0.3s;
		}

		@starting-style {
			&:popover-open { opacity: 0; transform: scaleY(0); }
		}

		& .filterSearch {
			margin: 0;
			border: none;
			border-bottom: 1px solid ${colors.border};
			border-radius: 0;
			flex-shrink: 0;
		}

		& .filterList {
			overflow-y: auto;
			flex: 1;
		}

		& .filterRow {
			display: flex;
			align-items: center;
			gap: ${space.sm};
			padding: ${space.sm} ${space.md};
			cursor: pointer;
			white-space: nowrap;

			&:hover { background-color: ${colors.alpha(colors.white, 0.08)}; }

			&.selected { background-color: ${colors.alpha(colors.selected, 0.25)}; }

			& .check {
				width: 14px;
				flex-shrink: 0;
				color: ${colors.light(colors.selected)};
			}

			& .count {
				margin-left: auto;
				padding-left: ${space.md};
				font-size: 0.8em;
				color: ${colors.muted};
			}
		}

		& .filterFooter {
			display: flex;
			justify-content: space-between;
			gap: ${space.sm};
			padding: ${space.sm};
			border-top: 1px solid ${colors.border};
			flex-shrink: 0;
		}
	`,
	{ autoOpen: false, maxWidth: 260, maxHeight: 360 },
) {
	static schema = {
		// data: the emit option collides with Component's emit() method
		emit: { data: true },
		label: {},
		searchable: {},
		showCounts: {},
		minCount: {},
		initialSelected: {},
		buttonParent: {},
	};

	build() {
		this.selected = new Set(this.options.initialSelected || []);
		this._query = '';
		this._vocab = {};

		// The button lives in the toolbar row; the popover (this) lives at view level
		this.button = new Button({
			appendTo: this.options.buttonParent,
			textContent: this._buttonLabel(),
			// Drawn as a field, like the selects it sits among
			styles: ({ input }) => `
				${input}
				width: auto;
				flex: none;
			`,
			onPointerPress: event => {
				event.preventDefault();
				event.stopPropagation();

				// The button may sit scrolled out of a filter row that overflows; the popover opens under where it shows
				this.button.elem.scrollIntoView({ block: 'nearest', inline: 'nearest' });

				const rect = this.button.elem.getBoundingClientRect();

				this.open({ x: rect.left + rect.width / 2, y: rect.bottom + 6 });
			},
		});

		if (this.options.searchable) {
			this.search = new Input({
				appendTo: this,
				addClass: 'filterSearch',
				type: 'search',
				placeholder: `Filter ${this.options.label}...`,
				onInput: ({ value }) => {
					this._query = value.toLowerCase();
					this._renderList();
				},
			});
		}

		// Rows are plain Elems; the list delegates their presses
		this.list = new Component({
			appendTo: this,
			addClass: 'filterList',
			onPointerPress: event => {
				const value = event.target.closest('.filterRow')?.dataset.value;

				if (value) this.toggle(value);
			},
		});

		this.footer = new Elem(
			{ appendTo: this, addClass: 'filterFooter' },
			new Button({ textContent: 'Clear', variant: 'flat', onPointerPress: () => this.clear() }),
			new Button({ textContent: 'Done', onPointerPress: () => this.close() }),
		);

		const keyBinds = ({ key }) => {
			if (this.isOpen && key === 'Escape') this.close();
		};
		const pointerBinds = ({ target }) => {
			if (!this.isOpen || !target.isConnected) return;
			if (isDescendantOf(target, this.elem) || target === this.elem) return;
			// The button toggles the popover itself, don't also close on its press
			if (target === this.button.elem || isDescendantOf(target, this.button.elem)) return;

			this.close();
		};

		document.addEventListener('keyup', keyBinds);
		document.addEventListener('pointerdown', pointerBinds);

		this.addCleanup('multiselectFilter', () => {
			document.removeEventListener('keyup', keyBinds);
			document.removeEventListener('pointerdown', pointerBinds);
		});
	}

	// {value: count} vocabulary, rows below minCount are hidden (can't group anything)
	setVocabulary(counts) {
		this._vocab = counts;

		if (this.isOpen) this._renderList();
	}

	_buttonLabel() {
		const count = this.selected.size;

		if (count === 0) return `Any ${this.options.label}`;

		return `${capitalize(this.options.label)} (${count})`;
	}

	_renderList() {
		this.list.empty();

		const minCount = this.options.minCount || 1;

		const entries = Object.entries(this._vocab)
			// Below the min-count threshold a value can't group anything (useless as a filter),
			// but keep any already-selected so an externally-added one can still be removed here
			.filter(([value, count]) => count >= minCount || this.selected.has(value))
			.filter(([value]) => !this._query || value.toLowerCase().includes(this._query))
			.sort((a, b) => {
				const selA = this.selected.has(a[0]);
				const selB = this.selected.has(b[0]);

				if (selA !== selB) return selA ? -1 : 1;
				if (a[1] !== b[1]) return b[1] - a[1];

				return a[0].localeCompare(b[0]);
			});

		for (const [value, count] of entries) {
			const selected = this.selected.has(value);

			new Elem({
				appendTo: this.list,
				addClass: selected ? ['filterRow', 'selected'] : ['filterRow'],
				attributes: { 'data-value': value },
				append: [
					new Icon({ addClass: 'check', icon: selected ? 'check' : undefined }),
					new Elem({ tag: 'span', textContent: value }),
					...(this.options.showCounts && count != null
						? [new Elem({ tag: 'span', addClass: 'count', textContent: String(count) })]
						: []),
				],
			});
		}
	}

	// Named `emit`, not `onChange`: vanilla-bean auto-wires any on* option as a DOM event
	// listener, so `onChange` would also fire on the search input's bubbling change event.
	_emit() {
		this.button.options.textContent = this._buttonLabel();
		this.options.emit?.([...this.selected]);
	}

	toggle(value) {
		if (this.selected.has(value)) this.selected.delete(value);
		else this.selected.add(value);

		this._renderList();
		this._emit();
	}

	addValue(value) {
		if (this.selected.has(value)) return;

		this.selected.add(value);
		this._emit();
	}

	clear() {
		if (this.selected.size === 0) return;

		this.selected.clear();
		this._renderList();
		this._emit();
	}

	open(options) {
		this._renderList();

		super.open(options);

		if (this.search) requestAnimationFrame(() => this.search.elem.focus());
	}
}
