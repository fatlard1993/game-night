import { Component, Elem, Icon, TagList, styled } from '@vanilla-bean/components';

import { gameFileUrl } from '../api';
import { gameImageIds, gameMetaLabel } from './util';

// click isn't in the default event set; the anchor-like tag press wants full
// click semantics (fires after pointerup, cancels on drag-away)
class ClickTagList extends TagList {
	static events = ['click'];
}

const Card = styled(
	Component,
	({ colors }) => `
		display: flex;
		flex-direction: column;
		width: 216px;
		border: 1px solid ${colors.alpha(colors.gray, 0.5)};
		border-radius: 6px;
		overflow: hidden;
		cursor: pointer;
		background-color: ${colors.alpha(colors.white, 0.03)};
		transition: border-color 0.2s, transform 0.2s;

		/* Skip layout/paint for off-screen cards, the big win for a 150+ card grid.
		   'auto' height remembers each card's real size once rendered, so the scrollbar stays stable. */
		content-visibility: auto;
		contain-intrinsic-size: auto 290px;

		&:hover, &:focus-within {
			border-color: ${colors.light(colors.blue)};
			transform: translateY(-2px);
		}

		/* readOnly TagList disables pointer events, tags here are search shortcuts */
		ul.readOnly {
			pointer-events: auto;

			li {
				cursor: pointer;

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
		height: 120px;
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

const Body = styled.Component`
	display: flex;
	flex-direction: column;
	gap: 4px;
	padding: 9px 12px 12px;
`;

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
		color: ${colors.light(colors.gray)};
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

// Tag presses add a search chip instead of opening the game; swallow the events
// the card's own onPointerPress would otherwise receive. Returns the pressed tag.
const swallowTagEvent = event => {
	const tag = event.target.closest('li[data-value]')?.dataset.value;

	if (!tag) return;

	event.preventDefault();
	event.stopPropagation();

	return tag;
};

export default class GameCard extends Card {
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
			this.tagList = new ClickTagList({
				appendTo: this.body,
				readOnly: true,
				tags: game.tags,
				onPointerDown: swallowTagEvent,
				onPointerUp: swallowTagEvent,
				onClick: event => {
					const tag = swallowTagEvent(event);

					if (tag) this.options.onTagPress?.(tag);
				},
			});
		}
	}
}
