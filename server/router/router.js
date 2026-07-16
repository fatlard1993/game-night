import { nanoid } from 'nanoid';

import requestMatch from '../utils/requestMatch';

import gamesRoutes from './games';
import steamRoutes from './steam';
import staticRoutes from './static';

const router = async (request, server) => {
	try {
		let match;
		let response;

		// no-cache: revalidate index.html every load so a rebuild always reaches the browser;
		// the hashed chunk files it references are safe to cache
		match = requestMatch('GET', '/', request);
		if (match) return new Response(Bun.file('client/build/index.html'), { headers: { 'Cache-Control': 'no-cache' } });

		if (process.env.NODE_ENV === 'development') {
			match = requestMatch('GET', '/ws', request);
			if (match) {
				const success = server.upgrade(request, { data: { clientId: nanoid() } });

				return success ? undefined : new Response('WebSocket upgrade error', { status: 400 });
			}
		}

		response = await gamesRoutes(request);
		if (response) return response;

		response = await steamRoutes(request);
		if (response) return response;

		response = await staticRoutes(request);
		if (response) return response;

		// SPA fallback, serve index.html for unmatched GET requests; /api gets a real 404,
		// an unknown endpoint answering 200 with HTML is the most confusing possible failure
		if (request.method === 'GET' && !new URL(request.url).pathname.startsWith('/api/'))
			return new Response(Bun.file('client/build/index.html'), { headers: { 'Cache-Control': 'no-cache' } });

		return new Response('Not Found', { status: 404 });
	} catch (error) {
		if (error instanceof SyntaxError) return new Response('Invalid JSON', { status: 400 });

		console.error('An error was encountered processing a request\n', error);

		return new Response('Server Error', { status: 500 });
	}
};
export default router;
