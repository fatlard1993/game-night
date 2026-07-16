import router from './router';

const clients = {};

export const reloadClients = () => {
	Object.entries(clients).forEach(([clientId, socket]) => {
		console.log(`Reloading ${clientId}`);

		socket.send('hotReload');
	});
};

export const spawnBuild = async () => {
	const buildProcess = Bun.spawn(['bun', 'run', 'build:watch']);

	for await (const chunk of buildProcess.stdout) {
		const text = new TextDecoder().decode(chunk);

		console.log(text);

		// A chunk can carry several lines at once; match by line or the signal gets missed
		if (text.split('\n').includes('build.success')) reloadClients();
	}
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
		if (process.env.NODE_ENV === 'development') spawnBuild().catch(error => console.error('Build Error', error));
	},
};
