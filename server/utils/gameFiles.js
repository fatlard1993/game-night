import { nanoid } from 'nanoid';

import games from '../database/games';
import { deleteGameFile, saveGameFile } from './fileStorage';
import { downscaleImage } from './imageResize';

// Store a game file: downscale (a no-op for non-images), write the bytes to disk, and register its
// metadata on the game. The three intake paths (manual upload, Steam import, seed cover fetch) all
// route through here so the { name, type, size } shape stays in one place.
// Returns the updated game, or false if the game was deleted between the caller's check and here.
export const storeGameFile = async (gameId, buffer, { name, contentType }) => {
	const downscaled = await downscaleImage(buffer, contentType);
	const game = games.read({ id: gameId });

	if (!game) return false;

	const fileId = nanoid(12);

	await saveGameFile(gameId, fileId, downscaled);

	// The bytes are on disk before the record knows them; a record that refuses them (the game gone meanwhile, a
	// name the field type won't take) would otherwise leave an orphan nothing lists and nothing deletes
	try {
		const updated = await games.update({
			id: gameId,
			update: {
				// name falls back to the file id so a nameless upload still has a stable label
				files: { ...game.files, [fileId]: { name: name || fileId, type: contentType, size: downscaled.length } },
			},
		});

		if (!updated) await deleteGameFile(gameId, fileId);

		return updated;
	} catch (error) {
		await deleteGameFile(gameId, fileId);

		throw error;
	}
};
