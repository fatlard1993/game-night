import { POST, DELETE, resource } from '@vanilla-bean/hypertether';

const games = resource('/api/games');

export const getGames = options => games.list(options);

export const getGame = (id, options) => games.read(id, options);

export const createGame = options => games.create(options);

export const updateGame = (id, options) => games.update(id, options);

export const deleteGame = (id, options) => games.delete(id, options);

export const uploadGameFile = async (id, { name, dataUri }, options) =>
	await POST('/api/games/:id/files', {
		invalidates: ['games'],
		urlParameters: { id },
		body: { name, dataUri },
		...options,
	});

export const deleteGameFile = async (id, fileId, options) =>
	await DELETE('/api/games/:id/files/:fileId', { invalidates: ['games'], urlParameters: { id, fileId }, ...options });

export const gameFileUrl = (id, fileId) => `/api/games/${id}/files/${fileId}`;
