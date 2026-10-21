import { Component, Elem, Button, styled } from '@vanilla-bean/components';

// Drawn as the theme's field, with the chips and the text input inside it
const Container = styled(
	Component,
	({ input, colors, space }) => `
		${input}

		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: ${space.xs};
		flex: 3;
		min-width: 200px;
		padding: 2px 6px;
		cursor: text;

		/* The field look is the container's; the input inside it is bare, focused or not */
		& input, & input:focus {
			flex: 1;
			min-width: 120px;
			border: none;
			outline: none;
			box-shadow: none;
			background: transparent;
			color: ${colors.white};
			height: 26px;
			padding: 0 2px;
		}
	`,
);

const Chip = styled(
	Component,
	({ colors, radius, space }) => `
		display: inline-flex;
		align-items: center;
		gap: ${space.xs};
		padding: 0 2px 0 8px;
		font-size: 0.85em;
		border: 1px solid ${colors.light(colors.blue)};
		border-radius: ${radius.pill};
		background-color: ${colors.alpha(colors.blue, 0.3)};
		white-space: nowrap;
	`,
);

// The chip's own small remove control, smaller than the default icon button
const removeStyles = () => `
	&, &:empty, &.icon {
		width: 18px;
		height: 18px;
		font-size: 9px;
		border-radius: 50%;
	}
`;

/**
 * Search input that accumulates committed terms as removable chips alongside live free text.
 * Enter (or comma) commits the current text as a chip; backspace on empty text pops the last chip.
 * Emits { chips, text } through onSearchChange on every change.
 */
export default class SearchChips extends Container {
	static schema = {
		placeholder: {},
		initialText: {},
		initialChips: {},
		onSearchChange: {},
	};

	build() {
		this.chips = [];

		this.input = new Component({
			tag: 'input',
			appendTo: this,
			attributes: { type: 'text', placeholder: this.options.placeholder || 'Search...' },
			onKeydown: event => {
				if (event.key === 'Enter' || event.key === ',') {
					event.preventDefault();
					this.commitText();
				} else if (event.key === 'Backspace' && this.input.elem.value === '') {
					this.removeChip(this.chips.at(-1));
				} else if (event.key === 'Escape') {
					event.preventDefault();
					this.input.elem.blur();
				}
			},
			onInput: () => this._emit(),
		});

		// Clicking the container's padding focuses the input, like a native text field
		this.onPointerPress(event => {
			if (event.target === this.elem) {
				event.preventDefault();
				this.input.elem.focus();
			}
		});

		if (this.options.initialText) {
			this.input.elem.value = this.options.initialText;
		}

		// Restore chips from a shared URL without re-emitting (Games already has the state)
		for (const term of this.options.initialChips || []) this._createChip(term);
	}

	get value() {
		return { chips: this.chips.map(chip => chip.term), text: this.input.elem.value };
	}

	set text(value) {
		this.input.elem.value = value;
		this._emit();
	}

	focus() {
		this.input.elem.focus();
	}

	commitText() {
		const term = this.input.elem.value.trim();

		if (!term) return;

		this.input.elem.value = '';
		this.addChip(term);
	}

	_createChip(term) {
		if (this.chips.some(chip => chip.term.toLowerCase() === term.toLowerCase())) return false;

		const chip = { term };

		chip.component = new Chip(
			{},
			new Elem({ tag: 'span', textContent: term }),
			new Button({
				icon: 'close',
				variant: 'flat',
				styles: removeStyles,
				onPointerPress: () => this.removeChip(chip),
			}),
		);

		this.chips.push(chip);
		this.elem.insertBefore(chip.component.elem, this.input.elem);

		return true;
	}

	addChip(term) {
		if (this._createChip(term)) this._emit();
	}

	removeChip(chip) {
		if (!chip) return;

		chip.component.elem.remove();
		this.chips = this.chips.filter(existing => existing !== chip);

		this._emit();
	}

	_emit() {
		this.options.onSearchChange?.(this.value);
	}
}
