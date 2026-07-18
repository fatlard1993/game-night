import { Dialog, Component, conditionalList, styled } from '@vanilla-bean/components';

import { createGame, updateGame, uploadGameFile, deleteGameFile, getGames } from '../../api';
import { navigate } from '../../router';
import { validateForm, parseLinks, otherGameNames, asNumber } from '../util';

import confirmDeleteGame from '../confirmDeleteGame';
import GameForm from './GameForm';

const ErrorNote = styled(
	Component,
	({ colors }) => `
		color: ${colors.light(colors.red)};
		margin: 9px 0 0;
	`,
);

export default class GameDialog extends Dialog {
	constructor(options = {}) {
		const isEdit = !!options.game?.id;

		super({
			size: 'large',
			header: `${isEdit ? 'Edit' : 'Add'} Game${isEdit ? ` | ${options.game.name}` : ''}`,
			buttons: conditionalList([{ alwaysItem: 'Save' }, { if: isEdit, thenItem: 'Delete' }, { alwaysItem: 'Cancel' }]),
			onButtonPress: async ({ button }) => {
				if (button === 'Save') {
					if (validateForm(this.form)) return;
					if (!(await this.save())) return;
				} else if (button === 'Delete') {
					confirmDeleteGame(this.options.game);
				}

				this.close();
			},
			...options,
		});
	}

	static schema = {
		game: {},
	};

	build() {
		super.build();

		this.form = new GameForm({
			appendTo: this._body,
			data: this.options.game,
		});

		this._loadGameNames();
	}

	// Feeds the related-games picker's autocomplete/verification list; the dialog can open
	// before this lands, and can close before it resolves.
	async _loadGameNames() {
		this._gamesRequest = await getGames({
			onSuccess: response => {
				if (!this.elem?.isConnected) return;

				this.form.setGameNames(otherGameNames(response.body, this.options.game?.id));
			},
		});

		this.addCleanup('gamesRequest', () => this._gamesRequest?.unsubscribe?.());
	}

	// hypertether doesn't throw on HTTP errors; every mutation gets its ok checked and a failure
	// keeps the dialog open with the reason instead of closing as if it worked
	async save() {
		const { links, playersMin, playersMax, playTimeMin, playTimeMax, ...rest } = this.form.options.data;

		const body = {
			...rest,
			// Number inputs hand back strings; store real numbers, or '' for unset
			playersMin: asNumber(playersMin) ?? '',
			playersMax: asNumber(playersMax) ?? '',
			playTimeMin: asNumber(playTimeMin) ?? '',
			playTimeMax: asNumber(playTimeMax) ?? '',
			links: parseLinks(links),
			related: this.form.getRelated(),
			tags: this.form.getTags(),
		};

		// Recomputed here (not the constructor's snapshot): a failed Add may have already created
		// the game below, and the retry must update it rather than create a duplicate
		const isEdit = !!this.options.game?.id;
		let id = this.options.game?.id;

		const saved = isEdit ? await updateGame(id, { body }) : await createGame({ body });

		if (!saved.response?.ok) return this._showError('Save failed', saved);

		if (!isEdit) {
			id = saved.body.id;
			this.options.game = saved.body;
		}

		// Attachments go through their own endpoints, binary payloads never ride
		// along on the regular game create/update
		for (const file of this.form.getPendingFiles()) {
			const uploaded = await uploadGameFile(id, file);

			if (!uploaded.response?.ok)
				return this._showError(`"${file.name}" upload failed (the game itself saved)`, uploaded);

			this.form.markUploaded(file);
		}

		for (const fileId of [...this.form.removedFileIds]) {
			const removed = await deleteGameFile(id, fileId);

			if (!removed.response?.ok) return this._showError('File delete failed (the game itself saved)', removed);

			this.form.removedFileIds.delete(fileId);
		}

		// A new game lands on its page, ready for rules to be written
		if (!isEdit) navigate(`/games/${id}`);

		return true;
	}

	_showError(message, { response, body }) {
		const detail = (typeof body === 'string' && body) || body?.error || `HTTP ${response?.status || '?'}`;

		this._error ||= new ErrorNote({ appendTo: this._body });
		this._error.options.textContent = `${message}: ${detail}`;

		return false;
	}
}
