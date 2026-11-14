import { Router } from '@vanilla-bean/components';

import context from './context';
import Games from './Games/Games';
import GamePage from './GamePage/GamePage';
import { registerRouter } from './navigate';
import { paths } from './paths';

const router = new Router({
	mode: 'history',
	views: { [paths.library]: Games, [paths.game]: GamePage },
	// Keys typed before the library's search box exists seed it. Typed on a game page they belong to nobody, and
	// surfaced as a search on the way back to the library: a page of rules typed in before the first visit there.
	onRenderView: route => {
		if (route === paths.game) context.preRenderSearch = null;
	},
});

// Views call navigate() from ./navigate; this is the end that supplies it
registerRouter(router);

export default router;
