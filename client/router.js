import { Router } from '@vanilla-bean/components';

import context from './context';
import Games from './Games/Games';
import GamePage from './GamePage/GamePage';
import { registerRouter } from './navigate';

const GAME_PAGE = '/games/:id';

const router = new Router({
	mode: 'history',
	views: { '/games': Games, [GAME_PAGE]: GamePage },
	// Keys typed before the library's search box exists seed it. Typed on a game page they belong to nobody, and
	// surfaced as a search on the way back to the library: a page of rules typed in before the first visit there.
	onRenderView: route => {
		if (route === GAME_PAGE) context.preRenderSearch = null;
	},
});

// Views call navigate() from ./navigate; this is the end that supplies it
registerRouter(router);

export default router;
