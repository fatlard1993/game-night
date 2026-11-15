import { Card, Component, Elem, Icon, List, Tag, styled } from '@vanilla-bean/components';

import { gameFileUrl } from '../api';
import { gamePath, tagSearchPath } from '../paths';
import { coverIcon, gameImageIds, gameMetaLabel } from './gameModel';

// The cover runs to the card's edges; only the body below it is padded. The card isn't itself a link, since its tags
// are links of their own and an <a> can't hold another: its name is the link to the game, stretched over the whole
// card, and the tags sit above that. So the card hovers and shows focus as a linked Card does, for its name's link.
const CoverCard = styled(
	Card,
	({ colors, focusRing, space }) => `
		position: relative;
		display: flex;
		flex-direction: column;
		padding: 0;
		overflow: hidden;
		cursor: pointer;

		&:hover, &:has(a.name:focus-visible) {
			background-color: ${colors.alpha(colors.white, 0.09)};
		}

		&:has(a.name:focus-visible) {
			${focusRing()}
		}

		/* Skip layout/paint for off-screen cards, the big win for a 150+ card grid.
		   'auto' height remembers each card's real size once rendered, so the scrollbar stays stable. */
		content-visibility: auto;
		contain-intrinsic-size: auto 290px;

		/* Each tag is a link to its search, above the name's link that covers the card */
		ul.tags {
			position: relative;
			z-index: 1;
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			gap: ${space.xs};
			min-width: 0;
			margin: 0;

			/* Only as tall as its tag */
			li {
				display: flex;
				max-width: 100%;
			}

			a {
				cursor: pointer;
				color: inherit;
				text-decoration: none;

				/* Long tags clamp to the card width on narrow columns; inline-block
				   (over the Tag default inline-flex) lets text-overflow apply */
				display: inline-block;
				max-width: 100%;
				box-sizing: border-box;
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

		.icon {
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

// The link to the game; its ::after covers the card, so a press anywhere on it (a middle press too) opens the game
const Name = styled.Component`
	font-weight: bold;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	color: inherit;
	text-decoration: none;

	&:focus-visible {
		outline: none;
	}

	&::after {
		content: '';
		position: absolute;
		inset: 0;
	}
`;

const Meta = styled(
	Component,
	({ colors, fontSize }) => `
		font-size: ${fontSize.sm};
		color: ${colors.muted};
	`,
);

// A plain press on a tag adds it to the library's search in place; a press for a new tab is the browser's
const plainPress = event => event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;

export default class GameCard extends CoverCard {
	static schema = {
		game: {},
		onTagPress: {},
		// tag => the address of the library searched for it; the tag alone unless said
		tagHref: {},
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

		// The link to the game, so middle and modified clicks open it in a new tab and it shows its address
		new Name({
			tag: 'a',
			addClass: 'name',
			appendTo: this.body,
			href: gamePath(game.id),
			textContent: game.name,
			title: game.name,
		});

		const meta = gameMetaLabel(game);

		if (meta) new Meta({ appendTo: this.body, textContent: meta });

		if (game.tags?.length > 0) {
			const { tagHref = tagSearchPath } = this.options;

			this.tags = new List({
				noStyle: true,
				addClass: 'tags',
				appendTo: this.body,
				'aria-label': 'Tags',
				items: game.tags.map(tag => ({
					append: new Tag({
						tag: 'a',
						readOnly: true,
						href: tagHref(tag),
						textContent: tag,
						title: `Search for ${tag}`,
						onPointerPress: event => {
							if (!plainPress(event) || !this.options.onTagPress) return;

							event.preventDefault();
							this.options.onTagPress(tag);
						},
					}),
				})),
			});
		}
	}
}
