import { TagList, styled } from '@vanilla-bean/components';

const StyledComponent = styled(
	TagList,
	({ colors }) => `
		input.invalid {
			border-color: ${colors.red} !important;
		}
	`,
);

// TagList restricted to a fixed vocabulary (the rest of the library's game names): typing a name
// only lands as a tag once it case-insensitively matches one, so a typo can't turn into a broken
// related-game link. The datalist gives autocomplete; the input flashes red and keeps the typed
// text on a miss instead of silently dropping it.
export default class RelatedGamesInput extends StyledComponent {
	static schema = {
		gameNames: {
			get default() {
				return [];
			},
			set(value) {
				this._datalist?.replaceChildren(...value.map(name => new Option(name)));
			},
		},
	};

	build() {
		super.build();

		if (!this.tagInput) return; // readOnly TagLists never get an input

		const listId = `list-${this.uniqueId}`;

		this._datalist = document.createElement('datalist');
		this._datalist.id = listId;
		this._datalist.replaceChildren(...this.options.gameNames.map(name => new Option(name)));

		this.elem.append(this._datalist);

		this.tagInput.setOptions({ attributes: { list: listId } });
	}

	_addTag(rawValue) {
		const value = (rawValue || '').trim();

		if (!value) return;

		const match = this.options.gameNames.find(name => name.toLowerCase() === value.toLowerCase());

		if (!match) {
			this.tagInput.addClass('invalid');
			this.tagInput.elem.select();

			clearTimeout(this._invalidTimeout);
			this._invalidTimeout = setTimeout(() => this.tagInput.removeClass('invalid'), 600);

			return;
		}

		this.tagInput.removeClass('invalid');

		super._addTag(match);
	}
}
