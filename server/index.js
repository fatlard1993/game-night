#!/usr/bin/env bun

import os from 'os';
import path from 'path';

import { devConsole, handleExit, serve } from '@vanilla-bean/components/app';
import Argi from 'argi-cli';

import { initAuth } from './auth';
import database from './database/database';
import { resumeSteamEnrichment } from './steam';
import router from './router/router';
import { seedGames } from './utils/seedGames';

handleExit();

const { options } = new Argi({
	options: {
		database: {
			type: 'string',
			alias: 'd',
			defaultValue: path.join(os.homedir(), '.gameNight.json'),
			description: 'Database json file to use',
		},
		port: {
			type: 'number',
			alias: 'p',
			defaultValue: 8034,
		},
		password: {
			type: 'string',
			description: 'Admin password for adding and editing games (or set GAME_NIGHT_PASSWORD)',
		},
	},
});

// The password is not printed with the rest; it would land in the log on every dev restart
if (process.env.NODE_ENV === 'development') console.log('Options', { ...options, password: undefined });

await database.init({ path: options.database });

await initAuth({ password: options.password || process.env.GAME_NIGHT_PASSWORD });

await seedGames();

await serve({
	port: options.port,
	router,
	// Fits the 15MB upload cap plus its base64/JSON overhead; anything bigger is rejected before it can balloon memory
	maxRequestBodySize: 32_000_000,
});

// A Steam import trickles storefront data for minutes; if the process stopped partway through,
// the rest of that library would have stayed bare forever without this
resumeSteamEnrichment();

devConsole();
