// Views need to navigate; the router needs the views to build its route table. Importing
// navigate straight from router.js closed that loop, and every view sat inside an import cycle
// whose safety was positional: it held only because index.js happens to load the router first,
// so router.js always finished evaluating before anything read a view binding. Nothing said so,
// and nothing would have caught it changing.
//
// The router registers itself here instead, and views depend on this leaf module rather than on
// the router. Constructing a view no longer drags the router in with it.
let router;

export const registerRouter = instance => {
	router = instance;
};

// Clean-URL navigation: pushState + re-render. Components call this instead of touching location.
export const navigate = path => {
	router.path = path;
};
