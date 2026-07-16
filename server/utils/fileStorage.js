import fs from 'fs/promises';
import path from 'path';

import database from '../database';

// Attachments live in a per-game folder: <filesDir>/<gameId>/<fileId>
// nanoid can produce ids with characters that need path safety checks if this ever accepts
// user-provided ids, resolve() and prefix check guard against traversal either way.
const gameDir = gameId => {
	const dir = path.resolve(database.filesDir, gameId);

	if (!dir.startsWith(path.resolve(database.filesDir))) throw new Error('Invalid game id');

	return dir;
};

const filePath = (gameId, fileId) => {
	const file = path.resolve(gameDir(gameId), fileId);

	if (!file.startsWith(gameDir(gameId))) throw new Error('Invalid file id');

	return file;
};

export const saveGameFile = async (gameId, fileId, buffer) => {
	await fs.mkdir(gameDir(gameId), { recursive: true });
	await fs.writeFile(filePath(gameId, fileId), buffer);
};

export const readGameFile = async (gameId, fileId) => {
	try {
		return await fs.readFile(filePath(gameId, fileId));
	} catch {
		return null;
	}
};

export const deleteGameFile = async (gameId, fileId) => {
	try {
		await fs.unlink(filePath(gameId, fileId));
	} catch {
		// already gone
	}
};

export const deleteGameFiles = async gameId => {
	await fs.rm(gameDir(gameId), { recursive: true, force: true });
};
