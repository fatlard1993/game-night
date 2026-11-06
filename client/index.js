import { Page } from '@vanilla-bean/components';

import { getSession } from './api';
import context from './context';
import router from './router';

import '@vanilla-bean/components/app/reloadOnBuild';

// Views read context.admin to decide whether to offer editing at all; seed it before first
// paint so the buttons don't flash in and out. A failed check simply leaves it false.
getSession({ onSuccess: ({ body }) => (context.admin = !!body?.admin) }).catch(() => {});

// Typing in a field is never a search shortcut: a slash in a dialog's links field stays there
const EDITABLE = 'input, textarea, select, [contenteditable]:not([contenteditable="false"])';

document.addEventListener('keypress', event => {
	if (event.target.matches?.(EDITABLE)) return;

	if (!context.searchElem) {
		// Buffer only until the first toolbar consumes it; typing on other views shouldn't seed a later
		// search. Printable keys only, keypress also fires for Enter and it would land literally.
		if (typeof context.preRenderSearch === 'string' && event.key.length === 1) context.preRenderSearch += event.key;
	} else if (event.key === '/') {
		event.preventDefault();
		context.searchElem.focus();
	}
});

new Page({ appendTo: document.body, append: router });
