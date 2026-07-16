import games from '../database/games';
import { readGameFile, deleteGameFile } from '../utils/fileStorage';
import { storeGameFile } from '../utils/gameFiles';

import requestMatch from '../utils/requestMatch';

// Big enough for phone photos and rulebook pdfs, small enough to keep dataUri JSON bodies sane
const MAX_UPLOAD_BYTES = 15_000_000;

const gamesRouter = async request => {
	let match;

	match = requestMatch('GET', '/api/games', request);
	if (match) return Response.json(games.read());

	match = requestMatch('POST', '/api/games', request);
	if (match) return Response.json(await games.create(await request.json()), { status: 201 });

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
		// same-origin.
		const inline = meta.type?.startsWith('image/') || ['application/pdf', 'text/plain'].includes(meta.type);

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

	match = requestMatch('GET', '/api/games/:id', request);
	if (match) {
		const game = games.read(match);

		return game ? Response.json(game) : new Response(null, { status: 404 });
	}

	match = requestMatch('PATCH', '/api/games/:id', request);
	if (match) {
		const game = await games.update({ ...match, update: await request.json() });

		return game ? Response.json(game) : new Response(null, { status: 404 });
	}

	match = requestMatch('DELETE', '/api/games/:id', request);
	if (match) return new Response(null, { status: (await games.delete(match)) ? 204 : 404 });
};

export default gamesRouter;
