import { crudRoutes, requestMatch } from '@vanilla-bean/components/app';

import games from '../database/games';
import { readGameFile, deleteGameFile } from '../utils/fileStorage';
import { storeGameFile } from '../utils/gameFiles';

import { jsonObject } from './jsonObject';

// Big enough for phone photos and rulebook pdfs, small enough to keep dataUri JSON bodies sane. The client refuses
// the same size before reading the file, so the limit is pinned equal on both sides by test.
export const MAX_UPLOAD_BYTES = 15_000_000;

// A per-game ceiling as well as a per-file one; without it the disk is a loop of valid uploads away
const MAX_FILES_PER_GAME = 40;

// What FileReader's readAsDataURL produces: a mime type, at most a charset, then base64. The type is stored and sent
// back as a Content-Type header, so it has to look like one.
const DATA_URI = /^data:([\w.+-]+\/[\w.+-]+)(?:;charset=[^;,]+)?;base64,(.+)$/;

// RFC 5987: the real name goes in filename*, percent-encoded; filename holds an ASCII stand-in for whatever can't
// read the first. A percent-encoded name inside filename="" is what the browser saves it as, %20s included.
const encodeFilename = name =>
	encodeURIComponent(name).replaceAll(
		/[!'()*]/g,
		character => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
	);

const contentDisposition = (inline, name) => {
	const plain = name.replaceAll(/["\\]|[^\x20-\x7e]/g, '_');

	return `${inline ? 'inline' : 'attachment'}; filename="${plain}"; filename*=UTF-8''${encodeFilename(name)}`;
};

const gameRoutes = crudRoutes('/api/games', games);

const gamesRouter = async request => {
	let match;

	match = requestMatch('POST', '/api/games/:id/files', request);
	if (match) {
		const game = games.read(match);

		if (!game) return new Response(null, { status: 404 });

		const { name, dataUri } = await jsonObject(request);
		const dataUriMatch = typeof dataUri === 'string' && DATA_URI.exec(dataUri);

		if (!dataUriMatch || (name !== undefined && typeof name !== 'string')) {
			return new Response('Expected a JSON { name, dataUri } body', { status: 400 });
		}

		const contentType = dataUriMatch[1];
		const original = Buffer.from(dataUriMatch[2], 'base64');

		// Base64 that decodes to nothing used to land as a 0-byte attachment
		if (original.length === 0) return new Response('The file is empty', { status: 400 });
		if (original.length > MAX_UPLOAD_BYTES) return new Response('File too large', { status: 413 });

		if (Object.keys(game.files || {}).length >= MAX_FILES_PER_GAME)
			return new Response(`A game can hold ${MAX_FILES_PER_GAME} files`, { status: 413 });

		// storeGameFile caps covers on the way in so the grid never paints multi-megabyte images
		const stored = await storeGameFile(match.id, original, { name, contentType });

		return stored ? Response.json(stored) : new Response(null, { status: 404 });
	}

	match = requestMatch('GET', '/api/games/:id/files/:fileId', request);
	if (match) {
		const game = games.read(match);
		const meta = game?.files?.[match.fileId];
		const buffer = meta ? await readGameFile(match.id, match.fileId) : null;

		if (!buffer) return new Response(null, { status: 404 });

		// The stored type is whatever the uploader's dataUri claimed; only render types a browser
		// can't execute as a page. Anything else (e.g. text/html) downloads instead of running
		// same-origin. SVG is an image that carries script, so it downloads too: nosniff can't
		// help when the declared type is itself the executable one.
		const inline =
			(meta.type?.startsWith('image/') && !meta.type.startsWith('image/svg')) ||
			['application/pdf', 'text/plain'].includes(meta.type);

		return new Response(buffer, {
			headers: {
				'Content-Type': meta.type || 'application/octet-stream',
				'X-Content-Type-Options': 'nosniff',
				'Content-Disposition': contentDisposition(inline, meta.name),
			},
		});
	}

	match = requestMatch('DELETE', '/api/games/:id/files/:fileId', request);
	if (match) {
		const game = games.read(match);

		if (!game?.files?.[match.fileId]) return new Response(null, { status: 404 });

		await deleteGameFile(match.id, match.fileId);

		const files = { ...game.files };
		delete files[match.fileId];

		return Response.json(await games.update({ id: match.id, update: { files } }));
	}

	return gameRoutes(request);
};

export default gamesRouter;
