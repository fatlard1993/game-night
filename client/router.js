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

// TEMPORARY, until the library's Router catches these itself in history mode: a plain click on a same-site link
// is routed in-app instead of reloading the page. Middle, modified and _blank clicks are left to the browser, so they
// still open a new tab. Delete this block when the library does it.
document.addEventListener('click', event => {
	if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
		return;

	const anchor = event.target.closest?.('a[href]');

	if (!anchor || (anchor.target && anchor.target !== '_self') || anchor.hasAttribute('download')) return;

	const url = new URL(anchor.href);

	if (url.origin !== window.location.origin) return;

	event.preventDefault();
	router.path = `${url.pathname}${url.search}${url.hash}`;
});
