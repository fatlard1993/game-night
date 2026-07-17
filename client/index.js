import './polyfills';

import { Page } from '@vanilla-bean/components';

import context from './context';
import router from './router';

import './hotReload';

document.addEventListener('keypress', event => {
	if (!context.searchElem) {
		// Buffer only until the first toolbar consumes it; typing on other views shouldn't seed a later
		// search. Printable keys only, keypress also fires for Enter and it would land literally.
		if (typeof context.preRenderSearch === 'string' && event.key.length === 1) context.preRenderSearch += event.key;
	} else if (event.key === '/' && document.activeElement !== context.searchElem) {
		event.preventDefault();
		context.searchElem.focus();
	}
});

new Page({ appendTo: document.body, append: router });
