import { deleteGameFiles } from '../utils/fileStorage';

import { createCRUD } from './crud';

// files: fileId -> { name, type, size }, the binary lives on disk (see utils/fileStorage),
// only metadata lives in the db. steamEnriched marks an import whose storefront fetch finished,
// so an interrupted one can be picked up again on the next boot.
export default createCRUD(
	'games',
	{
		name: { type: 'string', required: true },
		description: { type: 'string' },
		setting: { type: 'string' },
		complexity: { type: 'string' },
		playersMin: { type: 'number' },
		playersMax: { type: 'number' },
		playTimeMin: { type: 'number' },
		playTimeMax: { type: 'number' },
		tags: { type: 'stringArray' },
		links: { type: 'linkArray' },
		related: { type: 'stringArray' },
		rules: { type: 'string' },
		files: { type: 'fileMap' },
		steamAppId: { type: 'number' },
		steamEnriched: { type: 'boolean' },
	},
	{
		beforeCreate(entry) {
			// The CRUD layer defaults unset fields to '', collection-typed fields need real containers
			if (!Array.isArray(entry.tags)) entry.tags = [];
			if (!Array.isArray(entry.links)) entry.links = [];
			if (!Array.isArray(entry.related)) entry.related = [];
			if (typeof entry.files !== 'object' || Array.isArray(entry.files) || !entry.files) entry.files = {};
			if (typeof entry.steamEnriched !== 'boolean') entry.steamEnriched = false;
		},
		async afterDelete(id) {
			await deleteGameFiles(id);
		},
	},
);
