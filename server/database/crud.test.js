import fs from 'fs';
import os from 'os';
import path from 'path';

import { afterAll, beforeEach, describe, expect, test } from 'bun:test';

import { createCRUD } from './crud';
import database from './database';
import { ValidationError } from './validate';

const dbPath = path.join(os.tmpdir(), `gameNight-crud-test-${process.pid}.json`);

await database.init({ path: dbPath });

afterAll(() => {
	fs.rmSync(dbPath, { force: true });
	fs.rmSync(path.join(os.tmpdir(), `gameNight-crud-test-${process.pid}-files`), { recursive: true, force: true });
});

const spec = {
	name: { type: 'string', required: true },
	note: { type: 'string' },
	tags: { type: 'stringArray' },
};

let onDelete;
const widgets = createCRUD('widgets', spec, { afterDelete: (...args) => onDelete?.(...args) });

beforeEach(() => {
	database.db.data.widgets = {};
	onDelete = undefined;
});

describe('create', () => {
	test('stores the known fields under a generated id', async () => {
		const entry = await widgets.create({ name: 'Anvil', note: 'heavy', extra: 'dropped' });

		expect(entry.name).toBe('Anvil');
		expect(entry.extra).toBeUndefined();
		expect(widgets.read({ id: entry.id })).toEqual(entry);
	});

	test('refuses a body the fields cannot hold', async () => {
		await expect(widgets.create({ name: { bad: 1 } })).rejects.toThrow(ValidationError);
		await expect(widgets.create({})).rejects.toThrow(ValidationError);
	});

	// Each type carries its own unset value, so a container field left out arrives as a
	// container rather than as '' for something downstream to trip over
	test('an absent field lands as the right kind of empty', async () => {
		const entry = await widgets.create({ name: 'Anvil' });

		expect(entry.note).toBe('');
		expect(entry.tags).toEqual([]);
	});

	test('two entries do not share one empty container', async () => {
		const first = await widgets.create({ name: 'One' });
		const second = await widgets.create({ name: 'Two' });

		first.tags.push('mine');

		expect(second.tags).toEqual([]);
	});
});

// Every plain object inherits toString and constructor, so a truthiness check treated them as
// stored entries: PATCH /api/games/toString persisted a game that was never created, and
// DELETE /api/games/constructor reported success for one that never existed
describe('inherited keys are not entries', () => {
	test('read finds nothing at a prototype key', () => {
		expect(widgets.read({ id: 'toString' })).toBe(false);
		expect(widgets.read({ id: 'constructor' })).toBe(false);
		expect(widgets.read({ id: '__proto__' })).toBe(false);
	});

	test('update refuses to write one', async () => {
		expect(await widgets.update({ id: 'toString', update: { name: 'PHANTOM' } })).toBe(false);
		expect(await widgets.update({ id: '__proto__', update: { name: 'PHANTOM' } })).toBe(false);

		expect(Object.hasOwn(widgets.data, 'toString')).toBe(false);
		expect(widgets.data.name).toBeUndefined();
		expect({}.name).toBeUndefined();
	});

	test('delete reports failure rather than success', async () => {
		expect(await widgets.delete({ id: 'constructor' })).toBe(false);
	});
});

describe('update', () => {
	test('writes only the fields given', async () => {
		const { id } = await widgets.create({ name: 'Anvil', note: 'heavy' });

		expect(await widgets.update({ id, update: { note: 'lighter' } })).toMatchObject({
			name: 'Anvil',
			note: 'lighter',
		});
	});

	test('refuses a value of the wrong shape', async () => {
		const { id } = await widgets.create({ name: 'Anvil' });

		await expect(widgets.update({ id, update: { name: [] } })).rejects.toThrow(ValidationError);
		expect(widgets.read({ id }).name).toBe('Anvil');
	});

	test('returns false for an id that was never created', async () => {
		expect(await widgets.update({ id: 'nope', update: { name: 'x' } })).toBe(false);
	});
});

describe('delete', () => {
	test('removes the entry', async () => {
		const { id } = await widgets.create({ name: 'Anvil' });

		expect(await widgets.delete({ id })).toBe(id);
		expect(widgets.read({ id })).toBe(false);
	});

	// The hook deletes the game's files from disk; if that throws, the entry has to come back
	// or the db and the disk disagree with nothing to reconcile them
	test('puts the entry back when the after-delete hook throws', async () => {
		const created = await widgets.create({ name: 'Anvil', note: 'heavy' });

		onDelete = () => {
			throw new Error('disk is full');
		};

		await expect(widgets.delete({ id: created.id })).rejects.toThrow('disk is full');

		expect(widgets.read({ id: created.id })).toEqual(created);
	});
});
