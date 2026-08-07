import { Dialog } from '@vanilla-bean/components';

import { deleteGame } from '../api';

/**
 * Confirm, then delete the game and its files. The dialog stays open on failure.
 * @param game the game to delete
 * @param onDeleted called after a successful delete, e.g. to leave the game's page
 */
export default function confirmDeleteGame(game, onDeleted) {
	new Dialog({
		size: 'small',
		header: `Delete "${game.name}"?`,
		body: 'This also deletes its pictures and attachments.',
		buttons: ['Delete', 'Cancel'],
		onButtonPress: async ({ button, dialog, closeDialog }) => {
			if (button === 'Delete') {
				const result = await deleteGame(game.id);

				// A failed delete keeps the dialog open instead of pretending it worked
				if (!result.response?.ok) {
					dialog.options.variant = 'error';
					dialog.options.body = `Delete failed: ${result.body?.error || `HTTP ${result.response?.status || '?'}`}`;

					return;
				}

				onDeleted?.();
			}

			closeDialog();
		},
	});
}
