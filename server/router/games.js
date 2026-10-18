import { crudRoutes, requestMatch } from '@vanilla-bean/components/app';

import games from '../database/games';
import { readGameFile, deleteGameFile } from '../utils/fileStorage';
import { storeGameFile } from '../utils/gameFiles';

// Big enough for phone photos and rulebook pdfs, small enough to keep dataUri JSON bodies sane
const MAX_UPLOAD_BYTES = 15_000_000;

// A per-game ceiling as well as a per-file one; without it the disk is a loop of valid uploads away
const MAX_FILES_PER_GAME = 40;

const gameRoutes = crudRoutes('/api/games', games);

const gamesRouter = async request => {
	let match;

	match = requestMatch('POST', '/api/games/:id/files', request);
	if (match) {
		const game = games.read(match);

		if (!game) return new Response(null, { status: 404 });

		const { name, dataUri } = await request.json();
		const dataUriMatch = dataUri && /^data:([^;,]+)(?:;charset=[^;,]+)?;base64,(.+)$/.exec(dataUri);

		if (!dataUriMatch) return new Response('Expected a JSON { name, dataUri } body', { status: 400 });

		const contentType = dataUriMatch[1];
		const original = Buffer.from(dataUriMatch[2], 'base64');

		if (original.length > MAX_UPLOAD_BYTES) return new Response('File too large', { status: 413 });

		if (Object.keys(game.files || {}).length >= MAX_FILES_PER_GAME)
			return new Response(`A game can hold ${MAX_FILES_PER_GAME} files`, { status: 413 });

		// storeGameFile caps covers on the way in so the grid never paints multi-megabyte images
		return Response.json(await storeGameFile(match.id, original, { name, contentType }));
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
				'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${encodeURIComponent(meta.name)}"`,
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
