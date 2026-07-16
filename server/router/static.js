import { resolve } from 'path';

const safeFile = (base, pathname) => {
	const resolved = resolve(base, `.${pathname}`);

	if (!resolved.startsWith(resolve(base))) return null;

	return Bun.file(resolved);
};

// The only node_modules packages the client links at runtime (vbc's Page injects these
// stylesheets/fonts with relative hrefs); everything else installed stays unreachable.
const servedPackages = ['@fortawesome/', '@fontsource-variable/', '@vanilla-bean/'];

// Relative hrefs resolve against the current SPA route, so a reload on /games/:id asks for
// /games/@fortawesome/...; match the package at any depth and serve from node_modules.
const packagePath = pathname => {
	for (const prefix of servedPackages) {
		const index = pathname.indexOf(`/${prefix}`);

		if (index !== -1) return pathname.slice(index);
	}

	return null;
};

const staticRouter = async request => {
	const pathname = decodeURIComponent(new URL(request.url).pathname);

	// No legitimate asset path contains a '..' segment; rejecting them here keeps a traversal
	// from re-entering node_modules outside the allowlisted packages
	if (pathname.includes('..')) return;

	let file = safeFile('client/build', pathname);
	if (file && (await file.exists())) return new Response(file);

	const nodeModulesPath = packagePath(pathname);

	if (nodeModulesPath) {
		file = safeFile('node_modules', nodeModulesPath);
		if (file && (await file.exists())) return new Response(file);

		if (process.env.NODE_ENV === 'development') {
			file = safeFile('../node_modules', nodeModulesPath);
			if (file && (await file.exists())) return new Response(file);
		}
	}
};
export default staticRouter;
