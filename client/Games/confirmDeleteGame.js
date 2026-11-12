import { Dialog, Notify, failureReason } from '@vanilla-bean/components';

import { deleteGame } from '../api';

/**
 * Confirm, then delete the game and its files. A failed delete says why in a danger toast that stays until pressed;
 * the game is still there, so pressing Delete again retries.
 * @param game the game to delete
 * @param onDeleted called after a successful delete, e.g. to leave the game's page
 * @returns {Promise<boolean>} whether the game was deleted
 */
export default async function confirmDeleteGame(game, onDeleted) {
	const confirmed = await Dialog.confirm({
		intent: 'danger',
		header: `Delete "${game.name}"?`,
		body: 'This also deletes its pictures and attachments.',
		confirmLabel: 'Delete',
	});

	if (!confirmed) return false;

	const result = await deleteGame(game.id);

	if (!result.response?.ok) {
		new Notify({ intent: 'danger', content: `Delete failed: ${failureReason(result)}` });

		return false;
	}

	onDeleted?.();

	return true;
}
