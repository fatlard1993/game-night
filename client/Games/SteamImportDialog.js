import { Dialog, Form, Elem, Link } from '@vanilla-bean/components';

import { getSteamSettings, importSteamLibrary } from '../api';

export default class SteamImportDialog extends Dialog {
	constructor(options = {}) {
		super({
			size: 'standard',
			header: 'Import Steam Library',
			buttons: ['Import', 'Cancel'],
			onButtonPress: async ({ button, closeDialog }) => {
				if (button !== 'Import') return closeDialog();

				await this.runImport();
			},
			onConnected: () => this._prefill(),
			...options,
		});
	}

	build() {
		super.build();

		this.intro = new Elem(
			{
				appendTo: this._body,
				style: { margin: '0 0 9px', fontSize: '0.9em' },
			},
			new Elem({ tag: 'span', textContent: 'Needs a free ' }),
			new Link({
				href: 'https://steamcommunity.com/dev/apikey',
				attributes: { target: '_blank' },
				textContent: 'Steam Web API key',
			}),
			new Elem({
				tag: 'span',
				textContent:
					' and your profile to have "Game details" set public. Already-imported and same-named games are skipped.',
			}),
		);

		this.status = new Elem({
			appendTo: this._body,
			style: { margin: '0 0 9px', fontStyle: 'italic', display: 'none' },
		});

		this.form = new Form({
			appendTo: this._body,
			data: { apiKey: '', steamId: '', minHours: '' },
			inputs: [
				{ key: 'apiKey', label: 'Steam Web API Key', type: 'password', placeholder: 'Stored after first import' },
				{ key: 'steamId', label: 'Steam ID / vanity name / profile URL' },
				{ key: 'minHours', label: 'Minimum hours played (blank = everything)', type: 'number', min: 0 },
			],
		});
	}

	async _prefill() {
		const { body } = await getSteamSettings();

		// The dialog can close before the settings fetch lands
		if (!this.elem?.isConnected) return;

		if (body?.steamId) this.form.options.data.steamId = this.form.inputElements.steamId.elem.value = body.steamId;

		if (body?.configured) {
			this.form.inputElements.apiKey.elem.placeholder = 'Using saved key (leave blank)';
		}
	}

	async runImport() {
		// The Form commits inputs to its data store on change (blur), flush the focused field first
		document.activeElement?.blur();

		const { apiKey, steamId, minHours } = this.form.options.data;

		this.status.elem.style.display = 'block';
		this.status.elem.textContent = 'Importing from Steam...';

		const result = await importSteamLibrary({ body: { apiKey, steamId, minHours } });

		if (!result.response.ok) {
			this.status.elem.textContent = `Import failed: ${result.body?.error || result.response.status}`;

			return;
		}

		const { total, eligible, imported, skipped } = result.body;

		this.status.elem.textContent =
			`Imported ${imported} of ${total} Steam games` +
			`${skipped ? ` (${skipped} already in the library)` : ''}` +
			`${eligible < total ? `; ${total - eligible} below the playtime cutoff` : ''}. ` +
			'Covers and descriptions will fill in over the next few minutes.';

		this.options.buttons = ['Close'];
	}
}
