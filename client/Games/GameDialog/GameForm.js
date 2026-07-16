import { Form, Select, Input, Label, Button, Elem, TagList, styled } from '@vanilla-bean/components';

import { gameFileUrl } from '../../api';
import { COMPLEXITY_LEVELS, SETTINGS, serializeLinks, serializeRelated } from '../util';

const FileRow = styled(
	Elem,
	({ colors }) => `
		display: flex;
		align-items: center;
		gap: 6px;
		margin: 3px 0;

		&.markedForRemoval span {
			text-decoration: line-through;
			color: ${colors.gray};
		}

		img {
			width: 24px;
			height: 24px;
			object-fit: cover;
			border-radius: 3px;
		}
	`,
);

export default class GameForm extends Form {
	static schema = {
		gameId: {},
		existingTags: {},
		existingFiles: {},
	};

	constructor(options = {}) {
		// description and rules are edited on the game's page (markdown editor), not here,
		// excluding them keeps a stale dialog from clobbering page-side edits
		// eslint-disable-next-line no-unused-vars
		const { tags, files, id, description, rules, ...gameData } = options.data || {};

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
				related: serializeRelated(options.data?.related),
			},
			gameId: id,
			existingTags: Array.isArray(tags) ? tags : [],
			existingFiles: files || {},
		});
	}

	build() {
		this._pendingFiles = [];
		this.removedFileIds = new Set();

		this.setOptions({
			inputs: [
				{ key: 'name', validations: [[/.+/, 'Required']] },
				{
					type: 'group',
					style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' },
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
					style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' },
					inputs: [
						{ key: 'playersMin', label: 'Min Players', type: 'number', min: 1 },
						{ key: 'playersMax', label: 'Max Players', type: 'number', min: 1 },
					],
				},
				{
					type: 'group',
					style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' },
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
				{
					key: 'related',
					label: 'Related Games',
					tag: 'textarea',
					placeholder: 'One game name per line; pins them atop the auto-suggested related games',
				},
			],
		});

		super.build();

		this.tagList = new TagList({ tags: this.options.existingTags });

		this.append(new Label({ label: 'Tags' }, this.tagList));

		this._buildFilesSection();
	}

	getTags() {
		return Array.from(this.tagList.elem.querySelectorAll('li[data-value]')).map(el => el.dataset.value);
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

		this.fileInput = new Input({
			type: 'file',
			multiple: true,
			accept: 'image/*,.pdf,.txt,.md',
			style: { display: 'none' },
			onChange: ({ target }) => {
				for (const file of target.files) this._addPendingFile(file);

				target.value = '';
			},
		});

		const uploadButton = new Button({
			textContent: 'Attach files…',
			onPointerPress: event => {
				event.preventDefault();
				this.fileInput.elem.click();
			},
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

	_addPendingFile(file) {
		const reader = new FileReader();

		reader.onload = () => {
			const pending = { name: file.name, dataUri: reader.result };

			this._pendingFiles.push(pending);

			this._addFileRow({
				name: file.name,
				previewSrc: file.type.startsWith('image/') && reader.result,
				onRemove: row => {
					this._pendingFiles = this._pendingFiles.filter(entry => entry !== pending);
					row.elem.remove();
				},
			});
		};

		reader.readAsDataURL(file);
	}

	_addFileRow({ name, previewSrc, onRemove }) {
		const row = new FileRow({ appendTo: this.fileList });

		if (previewSrc) new Elem({ tag: 'img', appendTo: row, src: previewSrc, alt: name });

		new Elem({ tag: 'span', appendTo: row, textContent: name });

		new Button({
			appendTo: row,
			icon: 'close',
			onPointerPress: event => {
				event.preventDefault();
				onRemove(row);
			},
		});
	}
}
