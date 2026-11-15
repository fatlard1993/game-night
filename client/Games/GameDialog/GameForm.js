import { Form, Select, Input, Label, Button, Elem, TagList, readFile, styled, theme } from '@vanilla-bean/components';

import { gameFileUrl } from '../../api';
import { COMPLEXITY_LEVELS, MAX_UPLOAD_BYTES, SETTINGS, serializeLinks } from '../gameModel';

import RelatedGamesInput from './RelatedGamesInput';

const FileRow = styled(
	Elem,
	({ colors, radius, space }) => `
		display: flex;
		align-items: center;
		gap: ${space.sm};
		margin: ${space.xs} 0;

		&.markedForRemoval span {
			text-decoration: line-through;
			color: ${colors.gray};
		}

		img {
			width: 24px;
			height: 24px;
			object-fit: cover;
			border-radius: ${radius.sm};
		}
	`,
);

export default class GameForm extends Form {
	static schema = {
		gameId: {},
		existingFiles: {},
	};

	constructor(options = {}) {
		// description and rules are edited on the game's page (markdown editor), and the Steam fields by the
		// import's background pass; none is edited here, and sending a stale copy back would clobber theirs
		const { files, id, description, rules, steamAppId, steamEnriched, ...gameData } = options.data || {};

		super({
			...options,
			data: {
				name: '',
				setting: 'Table',
				complexity: '',
				playersMin: '',
				playersMax: '',
				playTimeMin: '',
				playTimeMax: '',
				...gameData,
				links: serializeLinks(options.data?.links),
				tags: Array.isArray(gameData.tags) ? [...gameData.tags] : [],
				related: Array.isArray(gameData.related) ? [...gameData.related] : [],
			},
			gameId: id,
			existingFiles: files || {},
		});
	}

	build() {
		this._pendingFiles = [];
		this.removedFileIds = new Set();

		this.setOptions({
			inputs: [
				{ key: 'name', validate: value => (value ? null : 'Required') },
				{
					type: 'group',
					style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.space.sm },
					inputs: [
						{ key: 'setting', InputComponent: Select, options: SETTINGS },
						{
							key: 'complexity',
							InputComponent: Select,
							options: [{ label: 'Unset', value: '' }, ...COMPLEXITY_LEVELS],
						},
					],
				},
				{
					type: 'group',
					style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.space.sm },
					inputs: [
						{ key: 'playersMin', label: 'Min Players', type: 'number', min: 1 },
						{ key: 'playersMax', label: 'Max Players', type: 'number', min: 1 },
					],
				},
				{
					type: 'group',
					style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.space.sm },
					inputs: [
						{ key: 'playTimeMin', label: 'Min Play Time (minutes)', type: 'number', min: 1 },
						{ key: 'playTimeMax', label: 'Max Play Time (minutes)', type: 'number', min: 1 },
					],
				},
				{
					key: 'links',
					tag: 'textarea',
					placeholder: 'One per line: https://... or Label | https://...',
				},
				{ key: 'tags', InputComponent: TagList },
				{ key: 'related', label: 'Related Games', InputComponent: RelatedGamesInput },
			],
		});

		super.build();

		this._buildFilesSection();
	}

	// Fills in once the dialog's game-list fetch resolves; a name typed before then just won't
	// autocomplete/validate yet.
	setGameNames(gameNames) {
		this.inputElements.related.setOptions({ gameNames });
	}

	getPendingFiles() {
		return this._pendingFiles;
	}

	// A save retry after a partial failure must not re-upload what already landed
	markUploaded(pending) {
		this._pendingFiles = this._pendingFiles.filter(entry => entry !== pending);
	}

	_buildFilesSection() {
		this.fileList = new Elem();

		// The button opens the picker, and takes files dropped or pasted onto it
		const uploadButton = new Button({
			textContent: 'Attach files…',
			// Not a submit: the drop zone opens the picker
			onPointerPress: event => event.preventDefault(),
		});

		this.fileInput = new Input({
			type: 'file',
			multiple: true,
			accept: 'image/*,.pdf,.txt,.md',
			style: { display: 'none' },
			dropZone: uploadButton,
			onFiles: files => files.forEach(file => this._addPendingFile(file)),
		});

		this.append(
			new Label(
				{ label: 'Pictures & Attachments' },
				new Elem({ append: [this.fileList, uploadButton, this.fileInput] }),
			),
		);

		for (const [fileId, meta] of Object.entries(this.options.existingFiles)) {
			this._addFileRow({
				name: meta.name,
				previewSrc: meta.type?.startsWith('image/') && gameFileUrl(this.options.gameId, fileId),
				onRemove: row => {
					if (this.removedFileIds.has(fileId)) {
						this.removedFileIds.delete(fileId);
						row.removeClass('markedForRemoval');
					} else {
						this.removedFileIds.add(fileId);
						row.addClass('markedForRemoval');
					}
				},
			});
		}
	}

	async _addPendingFile(file) {
		// Said here, before the file is read and sent whole to be refused
		if (file.size > MAX_UPLOAD_BYTES) {
			this._addFileRow({
				name: `${file.name} is too large (${Math.round(MAX_UPLOAD_BYTES / 1_000_000)} MB at most)`,
				onRemove: row => row.elem.remove(),
			});

			return;
		}

		const dataUri = await readFile(file, 'dataURL');
		const pending = { name: file.name, dataUri };

		this._pendingFiles.push(pending);

		this._addFileRow({
			name: file.name,
			previewSrc: file.type.startsWith('image/') && dataUri,
			onRemove: row => {
				this._pendingFiles = this._pendingFiles.filter(entry => entry !== pending);
				row.elem.remove();
			},
		});
	}

	_addFileRow({ name, previewSrc, onRemove }) {
		const row = new FileRow({ appendTo: this.fileList });

		if (previewSrc) new Elem({ tag: 'img', appendTo: row, src: previewSrc, alt: name });

		new Elem({ tag: 'span', appendTo: row, textContent: name });

		new Button({
			appendTo: row,
			variant: 'flat',
			icon: 'close',
			title: `Remove ${name}`,
			onPointerPress: event => {
				event.preventDefault();
				onRemove(row);
			},
		});
	}
}
