import { ValidationError, fieldTypes } from '@vanilla-bean/components/app';

const isPlainObject = value => !!value && typeof value === 'object' && !Array.isArray(value);

// The two shapes a game holds that the library's field types don't: its links, and the metadata of its files (the
// binary lives on disk, see utils/fileStorage). Each checks inside, not just the outer shape.
export const linkArray = {
	empty: () => [],
	parse: value => {
		if (!Array.isArray(value)) throw new ValidationError('expected a list of links');

		return value.map(entry => {
			if (!isPlainObject(entry)) throw new ValidationError('expected a link object');

			return { label: fieldTypes.string.parse(entry.label ?? ''), url: fieldTypes.string.parse(entry.url ?? '') };
		});
	},
};

export const fileMap = {
	empty: () => ({}),
	parse: value => {
		if (!isPlainObject(value)) throw new ValidationError('expected a file map');

		return Object.fromEntries(
			Object.entries(value).map(([fileId, meta]) => {
				if (!isPlainObject(meta)) throw new ValidationError('expected file metadata');

				return [
					fieldTypes.string.parse(fileId),
					{
						name: fieldTypes.string.parse(meta.name ?? ''),
						type: fieldTypes.string.parse(meta.type ?? ''),
						size: fieldTypes.number.parse(meta.size),
					},
				];
			}),
		);
	},
};
