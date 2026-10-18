import { hotReload } from '@vanilla-bean/components/app';

import router from './router/router';

export default {
	init({ port }) {
		const server = Bun.serve({
			port,
			fetch: (request, server) => (hotReload.upgrade(request, server) ? undefined : router(request, server)),
			// Fits the 15MB upload cap plus its base64/JSON overhead; anything bigger is
			// rejected before it can balloon memory
			maxRequestBodySize: 32_000_000,
			websocket: hotReload.websocket,
		});

		console.log(`Listening on ${server.hostname}:${server.port}`);

		if (process.env.NODE_ENV === 'development') hotReload.watch();
	},
};
