import { nanoid } from 'nanoid';

import database from '.';

export const createCRUD = (collection, fields, hooks = {}) => ({
	get data() {
		return database.db.data[collection];
	},
	async create(data) {
		let id = nanoid(12);

		while (this.data[id]) id = nanoid(12);

		const entry = { ...Object.fromEntries(fields.map(f => [f, data[f] ?? ''])), id };

		if (hooks.beforeCreate) await hooks.beforeCreate(entry, data);

		this.data[id] = entry;
		await database.write();

		return entry;
	},
	read({ id } = {}) {
		if (id) return this.data[id] || false;

		return this.data;
	},
	async update({ id, update }) {
		if (!this.data[id]) return false;

		if (hooks.beforeUpdate) await hooks.beforeUpdate(update);

		const filtered = Object.fromEntries(fields.map(f => [f, update[f]]).filter(([, v]) => v !== undefined));

		this.data[id] = { ...this.data[id], ...filtered };
		await database.write();

		return this.data[id];
	},
	async delete({ id, ...options }) {
		if (!this.data[id]) return false;

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
