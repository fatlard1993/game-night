import { Dialog, Component, Elem, Form, styled } from '@vanilla-bean/components';

import { logIn, requestError } from '../api';
import context from '../context';

const ErrorNote = styled(
	Component,
	({ colors }) => `
		color: ${colors.light(colors.red)};
		margin: 9px 0 0;
	`,
);

// The password gates writing, never reading, so this is only reached by someone who set out to
// edit something. Wrong guesses are slowed by the server, not here.
export default class LoginDialog extends Dialog {
	constructor(options = {}) {
		super({
			size: 'small',
			header: 'Admin login',
			buttons: ['Log in', 'Cancel'],
			onButtonPress: async ({ button, closeDialog }) => {
				if (button !== 'Log in') return closeDialog();

				if (await this.submit()) closeDialog();
			},
			...options,
		});
	}

	// The `body` option replaces everything in _body, so the explanation is appended like the
	// form rather than passed as an option that would wipe it
	build() {
		super.build();

		new Elem({
			appendTo: this._body,
			style: { margin: '0 0 9px', fontSize: '0.9em' },
			textContent: 'Adding and editing games needs the admin password.',
		});

		this.form = new Form({
			appendTo: this._body,
			data: { password: '' },
			inputs: [{ key: 'password', label: 'Password', type: 'password' }],
		});
	}

	async submit() {
		// The Form commits inputs on blur; flush the focused field before reading it
		document.activeElement?.blur();

		const result = await logIn({ body: { password: this.form.options.data.password } });

		if (result.status !== 'success') {
			this._error ||= new ErrorNote({ appendTo: this._body });
			this._error.options.textContent = `Login failed: ${requestError(result)}`;

			return false;
		}

		context.admin = true;

		return true;
	}
}
