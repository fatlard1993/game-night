import { TagList } from '@vanilla-bean/components';

// TagList restricted to a fixed vocabulary (the rest of the library's game names): a name only lands
// as a tag once it case-insensitively matches one, in that game's own spelling, so a typo can't turn
// into a broken related-game link. The names are also offered as suggestions while typing.
export default class RelatedGamesInput extends TagList {
	static schema = {
		gameNames: {
			get default() {
				return [];
			},
			set(value) {
				this.options.suggestions = value;
			},
		},
		accept: {
			default: (value, tagList) =>
				tagList.options.gameNames.find(name => name.toLowerCase() === value.toLowerCase()) ?? false,
		},
	};
}
