import fs from 'fs';
import path from 'path';

import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

const database = {
	_writeQueue: Promise.resolve(),
	default: {
		games: {},
	},
	async init({ path: dbPath }) {
		let resolvedPath = dbPath;

		try {
			resolvedPath = fs.realpathSync(dbPath);
		} catch {
			// path doesn't exist yet (first run) or isn't a symlink, use as-is
		}

		database.db = new Low(new JSONFile(resolvedPath), database.default);

		await database.db.read();

		database.db.data = { ...database.default, ...(database.db.data || {}) };

		await database.db.write();

		// Sibling dotfolder next to the db file, e.g. ~/.gameNight.json -> ~/.gameNight-files/
		const { dir, name } = path.parse(resolvedPath);
		database.filesDir = path.join(dir, `${name}-files`);

		fs.mkdirSync(database.filesDir, { recursive: true });
	},
	write() {
		database._writeQueue = database._writeQueue
			.catch(() => {}) // Clear previous rejection so queue continues
			.then(() => database.db.write())
			.catch(error => {
				console.error('Database write failed:', error);
				throw error;
			});

		return database._writeQueue;
	},
};

export default database;
