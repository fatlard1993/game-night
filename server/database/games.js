import { createStore } from '@vanilla-bean/components/app';

import { deleteGameFiles } from '../utils/fileStorage';

import database from './database';
import { fileMap, linkArray } from './fieldTypes';

// files: fileId -> { name, type, size }, the binary lives on disk (see utils/fileStorage),
// only metadata lives in the db. steamEnriched marks an import whose storefront fetch finished,
// so an interrupted one can be picked up again on the next boot.
export default createStore({
	db: database,
	collection: 'games',
	fields: {
		name: { type: 'string', required: true },
		description: { type: 'string' },
		setting: { type: 'string' },
		complexity: { type: 'string' },
		playersMin: { type: 'number' },
		playersMax: { type: 'number' },
		playTimeMin: { type: 'number' },
		playTimeMax: { type: 'number' },
		tags: { type: 'stringArray' },
		links: { type: linkArray },
		related: { type: 'stringArray' },
		rules: { type: 'string' },
		files: { type: fileMap },
		steamAppId: { type: 'number' },
		steamEnriched: { type: 'boolean' },
	},
	hooks: {
		async afterDelete(id) {
			await deleteGameFiles(id);
		},
	},
});
