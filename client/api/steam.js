import { GET, POST } from '@vanilla-bean/hypertether';

export const getSteamSettings = async options =>
	await GET('/api/steam/settings', { apiId: 'steamSettings', ...options });

export const importSteamLibrary = async options =>
	await POST('/api/steam/import', { invalidates: ['games', 'steamSettings'], ...options });
