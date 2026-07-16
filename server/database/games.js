import { deleteGameFiles } from '../utils/fileStorage';

import { createCRUD } from './crud';

// tags: array of strings. links: array of { label, url }. files: fileId -> { name, type, size },
// the binary lives on disk (see utils/fileStorage), only metadata lives in the db.
export default createCRUD(
	'games',
	[
		'name',
		'description',
		'setting',
		'complexity',
		'playersMin',
		'playersMax',
		'playTimeMin',
		'playTimeMax',
		'tags',
		'links',
		'related',
		'rules',
		'files',
		'steamAppId',
	],
	{
		beforeCreate(entry) {
			// The CRUD layer defaults unset fields to '', collection-typed fields need real containers
			if (!Array.isArray(entry.tags)) entry.tags = [];
			if (!Array.isArray(entry.links)) entry.links = [];
			if (!Array.isArray(entry.related)) entry.related = [];
			if (typeof entry.files !== 'object' || Array.isArray(entry.files) || !entry.files) entry.files = {};
		},
		async afterDelete(id) {
			await deleteGameFiles(id);
		},
	},
);
