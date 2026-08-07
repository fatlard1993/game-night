import { Router } from '@vanilla-bean/components';

import Games from './Games/Games';
import GamePage from './GamePage/GamePage';
import { registerRouter } from './navigate';

// The base Router skips re-rendering when the matched route pattern is unchanged, but
// /games/:id -> /games/:id with a different id is the same pattern and needs a fresh view.
// (In history mode `path` is the pathname only, so query-only changes never trip this.)
class AppRouter extends Router {
	renderView(route) {
		if (this.currentPath !== this.path) this.currentRoute = null;

		this.currentPath = this.path;

		super.renderView(route);
	}
}

const router = new AppRouter({ mode: 'history', views: { '/games': Games, '/games/:id': GamePage } });

// Views call navigate() from ./navigate; this is the end that supplies it
registerRouter(router);

export default router;
