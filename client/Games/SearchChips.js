import { Component, Elem, Button, styled } from '@vanilla-bean/components';

const Container = styled(
	Component,
	({ colors }) => `
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 4px;
		flex: 3;
		min-width: 200px;
		margin: 6px;
		min-height: 2.4rem;
		padding: 2px 6px;
		box-sizing: border-box;
		border: 1px solid ${colors.gray};
		border-radius: 3px;
		background-color: ${colors.darkest(colors.gray)};
		cursor: text;

		&:focus-within {
			border-color: ${colors.light(colors.blue)};
		}

		input {
			flex: 1;
			min-width: 120px;
			border: none;
			outline: none;
			background: transparent;
			color: ${colors.white};
			height: 2rem;
			padding: 0 3px;
		}
	`,
);

const Chip = styled(
	Component,
	({ colors }) => `
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 2px 4px 2px 8px;
		font-size: 0.85em;
		background-color: ${colors.black};
		border: 1px solid ${colors.alpha(colors.teal, 0.5)};
		border-radius: 3px;
		white-space: nowrap;

		button {
			width: 16px !important;
			height: 16px !important;
			font-size: 9px;
			padding: 0;
			opacity: 0.5;
			background: transparent !important;

			&:after { display: none; }

			&:hover { opacity: 1; }
		}
	`,
);

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
			new Button({ icon: 'close', onPointerPress: () => this.removeChip(chip) }),
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
