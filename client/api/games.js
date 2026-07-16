import { GET, POST, PATCH, DELETE } from '@vanilla-bean/hypertether';

export const getGames = async options => await GET('/api/games', { apiId: 'games', ...options });

export const getGame = async (id, options) =>
	await GET('/api/games/:id', { apiId: ['games', id], urlParameters: { id }, ...options });

export const createGame = async options => await POST('/api/games', { invalidates: ['games'], ...options });

export const updateGame = async (id, options) =>
	await PATCH('/api/games/:id', { invalidates: ['games'], urlParameters: { id }, ...options });

export const deleteGame = async (id, options) =>
	await DELETE('/api/games/:id', { invalidates: ['games'], urlParameters: { id }, ...options });

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
