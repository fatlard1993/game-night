import { FormDialog, Component, Elem, styled } from '@vanilla-bean/components';

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
export default class LoginDialog extends FormDialog {
	static prepareOptions(options) {
		return {
			header: 'Admin login',
			saveLabel: 'Log in',
			inputs: [{ key: 'password', label: 'Password', type: 'password' }],
			data: { password: '' },
			// A failed login keeps the dialog open with the reason
			onSave: ({ password }, dialog) => dialog.logIn(password),
			...options,
		};
	}

	build() {
		super.build();

		this.form.elem.before(
			new Elem({
				style: { margin: '0 0 9px', fontSize: '0.9em' },
				textContent: 'Adding and editing games needs the admin password.',
			}).elem,
		);
	}

	async logIn(password) {
		const result = await logIn({ body: { password } });

		if (result.status !== 'success') {
			this._error ||= new ErrorNote({ appendTo: this.body });
			this._error.options.textContent = `Login failed: ${requestError(result)}`;

			return false;
		}

		context.admin = true;

		return true;
	}
}
