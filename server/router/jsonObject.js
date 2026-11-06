import { ValidationError } from '@vanilla-bean/components/app';

// A body that parses but isn't an object (null, a list, a number) otherwise destructures into a TypeError, and a
// malformed request answers 500 with a stack trace in the log. crudRoutes gets this from validateFields; the
// hand-written routes get it here.
export const jsonObject = async request => {
	const body = await request.json();

	if (!body || typeof body !== 'object' || Array.isArray(body))
		throw new ValidationError('Expected a JSON object body');

	return body;
};
