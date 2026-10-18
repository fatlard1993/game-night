import fs from 'fs';
import path from 'path';

import { openDatabase } from '@vanilla-bean/components/app';

// The lowdb instance once init has run; `data` and `write` stand in for it, so the stores can be made before then
const database = {
	default: {
		games: {},
	},
	get data() {
		return database.db.data;
	},
	write() {
		return database.db.write();
	},
	async init({ path: dbPath }) {
		try {
			database.db = await openDatabase({ path: dbPath, defaults: database.default });
		} catch (error) {
			// A hand-edited or truncated file otherwise exits with a bare parse error, and on a
			// service install that lands in the journal with nothing naming the file
			throw new Error(`${error.message}\nFix the json, restore a backup, or point elsewhere with --database.`, {
				cause: error,
			});
		}

		// Sibling dotfolder next to the db file, e.g. ~/.gameNight.json -> ~/.gameNight-files/
		const { dir, name } = path.parse(database.db.path);
		database.filesDir = path.join(dir, `${name}-files`);

		fs.mkdirSync(database.filesDir, { recursive: true });
	},
};

export default database;
