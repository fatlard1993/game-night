import { Card, Component, Elem, Icon, TagList, styled } from '@vanilla-bean/components';

import { gameFileUrl } from '../api';
import { gameImageIds, gameMetaLabel } from './gameModel';

// The cover runs to the card's edges; only the body below it is padded
const CoverCard = styled(
	Card,
	({ colors }) => `
		display: flex;
		flex-direction: column;
		padding: 0;
		overflow: hidden;

		/* Skip layout/paint for off-screen cards, the big win for a 150+ card grid.
		   'auto' height remembers each card's real size once rendered, so the scrollbar stays stable. */
		content-visibility: auto;
		contain-intrinsic-size: auto 290px;

		/* readOnly TagList disables pointer events, tags here are search shortcuts */
		ul.readOnly {
			pointer-events: auto;

			li {
				cursor: pointer;

				/* Long tags clamp to the card width on narrow columns; inline-block
				   (over the Tag default inline-flex) lets text-overflow apply */
				display: inline-block;
				max-width: 100%;
				overflow: hidden;
				text-overflow: ellipsis;

				&:hover {
					border-color: ${colors.light(colors.teal)};
				}
			}
		}
	`,
);

const Cover = styled(
	Component,
	({ colors }) => `
		display: flex;
		align-items: center;
		justify-content: center;
		aspect-ratio: 9 / 5;
		overflow: hidden;
		background-color: ${colors.alpha(colors.black, 0.4)};

		img {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}

		i {
			font-size: 3em;
			color: ${colors.alpha(colors.gray, 0.8)};
		}
	`,
);

const Body = styled(
	Component,
	({ space }) => `
		display: flex;
		flex-direction: column;
		gap: ${space.xs};
		padding: ${space.sm} ${space.md} ${space.md};
	`,
);

const Name = styled.Component`
	font-weight: bold;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`;

const Meta = styled(
	Component,
	({ colors }) => `
		font-size: 0.8em;
		color: ${colors.muted};
	`,
);

// Fallback icon for coverless games, picked from the medium tag
const mediumIcons = {
	'board-game': 'chess-board',
	'card-game': 'heart',
	'dice-game': 'dice',
	'video-game': 'gamepad',
};

const coverIcon = game => {
	for (const tag of game.tags || []) {
		if (mediumIcons[tag]) return mediumIcons[tag];
	}

	return 'puzzle-piece';
};

// Tag presses add a search chip instead of opening the game; swallow the click
// the card's own onPointerPress would otherwise receive. Returns the pressed tag.
const swallowTagEvent = event => {
	const tag = event.target.closest('li[data-value]')?.dataset.value;

	if (!tag) return;

	event.preventDefault();
	event.stopPropagation();

	return tag;
};

export default class GameCard extends CoverCard {
	static schema = {
		game: {},
		onTagPress: {},
	};

	build() {
		const { game } = this.options;
		const [coverImageId] = gameImageIds(game);

		this.cover = new Cover({
			appendTo: this,
			append: coverImageId
				? new Elem({
						tag: 'img',
						src: gameFileUrl(game.id, coverImageId),
						alt: game.name,
						attributes: { loading: 'lazy', decoding: 'async' },
					})
				: new Icon({ icon: coverIcon(game) }),
		});

		this.body = new Body({ appendTo: this });

		new Name({ appendTo: this.body, textContent: game.name, title: game.name });

		const meta = gameMetaLabel(game);

		if (meta) new Meta({ appendTo: this.body, textContent: meta });

		if (game.tags?.length > 0) {
			this.tagList = new TagList({
				appendTo: this.body,
				readOnly: true,
				tags: game.tags,
				onClick: event => {
					const tag = swallowTagEvent(event);

					if (tag) this.options.onTagPress?.(tag);
				},
			});
		}
	}
}
