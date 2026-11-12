import { Component, Input, Label, SectionLabel, styled, debounce } from '@vanilla-bean/components';

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

// The label holds its textarea and fills the pane, so the textarea stretches to the preview's height beside it
const Field = styled(
	Label,
	() => `
		flex: 1;
		display: flex;
		flex-direction: column;
		margin: 0;
	`,
);

const Editor = styled(
	Input,
	() => `
		flex: 1;
		width: 100%;
		min-height: 240px;
		resize: vertical;
		font-family: monospace;
		font-size: 0.9em;
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
 * Side-by-side markdown editor: a textarea and a live-rendered preview.
 * Read the current text back through `.value`.
 */
export default class MarkdownEditor extends Container {
	static schema = {
		label: {},
		value: {},
		placeholder: {},
	};

	get value() {
		return this.editor.options.value;
	}

	build() {
		this.preview = new Preview({ md: this.options.value || '' });

		this.editor = new Editor({
			tag: 'textarea',
			value: this.options.value || '',
			placeholder: this.options.placeholder || 'Markdown supported...',
			onInput: debounce(({ value }) => {
				this.preview.options.md = value;
			}, 300),
		});

		// The textarea is named by a Label tied to it; the preview is a group under its heading
		this.append(
			new Pane({ append: new Field({ label: `${this.options.label} (markdown)` }, this.editor) }),
			new Pane({ append: [new SectionLabel({ textContent: 'Preview' }), this.preview] }),
		);
	}
}
