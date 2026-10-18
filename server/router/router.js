import { sameOrigin, serveApp, withErrors } from '@vanilla-bean/components/app';

import { isAdmin } from '../auth';

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
	// A write or socket from another site's page, or through a DNS name rebound to this machine
	if (!sameOrigin(request)) return new Response('Cross-origin request refused', { status: 403 });

	if (wrongContentType(request)) return new Response('Expected a JSON body', { status: 415 });

	const response = await sessionRoutes(request, server);
	if (response) return response;

	if (requiresAdmin(request) && !isAdmin(request))
		return Response.json({ error: 'Admin login required' }, { status: 401 });

	// The page revalidates on every load, any other GET outside /api gets it for the client's router, and /api gets a
	// real 404: an unknown endpoint answering 200 with HTML is the most confusing possible failure
	return (
		(await gamesRoutes(request)) ??
		(await steamRoutes(request)) ??
		(await serveApp(request)) ??
		new Response('Not Found', { status: 404 })
	);
};

export default withErrors(router, { log: (...args) => console.error('An error was encountered processing a request\n', ...args) });
