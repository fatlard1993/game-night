import { Component, Input, SectionLabel, styled, debounce } from '@vanilla-bean/components';

import Markdown from '../Markdown';

const Container = styled(
	Component,
	({ space }) => `
		display: flex;
		flex-wrap: wrap;
		gap: ${space.md};
		margin: 0 0 ${space.md};
	`,
);

const Pane = styled.Component`
	flex: 1;
	min-width: 280px;
	display: flex;
	flex-direction: column;
`;

const Editor = styled(
	Input,
	({ fonts, fontSize }) => `
		flex: 1;
		width: 100%;
		min-height: 240px;
		resize: vertical;
		font-family: ${fonts.family.code};
		font-size: ${fontSize.sm};
	`,
);

const Preview = styled(
	Markdown,
	({ colors, radius, space }) => `
		flex: 1;
		min-height: 240px;
		overflow: auto;
		padding: ${space.sm} ${space.md};
		border: 1px dashed ${colors.border};
		border-radius: ${radius.md};
	`,
);

/**
 * Side-by-side markdown editor: a textarea and a live-rendered preview. A Form field: it takes `value`, announces
 * `change` with `event.value` as it's typed, and a Label names the textarea through `labelTarget`.
 */
export default class MarkdownEditor extends Container {
	static schema = {
		value: {
			// A value set from outside reaches the textarea; the one just typed is already there
			set(value) {
				if (!this.editor || this.editor.options.value === (value ?? '')) return;

				this.editor.options.value = value ?? '';
				this.preview.options.md = value ?? '';
			},
		},
		placeholder: {},
	};

	get value() {
		return this.editor.options.value;
	}

	get labelTarget() {
		return this.editor;
	}

	build() {
		this.preview = new Preview({ md: this.options.value || '' });

		const showPreview = debounce(value => {
			this.preview.options.md = value;
		}, 300);

		this.editor = new Editor({
			tag: 'textarea',
			value: this.options.value || '',
			// Named by the Label its Form wraps it in, which finds it through labelTarget
			// eslint-disable-next-line vbc/form.placeholder-not-label
			placeholder: this.options.placeholder || 'Markdown supported...',
			// Announced as typed, not on leaving the textarea: a Save pressed where buttons take no focus reads it current
			onInput: ({ value }) => {
				this.emit('change', { value });
				showPreview(value);
			},
		});

		// The field's name is its Label's; the panes say which is the text and which is how it reads
		this.append(
			new Pane({ append: [new SectionLabel({ textContent: 'Markdown' }), this.editor] }),
			new Pane({ append: [new SectionLabel({ textContent: 'Preview' }), this.preview] }),
		);
	}
}
