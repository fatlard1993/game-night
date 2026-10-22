import { FormDialog, Elem, theme } from '@vanilla-bean/components';

import { logIn } from '../api';
import context from '../context';

// The password gates writing, never reading, so this is only reached by someone who set out to
// edit something. Wrong guesses are slowed by the server, not here.
export default class LoginDialog extends FormDialog {
	static schema = {
		saveLabel: { default: 'Log in' },
	};

	static prepareOptions(options) {
		return {
			header: 'Admin login',
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
				style: { margin: `0 0 ${theme.space.sm}`, fontSize: '0.9em' },
				textContent: 'Adding and editing games needs the admin password.',
			}).elem,
		);
	}

	async logIn(password) {
		const result = await logIn({ body: { password } });

		if (result.status !== 'success') return result;

		context.admin = true;

		return true;
	}
}
