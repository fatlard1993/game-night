import { styled, Component, Elem, Input, Button, isDescendantOf } from '@vanilla-bean/components';

const capitalize = word => word.charAt(0).toUpperCase() + word.slice(1);

// A multiselect OR filter: a button that opens a searchable checklist popover over a dynamic
// {value: count} vocabulary (counts shown, values below minCount hidden). Owns its own button.
export default class MultiselectFilter extends styled.Popover(
	({ colors }) => `
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
			border-bottom: 1px solid ${colors.light(colors.gray)};
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
			gap: 8px;
			padding: 5px 10px;
			cursor: pointer;
			white-space: nowrap;

			&:hover { background-color: ${colors.alpha(colors.blue, 0.2)}; }

			&.selected { background-color: ${colors.alpha(colors.teal, 0.25)}; }

			& .check {
				width: 14px;
				flex-shrink: 0;
				color: ${colors.light(colors.teal)};
			}

			& .count {
				margin-left: auto;
				padding-left: 12px;
				font-size: 0.8em;
				color: ${colors.light(colors.gray)};
			}
		}

		& .filterFooter {
			display: flex;
			justify-content: space-between;
			gap: 6px;
			padding: 6px;
			border-top: 1px solid ${colors.light(colors.gray)};
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
			styles: () => `
				margin: 6px 0;
				height: 2.4rem;
			`,
			onPointerPress: event => {
				event.preventDefault();
				event.stopPropagation();

				const rect = this.button.elem.getBoundingClientRect();

				this.show({ x: rect.left + rect.width / 2, y: rect.bottom + 6 });
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
			new Button({ textContent: 'Clear', onPointerPress: () => this.clear() }),
			new Button({ textContent: 'Done', onPointerPress: () => this.hide() }),
		);

		const keyBinds = ({ key }) => {
			if (this.isOpen && key === 'Escape') this.hide();
		};
		const pointerBinds = ({ target }) => {
			if (!this.isOpen || !target.isConnected) return;
			if (isDescendantOf(target, this.elem) || target === this.elem) return;
			// The button toggles the popover itself, don't also close on its press
			if (target === this.button.elem || isDescendantOf(target, this.button.elem)) return;

			this.hide();
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
					new Elem({ tag: 'span', addClass: 'check', textContent: selected ? '✓' : '' }),
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

	show(options) {
		this._renderList();

		super.show(options);

		if (this.search) requestAnimationFrame(() => this.search.elem.focus());
	}
}
