// hypertether resolves rather than throws, so a failed request arrives looking like data: the
// body holds an Error on a network failure and the server's text or json on an HTTP error.
// Views ask `status === 'error'` and use this for the reason.
export const requestError = result => {
	const { body, response } = result || {};

	if (body instanceof Error) return body.message || 'the server could not be reached';
	if (typeof body === 'string' && body.trim()) return body;
	if (body?.error) return body.error;

	return response?.status ? `HTTP ${response.status}` : 'the server could not be reached';
};

export const isAuthError = result => result?.response?.status === 401;
