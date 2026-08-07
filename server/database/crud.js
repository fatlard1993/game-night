import { nanoid } from 'nanoid';

import database from './database';
import { isSafeKey, validateFields } from './validate';

// `fields` is a spec: field name -> { type, required }, and each type carries its own unset
// value, so nothing here needs to know what an empty tag list looks like. See ./validate.
// afterDelete runs once the entry is out of the collection but before the write lands, so a
// hook that throws can be undone.
export const createCRUD = (collection, fields, { afterDelete } = {}) => ({
	get data() {
		return database.db.data[collection];
	},
	// Own keys only: `data.toString` is inherited by every plain object, and treating one as a
	// stored entry let a request update or delete a game that was never created
	has(id) {
		return isSafeKey(id) && Object.hasOwn(this.data, id);
	},
	async create(data) {
		let id = nanoid(12);

		while (this.has(id)) id = nanoid(12);

		const entry = { ...validateFields(fields, data), id };

		this.data[id] = entry;
		await database.write();

		return entry;
	},
	read({ id } = {}) {
		if (id) return this.has(id) ? this.data[id] : false;

		return this.data;
	},
	async update({ id, update }) {
		if (!this.has(id)) return false;

		this.data[id] = { ...this.data[id], ...validateFields(fields, update, { partial: true }) };
		await database.write();

		return this.data[id];
	},
	async delete({ id, ...options }) {
		if (!this.has(id)) return false;

		const entry = this.data[id];

		delete this.data[id];

		try {
			if (afterDelete) await afterDelete(id, options);
		} catch (error) {
			this.data[id] = entry;
			throw error;
		}

		await database.write();

		return id;
	},
});
