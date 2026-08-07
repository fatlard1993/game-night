import router from './router/router';

const clients = {};

export const reloadClients = () => {
	Object.entries(clients).forEach(([clientId, socket]) => {
		console.log(`Reloading ${clientId}`);

		socket.send('hotReload');
	});
};

// Long-lived: rebuilds on every file change until the process exits. Started once by init;
// a second one would double every rebuild, so nothing else may call this.
const spawnBuildWatcher = async () => {
	const buildProcess = Bun.spawn(['bun', 'run', 'build:watch']);

	for await (const chunk of buildProcess.stdout) {
		const text = new TextDecoder().decode(chunk);

		console.log(text);

		// A chunk can carry several lines at once; match by line or the signal gets missed
		if (text.split('\n').includes('build.success')) reloadClients();
	}
};

// One-shot rebuild for the dev console's 'b' key, for when the watcher missed something
export const runBuild = async () => {
	const buildProcess = Bun.spawn(['bun', 'run', 'build'], { stdout: 'inherit', stderr: 'inherit' });

	if ((await buildProcess.exited) === 0) reloadClients();
};

export default {
	clients,
	init({ port }) {
		const server = Bun.serve({
			port,
			fetch: router,
			// Fits the 15MB upload cap plus its base64/JSON overhead; anything bigger is
			// rejected before it can balloon memory
			maxRequestBodySize: 32_000_000,
			...(process.env.NODE_ENV === 'development' && {
				websocket: {
					open(socket) {
						clients[socket.data.clientId] = socket;
					},
					close(socket) {
						delete clients[socket.data.clientId];
					},
				},
			}),
		});

		console.log(`Listening on ${server.hostname}:${server.port}`);

		// The build watcher loop runs for the life of the process; don't hold init on it
		if (process.env.NODE_ENV === 'development')
			spawnBuildWatcher().catch(error => console.error('Build Error', error));
	},
};
