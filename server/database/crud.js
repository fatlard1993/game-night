import { nanoid } from 'nanoid';

import database from './database';
import { isSafeKey, validateFields } from './validate';

// `fields` is a spec: field name -> { type, required }. See ./validate for the types.
export const createCRUD = (collection, fields, hooks = {}) => ({
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

		if (hooks.beforeCreate) await hooks.beforeCreate(entry, data);

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

		const filtered = validateFields(fields, update, { partial: true });

		if (hooks.beforeUpdate) await hooks.beforeUpdate(filtered);

		this.data[id] = { ...this.data[id], ...filtered };
		await database.write();

		return this.data[id];
	},
	async delete({ id, ...options }) {
		if (!this.has(id)) return false;

		const entry = this.data[id];

		delete this.data[id];

		try {
			if (hooks.afterDelete) await hooks.afterDelete(id, options);
		} catch (error) {
			this.data[id] = entry;
			throw error;
		}

		await database.write();

		return id;
	},
});
