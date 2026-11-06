import fs from 'fs/promises';
import path from 'path';

import database from '../database/database';

// Attachments live in a per-game folder: <filesDir>/<gameId>/<fileId>. Ids reach here only once the record names
// them, so these checks are a second fence: each id must resolve to exactly one level down, not merely to a path
// that starts with the parent's (a prefix check lets `../x-files` through beside an `x-files` folder).
const root = () => path.resolve(database.filesDir);

const gameDir = gameId => {
	const dir = path.resolve(root(), gameId);

	if (path.dirname(dir) !== root()) throw new Error('Invalid game id');

	return dir;
};

const filePath = (gameId, fileId) => {
	const dir = gameDir(gameId);
	const file = path.resolve(dir, fileId);

	if (path.dirname(file) !== dir) throw new Error('Invalid file id');

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
