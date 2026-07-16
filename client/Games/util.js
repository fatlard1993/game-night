export const COMPLEXITY_LEVELS = ['Light', 'Medium', 'Heavy'];

// The primary "where-like" axis, each value is a scene bundle (place + posture + how you gather),
// not a literal location. Table = gathered around a surface; Couch = screen-facing; Outside = space
// and movement; Anywhere = needs nothing but people.
export const SETTINGS = ['Table', 'Couch', 'Outside', 'Anywhere'];

const websiteRegex = /^(.+:\/\/)?[\da-z]+([.-][\da-z]+)*\.[a-z]{2,5}(:\d{1,5})?(\/.*)?$/;
const localhostRegex = /^(.+:\/\/)?localhost(:\d{1,5})?(\/.*)?$/;

export const isLink = url => websiteRegex.test(url) || localhostRegex.test(url);

export const fixLink = url => (/.+:\/\//.test(url) ? url : `https://${url}`);

export const validateForm = form => {
	document.activeElement?.blur();
	return form.hasErrors();
};

// A number field left blank round-trips as '' through the db, treat anything non-numeric as unset
export const asNumber = value => {
	const number = Number(value);

	return value !== '' && value !== null && !Number.isNaN(number) ? number : undefined;
};

const formatRange = (min, max, suffix) => {
	if (min === undefined && max === undefined) return '';
	if (min === undefined) return `${max}${suffix}`;
	if (max === undefined || min === max) return `${min}${suffix}`;

	return `${min}-${max}${suffix}`;
};

export const playersLabel = game => {
	const label = formatRange(asNumber(game.playersMin), asNumber(game.playersMax), '');

	return label && `${label} player${label === '1' ? '' : 's'}`;
};

export const playTimeLabel = game => formatRange(asNumber(game.playTimeMin), asNumber(game.playTimeMax), ' min');

export const gameMetaLabel = game =>
	[game.setting, game.complexity, playersLabel(game), playTimeLabel(game)].filter(Boolean).join(' · ');

// One url per line, optionally "Label | url"
export const parseLinks = text =>
	(text || '')
		.split('\n')
		.map(line => line.trim())
		.filter(Boolean)
		.map(line => {
			const [first, ...rest] = line.split('|').map(part => part.trim());
			const url = rest.length > 0 ? rest.join('|') : first;
			const label = rest.length > 0 ? first : url;

			return { label, url: fixLink(url) };
		});

export const serializeLinks = links =>
	(Array.isArray(links) ? links : [])
		.map(({ label, url }) => (label && label !== url ? `${label} | ${url}` : url))
		.join('\n');

// Related games are stored as names (stable across installs, seedable) and resolved at render
export const parseRelated = text =>
	(text || '')
		.split('\n')
		.map(line => line.trim())
		.filter(Boolean);

export const serializeRelated = related => (Array.isArray(related) ? related : []).join('\n');

/**
 * Manual `related` names first, then auto-suggestions by weighted tag overlap.
 * Rare tags count more than generic ones (weight = 1/library-wide frequency).
 * @param game
 * @param allGames
 * @param limit
 */
export const relatedGames = (game, allGames, limit = 6) => {
	const others = Object.values(allGames).filter(other => other.id !== game.id);

	const manualNames = (Array.isArray(game.related) ? game.related : []).map(name => name.toLowerCase());
	const manual = manualNames.map(name => others.find(other => other.name.toLowerCase() === name)).filter(Boolean);

	const manualIds = new Set(manual.map(other => other.id));

	const tagCounts = {};

	for (const other of Object.values(allGames)) {
		for (const tag of other.tags || []) tagCounts[tag] = (tagCounts[tag] || 0) + 1;
	}

	const gameTags = new Set(game.tags || []);

	const scored = others
		.filter(other => !manualIds.has(other.id))
		.map(other => {
			let score = 0;

			for (const tag of other.tags || []) {
				if (gameTags.has(tag)) score += 1 / tagCounts[tag];
			}

			return { game: other, score };
		})
		.filter(({ score }) => score > 0)
		.sort((a, b) => b.score - a.score);

	return [...manual, ...scored.map(({ game: other }) => other)].slice(0, limit);
};

export const gameImageIds = game =>
	Object.keys(game.files || {}).filter(fileId => game.files[fileId].type?.startsWith('image/'));

export const gameAttachmentIds = game =>
	Object.keys(game.files || {}).filter(fileId => !game.files[fileId].type?.startsWith('image/'));

// Everything worth fuzzy-matching about a game, flattened into one string
export const gameHaystack = game =>
	[game.name, game.description, game.setting, game.complexity, ...(Array.isArray(game.tags) ? game.tags : [])]
		.filter(Boolean)
		.join(' ');

// Filter state <-> URL query (history mode, e.g. /games?setting=Couch&tag=co-op&q=trick).
// Arrays use repeated keys so terms with commas/spaces survive URLSearchParams encoding.
export const filtersFromUrl = (search = window.location.search) => {
	const params = new URLSearchParams(search);

	return {
		search: { text: params.get('q') || '', chips: params.getAll('chip') },
		setting: params.get('setting') || '',
		players: params.get('players') || '',
		maxTime: params.get('time') || '',
		maxComplexity: params.get('complexity') || '',
		tags: params.getAll('tag'),
	};
};

export const filtersToQuery = (filters = {}) => {
	const params = new URLSearchParams();

	if (filters.search?.text) params.set('q', filters.search.text);
	for (const chip of filters.search?.chips || []) params.append('chip', chip);
	if (filters.setting) params.set('setting', filters.setting);
	if (filters.players) params.set('players', filters.players);
	if (filters.maxTime) params.set('time', filters.maxTime);
	if (filters.maxComplexity) params.set('complexity', filters.maxComplexity);
	for (const tag of filters.tags || []) params.append('tag', tag);

	const query = params.toString();

	return query ? `?${query}` : '';
};

// Live tag vocabulary with counts, most-frequent first (drives the dynamic tag filter)
export const tagCounts = games => {
	const counts = {};

	for (const game of Object.values(games)) {
		for (const tag of game.tags || []) counts[tag] = (counts[tag] || 0) + 1;
	}

	return counts;
};

// Filters: players, the game's min/max range must include the requested count.
// maxTime, the game's shortest advertised play time must fit in the window.
// setting, exact match; empty means any. maxComplexity, at-or-below cutoff.
// tags, exact-match OR: the game must carry at least one selected tag (medium is a tag now).
export const gameMatchesFilters = (game, { players, maxTime, setting, maxComplexity, tags } = {}) => {
	if (setting && game.setting !== setting) return false;
	if (tags?.length > 0 && !tags.some(tag => (game.tags || []).includes(tag))) return false;

	if (maxComplexity) {
		const gameLevel = COMPLEXITY_LEVELS.indexOf(game.complexity);
		const maxLevel = COMPLEXITY_LEVELS.indexOf(maxComplexity);

		if (gameLevel === -1 || gameLevel > maxLevel) return false;
	}

	if (players !== undefined) {
		const min = asNumber(game.playersMin);
		const max = asNumber(game.playersMax);

		if (min !== undefined && players < min) return false;
		if (max !== undefined && players > max) return false;
		if (min === undefined && max === undefined) return false;
	}

	if (maxTime !== undefined) {
		const time = asNumber(game.playTimeMin) ?? asNumber(game.playTimeMax);

		if (time === undefined || time > maxTime) return false;
	}

	return true;
};
