// The app's routes, in one place: the router maps them to views, and every link and navigate() builds from them
export const paths = Object.freeze({
	library: '/games',
	game: '/games/:id',
});

/**
 * A game page's address
 * @param id the game's id
 * @returns {string} the path to the game's page
 */
export const gamePath = id => paths.game.replace(':id', encodeURIComponent(id));
