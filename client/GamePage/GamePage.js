import { View, Elem, Button, Link, TagList, styled, Component } from '@vanilla-bean/components';

import { getGame, getGames, updateGame, gameFileUrl } from '../api';
import { navigate } from '../router';
import context from '../context';
import { Content } from '../Layout';
import Markdown from '../Markdown';
import GameDialog from '../Games/GameDialog';
import confirmDeleteGame from '../Games/confirmDeleteGame';
import { gameMetaLabel, gameImageIds, gameAttachmentIds, relatedGames } from '../Games/util';
import MarkdownEditor from './MarkdownEditor';

// click isn't in the default event set; the back link wants full click semantics
// so middle/modified clicks open in a new tab while plain clicks stay in-app
class ClickLink extends Link {
	static events = ['click'];
}

const Header = styled.Component`
	display: flex;
	align-items: center;
	gap: 12px;
	margin: 12px;
`;

const Title = styled.Component`
	font-size: 1.5em;
	font-weight: bold;
	flex: 1;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`;

const Body = styled.Component`
	padding: 0 18px 18px;
	max-width: 980px;
`;

const Meta = styled(
	Component,
	({ colors }) => `
		color: ${colors.light(colors.gray)};
		margin: 0 0 9px;
	`,
);

const Section = styled.Component`
	margin: 0 0 18px;
`;

const SectionLabel = styled(
	Component,
	({ colors }) => `
		font-size: 0.8em;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: ${colors.light(colors.gray)};
		margin: 0 0 3px;
	`,
);

const Gallery = styled.Component`
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
	margin: 0 0 18px;

	a {
		display: block;
		line-height: 0;
	}

	img {
		max-height: 200px;
		max-width: 100%;
		border-radius: 6px;
	}
`;

const EditBar = styled.Component`
	display: flex;
	gap: 12px;
	margin: 0 0 12px;
`;

const ErrorNote = styled(
	Component,
	({ colors }) => `
		color: ${colors.light(colors.red)};
		margin: 0 0 12px;

		&:empty { display: none; }
	`,
);

const RelatedRow = styled.Component`
	display: flex;
	flex-wrap: wrap;
	gap: 9px;
`;

const RelatedCard = styled(
	Component,
	({ colors }) => `
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 4px 12px 4px 4px;
		border: 1px solid ${colors.alpha(colors.gray, 0.5)};
		border-radius: 6px;
		cursor: pointer;
		background-color: ${colors.alpha(colors.white, 0.03)};
		transition: border-color 0.2s;

		&:hover {
			border-color: ${colors.light(colors.blue)};
		}

		img, i {
			width: 36px;
			height: 36px;
			object-fit: cover;
			border-radius: 4px;
		}

		i {
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 1.2em;
			color: ${colors.alpha(colors.gray, 0.8)};
			background-color: ${colors.alpha(colors.black, 0.4)};
		}
	`,
);

export default class GamePage extends View {
	constructor(options) {
		super({
			onConnected: () => this.load(),
			...options,
		});
	}

	build() {
		this.header = new Header({ appendTo: this });
		this.content = new Content({ appendTo: this });
	}

	async load() {
		// The full library rides along for the related-games section; both fetches in parallel,
		// first paint waits on the slower of the two instead of the sum
		[this.game, this.games] = await Promise.all([
			getGame(this.options.id, {
				onSuccess: response => {
					this.game = response;

					// The initial response also lands here; loaded gates a redundant first paint
					if (this.loaded) this.renderContent();
				},
			}),
			getGames({
				onSuccess: response => {
					this.games = response;

					if (this.loaded) this.renderContent();
				},
			}),
		]);

		this.addCleanup('gameRequests', () => {
			this.game?.unsubscribe?.();
			this.games?.unsubscribe?.();
		});

		this.loaded = true;
		this.renderContent();
	}

	// The back arrow is a real link: its href tracks the remembered filtered-library URL,
	// so middle/modified clicks open it in a new tab while plain clicks stay in-app
	_backLink(options) {
		return new ClickLink({
			variant: 'button',
			href: context.subscriber('libraryUrl', url => url),
			title: 'Back to library',
			tooltip: null,
			onClick: event => {
				if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

				event.preventDefault();
				navigate(context.libraryUrl);
			},
			...options,
		});
	}

	renderContent() {
		const game = this.game.body;

		this.header.empty();
		this.content.empty();

		if (!game) {
			new Elem({ appendTo: this.content, style: { margin: '24px' }, textContent: 'Game not found' });
			this._backLink({
				appendTo: this.content,
				textContent: 'Back to library',
				style: { margin: '0 24px' },
			});

			return;
		}

		this._renderHeader(game);

		this.body = new Body({ appendTo: this.content });

		if (this.editing) this._renderEditor(game);
		else this._renderReadme(game);
	}

	_renderHeader(game) {
		this._backLink({ appendTo: this.header, icon: 'arrow-left' });

		new Title({ appendTo: this.header, textContent: game.name, title: game.name });

		if (!this.editing) {
			new Button({
				appendTo: this.header,
				icon: 'pen',
				textContent: ' Edit',
				title: 'Edit description & rules',
				onPointerPress: () => {
					this.editing = true;
					this.renderContent();
				},
			});
			new Button({
				appendTo: this.header,
				icon: 'gear',
				textContent: ' Details',
				title: 'Edit metadata, tags, links & files',
				onPointerPress: () => new GameDialog({ game }),
			});
			new Button({
				appendTo: this.header,
				icon: 'trash',
				title: 'Delete game',
				onPointerPress: () => confirmDeleteGame(game, () => navigate(context.libraryUrl)),
			});
		}
	}

	_renderReadme(game) {
		const meta = gameMetaLabel(game);

		if (meta) new Meta({ appendTo: this.body, textContent: meta });

		if (game.tags?.length > 0) {
			new Section({ appendTo: this.body, append: new TagList({ readOnly: true, tags: game.tags }) });
		}

		const imageIds = gameImageIds(game);

		if (imageIds.length > 0) {
			new Gallery({
				appendTo: this.body,
				append: imageIds.map(
					fileId =>
						new Link({
							href: gameFileUrl(game.id, fileId),
							attributes: { target: '_blank' },
							append: new Elem({
								tag: 'img',
								src: gameFileUrl(game.id, fileId),
								alt: game.files[fileId].name,
								loading: 'lazy',
							}),
						}),
				),
			});
		}

		if (game.description) new Markdown({ appendTo: this.body, md: game.description });

		if (game.links?.length > 0) {
			new Section({
				appendTo: this.body,
				append: [
					new SectionLabel({ textContent: 'Links' }),
					...game.links.map(
						({ label, url }) =>
							new Elem({
								style: { margin: '0 0 3px' },
								append: new Link({ href: url, attributes: { target: '_blank' }, textContent: label || url }),
							}),
					),
				],
			});
		}

		if (game.rules) {
			new Section({
				appendTo: this.body,
				append: [new SectionLabel({ textContent: 'Rules' }), new Markdown({ md: game.rules })],
			});
		}

		if (!game.description && !game.rules) {
			new Elem({
				appendTo: this.body,
				style: { margin: '12px 0', fontStyle: 'italic' },
				textContent: 'No description or rules yet .. Use the Edit button to write them',
			});
		}

		const attachmentIds = gameAttachmentIds(game);

		if (attachmentIds.length > 0) {
			new Section({
				appendTo: this.body,
				append: [
					new SectionLabel({ textContent: 'Attachments' }),
					...attachmentIds.map(
						fileId =>
							new Elem({
								style: { margin: '0 0 3px' },
								append: new Link({
									href: gameFileUrl(game.id, fileId),
									attributes: { target: '_blank' },
									textContent: game.files[fileId].name,
								}),
							}),
					),
				],
			});
		}

		this._renderRelated(game);
	}

	_renderRelated(game) {
		const related = relatedGames(game, this.games?.body || {});

		if (related.length === 0) return;

		new Section({
			appendTo: this.body,
			append: [
				new SectionLabel({ textContent: 'Related Games' }),
				new RelatedRow({
					append: related.map(other => {
						const [coverId] = gameImageIds(other);

						return new RelatedCard({
							onPointerPress: event => {
								if (event.button === 0) navigate(`/games/${other.id}`);
							},
							append: [
								coverId
									? new Elem({ tag: 'img', src: gameFileUrl(other.id, coverId), alt: other.name, loading: 'lazy' })
									: new Elem({ tag: 'i', addClass: ['fa-support', 'fa-dice'] }),
								new Elem({ tag: 'span', textContent: other.name }),
							],
						});
					}),
				}),
			],
		});
	}

	_renderEditor(game) {
		this.descriptionEditor = new MarkdownEditor({
			appendTo: this.body,
			label: 'Description',
			value: game.description,
			placeholder: 'What is this game? Markdown supported...',
		});

		this.rulesEditor = new MarkdownEditor({
			appendTo: this.body,
			label: 'Rules',
			value: game.rules,
			placeholder: 'How to play: setup, turns, scoring, winning. Markdown supported...',
		});

		new EditBar({
			appendTo: this.body,
			append: [
				new Button({
					textContent: 'Save',
					onPointerPress: async () => {
						const result = await updateGame(game.id, {
							body: { description: this.descriptionEditor.value, rules: this.rulesEditor.value },
						});

						// A failed save keeps the editors (and their text) up instead of
						// silently discarding the edit
						if (!result.response?.ok) {
							this.saveError.options.textContent = `Save failed: ${result.body?.error || `HTTP ${result.response?.status || '?'}`}`;

							return;
						}

						this.editing = false;

						// The invalidation-triggered refetch also lands here shortly; render the
						// PATCH response now so leaving edit mode isn't a frame behind
						if (result.body?.id) this.game.body = result.body;

						this.renderContent();
					},
				}),
				new Button({
					textContent: 'Cancel',
					onPointerPress: () => {
						this.editing = false;
						this.renderContent();
					},
				}),
			],
		});

		this.saveError = new ErrorNote({ appendTo: this.body });
	}
}
