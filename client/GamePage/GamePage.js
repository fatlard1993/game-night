import {
	View,
	Elem,
	Button,
	Card,
	Content,
	Dialog,
	EmptyState,
	Link,
	SectionLabel,
	TagList,
	Toolbar,
	styled,
	Component,
	theme,
} from '@vanilla-bean/components';
import { failureReason } from '@vanilla-bean/hypertether';

import { getGame, getGames, updateGame, gameFileUrl } from '../api';
import { navigate } from '../navigate';
import context from '../context';
import Markdown from '../Markdown';
import { safeUrl } from '../safeUrl';
import GameDialog from '../Games/GameDialog/GameDialog';
import LoginDialog from '../Games/LoginDialog';
import confirmDeleteGame from '../Games/confirmDeleteGame';
import { gameMetaLabel, gameImageIds, gameAttachmentIds, relatedGames } from '../Games/gameModel';
import MarkdownEditor from './MarkdownEditor';

// click isn't in the default event set; the back link wants full click semantics
// so middle/modified clicks open in a new tab while plain clicks stay in-app
class ClickLink extends Link {
	static events = ['click'];
}

const Body = styled(
	Component,
	({ space }) => `
		padding: ${space.md} 0 ${space.lg};
	`,
);

const Meta = styled(
	Component,
	({ colors, space }) => `
		color: ${colors.muted};
		margin: 0 0 ${space.sm};
	`,
);

const Section = styled(
	Component,
	({ space }) => `
		margin: 0 0 ${space.lg};
	`,
);

const Gallery = styled(
	Component,
	({ radius, space }) => `
		display: flex;
		flex-wrap: wrap;
		gap: ${space.sm};
		margin: 0 0 ${space.lg};

		a {
			display: block;
			line-height: 0;
		}

		img {
			max-height: 200px;
			max-width: 100%;
			border-radius: ${radius.md};
		}
	`,
);

const EditBar = styled(
	Component,
	({ space }) => `
		display: flex;
		gap: ${space.md};
		margin: 0 0 ${space.md};
	`,
);

const ErrorNote = styled(
	Component,
	({ colors, space }) => `
		color: ${colors.light(colors.danger)};
		margin: 0 0 ${space.md};

		&:empty { display: none; }
	`,
);

const RelatedRow = styled(
	Component,
	({ space }) => `
		display: flex;
		flex-wrap: wrap;
		gap: ${space.sm};
	`,
);

const RelatedCard = styled(
	Card,
	({ colors, radius, space }) => `
		display: flex;
		align-items: center;
		gap: ${space.sm};
		padding: ${space.xs} ${space.md} ${space.xs} ${space.xs};

		img, i {
			width: 36px;
			height: 36px;
			object-fit: cover;
			border-radius: ${radius.sm};
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
		this.header = new Toolbar({ appendTo: this, variant: 'bar', wrap: false });
		this.content = new Content({ appendTo: this, column: true });
	}

	async load() {
		// A re-render rebuilds the editors from the server's copy, so a background refetch
		// landing mid-sentence would take the sentence with it. Whatever arrives is kept; the
		// editors pick it up when they close.
		const repaint = () => {
			if (this.loaded && !this.editing) this.renderContent();
		};

		const receiveGame = response => {
			this.game = response;

			// The initial response also lands here; loaded gates a redundant first paint
			repaint();
		};

		const receiveGames = response => {
			this.games = response;

			repaint();
		};

		// The full library rides along for the related-games section; both fetches in parallel,
		// first paint waits on the slower of the two instead of the sum
		[this.game, this.games] = await Promise.all([
			getGame(this.options.id, { onSuccess: receiveGame, onError: receiveGame, scope: this.signal }),
			getGames({ onSuccess: receiveGames, onError: receiveGames, scope: this.signal }),
		]);

		this.loaded = true;

		const session = context.subscribe({ key: 'admin', callback: () => this.renderContent() });

		this.addCleanup('sessionSubscription', () => session.unsubscribe());

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
		// A failed request leaves an Error in body, which is truthy; rendering it as a game gave
		// a page with an undefined name and no content instead of saying what went wrong
		const failed = this.game?.status === 'error';
		const game = failed ? null : this.game.body;

		this.header.empty();
		this.header.elem.style.display = game ? '' : 'none';
		this.content.empty();

		if (!game) {
			new EmptyState({
				appendTo: this.content,
				icon: failed ? 'triangle-exclamation' : 'dice',
				title: failed ? 'Could not load this game' : 'Game not found',
				message: failed ? failureReason(this.game) : '',
				action: failed ? { textContent: 'Try again', onPointerPress: () => this.game.refetch?.() } : undefined,
				append: this._backLink({ textContent: 'Back to library' }),
			});

			return;
		}

		this._renderHeader(game);

		this.body = new Body({ appendTo: this.content });

		if (this.editing) this._renderEditor(game);
		else this._renderReadme(game);
	}

	_renderHeader(game) {
		this.header.options.heading = game.name;

		this._backLink({ appendTo: this.header, addClass: 'start', icon: 'arrow-left' });

		// Editing writes, and every write needs an admin session; without one the page is
		// read-only rather than offering buttons the server would refuse
		if (!this.editing && context.admin) {
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
				onPointerPress: () => new GameDialog({ game, onDeleted: () => navigate(context.libraryUrl) }),
			});
			new Button({
				appendTo: this.header,
				icon: 'trash',
				title: 'Delete game',
				onPointerPress: () => confirmDeleteGame(game, () => navigate(context.libraryUrl)),
			});
		}

		// A game page is what gets shared as a link, so it is where someone often arrives wanting
		// to fix a typo in the rules. Without this the only way in is back to the library, which
		// nothing on the page says.
		if (!this.editing && !context.admin) {
			new Button({
				appendTo: this.header,
				variant: 'flat',
				icon: 'lock',
				title: 'Admin login',
				onPointerPress: () => new LoginDialog(),
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
							target: '_blank',
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
								style: { margin: `0 0 ${theme.space.xs}` },
								// Link urls are stored as typed; the href is an anchor property assignment,
								// so an executable scheme would run on click without this
								append: new Link({ href: safeUrl(url), target: '_blank', textContent: label || url }),
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
				style: { margin: `${theme.space.md} 0`, fontStyle: 'italic' },
				textContent: context.admin
					? 'No description or rules yet .. Use the Edit button to write them'
					: 'No description or rules yet',
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
								style: { margin: `0 0 ${theme.space.xs}` },
								append: new Link({
									href: gameFileUrl(game.id, fileId),
									target: '_blank',
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
							onPointerPress: () => navigate(`/games/${other.id}`),
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

	// True when the editors hold something the server doesn't have yet
	_editsPending() {
		if (!this.editing || !this.descriptionEditor) return false;

		const { description = '', rules = '' } = this._editorBaseline || {};

		return this.descriptionEditor.value !== description || this.rulesEditor.value !== rules;
	}

	_renderEditor(game) {
		this._editorBaseline = { description: game.description || '', rules: game.rules || '' };

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

		// Covers the tab close, the back button, and the dev hot-reload, none of which route
		// through Cancel
		const warn = event => {
			if (!this._editsPending()) return;

			event.preventDefault();
			event.returnValue = '';
		};

		window.addEventListener('beforeunload', warn);
		// replaceCleanup: renderContent runs again on every background refetch while editing
		this.replaceCleanup('unsavedGuard', () => window.removeEventListener('beforeunload', warn));

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
							this.saveError.options.textContent = `Save failed: ${failureReason(result)}`;

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
					onPointerPress: async () => {
						// Rules get written here in long sittings; discarding them on a single stray tap,
						// with no undo and no draft anywhere, is the most expensive slip on the page
						if (
							this._editsPending() &&
							!(await Dialog.confirm({
								variant: 'warning',
								header: 'Discard changes?',
								body: 'Your unsaved edits to the description and rules will be lost.',
								confirmLabel: 'Discard',
								cancelLabel: 'Keep editing',
							}))
						) {
							return;
						}

						this.editing = false;
						this.renderContent();
					},
				}),
			],
		});

		this.saveError = new ErrorNote({ appendTo: this.body });
	}
}
