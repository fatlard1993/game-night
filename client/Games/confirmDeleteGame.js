import { Dialog } from '@vanilla-bean/components';

import { deleteGame } from '../api';

/**
 *
 * @param game
 * @param onDeleted
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
