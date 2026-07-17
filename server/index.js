#!/usr/bin/env bun

import os from 'os';
import path from 'path';

import Argi from 'argi-cli';

import database from './database';
import server, { spawnBuild } from './server';
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
	},
});

if (process.env.NODE_ENV === 'development') console.log('Options', options);

await database.init({ path: options.database });

await seedGames();

server.init({ port: options.port });

if (process.env.NODE_ENV === 'development') {
	try {
		for await (const line of console) {
			if (['stop', 'close', 'exit'].includes(line)) process.kill(process.pid, 'SIGTERM');
			else if (line === 'b') {
				console.log('>> Building...');
				spawnBuild();
			}
		}
	} catch (error) {
		console.error('Build Error', error);
	}
}
