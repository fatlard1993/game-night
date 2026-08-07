#!/usr/bin/env bun

import os from 'os';
import path from 'path';

import Argi from 'argi-cli';

import { initAuth } from './auth';
import database from './database/database';
import server, { runBuild } from './server';
import { resumeSteamEnrichment } from './steam';
import { seedGames } from './utils/seedGames';

import './exit';

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

server.init({ port: options.port });

// A Steam import trickles storefront data for minutes; if the process stopped partway through,
// the rest of that library would have stayed bare forever without this
resumeSteamEnrichment();

if (process.env.NODE_ENV === 'development') {
	try {
		for await (const line of console) {
			if (['stop', 'close', 'exit'].includes(line)) process.kill(process.pid, 'SIGTERM');
			else if (line === 'b') {
				console.log('>> Building...');
				await runBuild();
			}
		}
	} catch (error) {
		console.error('Build Error', error);
	}
}
