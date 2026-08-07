export class ValidationError extends Error {}

const isPlainObject = value => !!value && typeof value === 'object' && !Array.isArray(value);

// Field values arrive from request bodies. Anything of the wrong shape used to be stored as
// given and only surfaced later, far from here, as a crash in code that assumed a string, so
// every field is checked at the one door into the db. Numbers are accepted where text is
// expected (a phone keyboard sends "7" for a name readily enough); containers never are.
const types = {
	string: value => {
		if (typeof value === 'string') return value;
		if (typeof value === 'number' && Number.isFinite(value)) return String(value);

		throw new ValidationError('expected text');
	},
	// '' is how the db stores an unset number, both directions
	number: value => {
		if (value === '' || value === null) return '';
		if (typeof value === 'number' && Number.isFinite(value)) return value;
		if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return Number(value);

		throw new ValidationError('expected a number');
	},
	boolean: value => {
		if (typeof value === 'boolean') return value;

		throw new ValidationError('expected true or false');
	},
	stringArray: value => {
		if (!Array.isArray(value)) throw new ValidationError('expected a list');

		return value.map(entry => types.string(entry));
	},
	linkArray: value => {
		if (!Array.isArray(value)) throw new ValidationError('expected a list of links');

		return value.map(entry => {
			if (!isPlainObject(entry)) throw new ValidationError('expected a link object');

			return { label: types.string(entry.label ?? ''), url: types.string(entry.url ?? '') };
		});
	},
	fileMap: value => {
		if (!isPlainObject(value)) throw new ValidationError('expected a file map');

		return Object.fromEntries(
			Object.entries(value).map(([fileId, meta]) => {
				if (!isPlainObject(meta)) throw new ValidationError('expected file metadata');

				return [
					types.string(fileId),
					{ name: types.string(meta.name ?? ''), type: types.string(meta.type ?? ''), size: types.number(meta.size) },
				];
			}),
		);
	},
};

// Reserved keys would land on the prototype instead of the collection; ids are generated, so
// the only way one arrives is a hand-written request
export const isSafeKey = key => typeof key === 'string' && !['__proto__', 'constructor', 'prototype'].includes(key);

/**
 * Check a request body against a field spec, returning only the known fields, coerced.
 * @param spec field name -> { type, required }
 * @param data the raw body
 * @param options
 * @param options.partial when true (an update), absent fields are left out rather than defaulted
 */
export const validateFields = (spec, data, { partial = false } = {}) => {
	if (!isPlainObject(data)) throw new ValidationError('expected an object body');

	const result = {};

	for (const [field, { type, required }] of Object.entries(spec)) {
		const value = data[field];

		if (value === undefined) {
			if (required && !partial) throw new ValidationError(`${field} is required`);
			if (partial) continue;

			result[field] = '';
			continue;
		}

		try {
			result[field] = types[type](value);
		} catch (error) {
			throw new ValidationError(`${field}: ${error.message}`);
		}

		if (required && result[field] === '') throw new ValidationError(`${field} is required`);
	}

	return result;
};
