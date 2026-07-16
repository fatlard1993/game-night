import { Oxject } from '@vanilla-bean/components';

const context = new Oxject({
	// Keystrokes typed before the search input exists; null once consumed by the first toolbar
	preRenderSearch: '',
	// The live search input's elem while a library view is mounted; null otherwise
	searchElem: null,
	// Last library URL (with filter query) so a game page's back arrow returns to the filtered list
	libraryUrl: '/games',
});

export default context;
