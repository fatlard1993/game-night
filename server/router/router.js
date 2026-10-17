import { requestMatch, serveStatic } from '@vanilla-bean/components/app';

import { isAdmin } from '../auth';
import { ValidationError } from '../database/validate';

import gamesRoutes from './games';
import sessionRoutes from './session';
import steamRoutes from './steam';

// Reading is open to anyone on the LAN; every write goes through the admin session. One gate
// here rather than per-route, so a new endpoint can't be added already unguarded.
const requiresAdmin = request => {
	const { pathname } = new URL(request.url);

	return request.method !== 'GET' && pathname.startsWith('/api/') && pathname !== '/api/session';
};

// A JSON body arriving as text/plain is the shape a cross-origin form uses to dodge preflight.
// The session cookie is SameSite=Strict so such a request is unauthenticated anyway; this
// refuses it earlier and more plainly, login attempts included.
const wrongContentType = request =>
	['POST', 'PATCH', 'PUT'].includes(request.method) &&
	new URL(request.url).pathname.startsWith('/api/') &&
	!request.headers.get('content-type')?.includes('application/json');

const router = async (request, server) => {
	try {
		let response;

		if (wrongContentType(request)) return new Response('Expected a JSON body', { status: 415 });

		response = await sessionRoutes(request, server);
		if (response) return response;

		if (requiresAdmin(request) && !isAdmin(request))
			return Response.json({ error: 'Admin login required' }, { status: 401 });

		// no-cache: revalidate index.html every load so a rebuild always reaches the browser;
		// the hashed chunk files it references are safe to cache
		const match = requestMatch('GET', '/', request);
		if (match) return new Response(Bun.file('client/build/index.html'), { headers: { 'Cache-Control': 'no-cache' } });

		response = await gamesRoutes(request);
		if (response) return response;

		response = await steamRoutes(request);
		if (response) return response;

		response = await serveStatic(request);
		if (response) return response;

		// SPA fallback, serve index.html for unmatched GET requests; /api gets a real 404,
		// an unknown endpoint answering 200 with HTML is the most confusing possible failure
		if (request.method === 'GET' && !new URL(request.url).pathname.startsWith('/api/'))
			return new Response(Bun.file('client/build/index.html'), { headers: { 'Cache-Control': 'no-cache' } });

		return new Response('Not Found', { status: 404 });
	} catch (error) {
		if (error instanceof ValidationError) return Response.json({ error: error.message }, { status: 400 });
		if (error instanceof SyntaxError) return new Response('Invalid JSON', { status: 400 });

		console.error('An error was encountered processing a request\n', error);

		return new Response('Server Error', { status: 500 });
	}
};
export default router;
