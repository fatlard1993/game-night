#!/usr/bin/env bun

import { execSync } from 'child_process';
import { mkdirSync, writeFileSync } from 'fs';
import os from 'os';
import path from 'path';

const [command] = process.argv.slice(2);
const home = os.homedir();
const cwd = path.resolve(import.meta.dir, '..');
const bun = process.execPath;
const platform = process.platform;

const run = cmd => execSync(cmd, { stdio: 'inherit' });

const darwin = {
	label: 'com.justfatlard.game-night',
	plistPath: path.join(home, 'Library', 'LaunchAgents', 'com.justfatlard.game-night.plist'),

	enable() {
		const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>Label</key>
	<string>${this.label}</string>
	<key>ProgramArguments</key>
	<array>
		<string>${bun}</string>
		<string>server/index.js</string>
	</array>
	<key>WorkingDirectory</key>
	<string>${cwd}</string>
	<key>EnvironmentVariables</key>
	<dict>
		<key>NODE_ENV</key>
		<string>production</string>
		<key>HOME</key>
		<string>${home}</string>
	</dict>
	<key>RunAtLoad</key>
	<true/>
	<key>KeepAlive</key>
	<true/>
	<key>StandardOutPath</key>
	<string>${path.join(home, 'Library', 'Logs', 'game-night.log')}</string>
	<key>StandardErrorPath</key>
	<string>${path.join(home, 'Library', 'Logs', 'game-night.log')}</string>
</dict>
</plist>
`;
		mkdirSync(path.dirname(this.plistPath), { recursive: true });
		writeFileSync(this.plistPath, plist);
		console.log(`Wrote ${this.plistPath}`);
		run(`launchctl load "${this.plistPath}"`);
	},

	disable() {
		run(`launchctl unload "${this.plistPath}"`);
	},

	start() {
		run(`launchctl start ${this.label}`);
	},

	stop() {
		run(`launchctl stop ${this.label}`);
	},

	reload() {
		run(`launchctl stop ${this.label}`);
		run(`launchctl start ${this.label}`);
	},
};

const linux = {
	name: 'game-night',
	unitDir: path.join(home, '.config', 'systemd', 'user'),
	get unitPath() {
		return path.join(this.unitDir, `${this.name}.service`);
	},

	enable() {
		const unit = `[Unit]
Description=Game Night

[Service]
Type=simple
ExecStart=${bun} server/index.js
WorkingDirectory=${cwd}
Environment=NODE_ENV=production
Restart=always

[Install]
WantedBy=default.target
`;
		mkdirSync(this.unitDir, { recursive: true });
		writeFileSync(this.unitPath, unit);
		console.log(`Wrote ${this.unitPath}`);
		run('systemctl --user daemon-reload');
		run(`systemctl --user enable --now ${this.name}`);
	},

	disable() {
		run(`systemctl --user disable --now ${this.name}`);
	},

	start() {
		run(`systemctl --user start ${this.name}`);
	},

	stop() {
		run(`systemctl --user stop ${this.name}`);
	},

	reload() {
		run(`systemctl --user restart ${this.name}`);
	},
};

const services = { darwin, linux };
const service = services[platform];

if (!service) {
	console.error(`Unsupported platform: ${platform}`);
	process.exit(1);
}

if (!['enable', 'disable', 'start', 'stop', 'reload'].includes(command)) {
	console.error(`Usage: service.js <enable|disable|start|stop|reload>`);
	process.exit(1);
}

service[command]();
