import { FormDialog } from '@vanilla-bean/components';
import { failureReason } from '@vanilla-bean/hypertether';

import { createGame, updateGame, deleteGame, uploadGameFile, deleteGameFile, getGames } from '../../api';
import { navigate } from '../../navigate';
import { parseLinks, otherGameNames, asNumber } from '../gameModel';

import GameForm from './GameForm';

export default class GameDialog extends FormDialog {
	static schema = {
		game: {},
		onDeleted: {},
		size: { default: 'large' },
		FormComponent: { default: GameForm },
	};

	static prepareOptions(options) {
		const isEdit = !!options.game?.id;

		return {
			header: `${isEdit ? 'Edit' : 'Add'} Game${isEdit ? ` | ${options.game.name}` : ''}`,
			data: options.game,
			// A failed save keeps the dialog open with the reason
			onSave: (data, dialog) => dialog._saveGame(),
			...(isEdit && {
				confirmDelete: {
					header: `Delete "${options.game.name}"?`,
					body: 'This also deletes its pictures and attachments.',
				},
				onDelete: (data, dialog) => dialog._deleteGame(),
			}),
			...options,
		};
	}

	build() {
		super.build();

		this._loadGameNames();
	}

	// Feeds the related-games picker's autocomplete/verification list; the dialog can open
	// before this lands, and can close before it resolves.
	async _loadGameNames() {
		// A cached list arrives at once, while the dialog is still being built and not yet on the page; it is only a closed
		// dialog that should ignore it
		let closed = false;

		this.addCleanup('gameNamesClosed', () => (closed = true));

		this._gamesRequest = await getGames({
			onSuccess: response => {
				if (closed) return;

				this.form.setGameNames(otherGameNames(response.body, this.options.game?.id));
			},
		});

		this.addCleanup('gamesRequest', () => this._gamesRequest?.unsubscribe?.());
	}

	// hypertether doesn't throw on HTTP errors; every mutation gets its ok checked, and a failed one is handed
	// back so FormDialog keeps the dialog open with the reason instead of closing as if it worked
	async _saveGame() {
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

		if (!saved.response?.ok) return saved;

		if (!isEdit) {
			id = saved.body.id;
			this.options.game = saved.body;
		}

		// Attachments go through their own endpoints, binary payloads never ride
		// along on the regular game create/update
		for (const file of this.form.getPendingFiles()) {
			const uploaded = await uploadGameFile(id, file);

			if (!uploaded.response?.ok)
				return this._failed(`"${file.name}" upload failed (the game itself saved)`, uploaded);

			this.form.markUploaded(file);
		}

		for (const fileId of [...this.form.removedFileIds]) {
			const removed = await deleteGameFile(id, fileId);

			if (!removed.response?.ok) return this._failed('File delete failed (the game itself saved)', removed);

			this.form.removedFileIds.delete(fileId);
		}

		// A new game lands on its page, ready for rules to be written
		if (!isEdit) navigate(`/games/${id}`);

		return true;
	}

	async _deleteGame() {
		const result = await deleteGame(this.options.game.id);

		if (!result.response?.ok) return result;

		this.options.onDeleted?.();

		return true;
	}

	// A file failing after the game saved needs saying, past the bare reason FormDialog would show
	_failed(message, result) {
		throw new Error(`${message}: ${failureReason(result)}`);
	}
}
