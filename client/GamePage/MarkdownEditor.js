import { Component, Input, styled, debounce } from '@vanilla-bean/components';

import Markdown from '../Markdown';

const Container = styled.Component`
	display: flex;
	flex-wrap: wrap;
	gap: 12px;
	margin: 0 0 12px;
`;

const Pane = styled.Component`
	flex: 1;
	min-width: 280px;
	display: flex;
	flex-direction: column;
`;

const PaneLabel = styled(
	Component,
	({ colors }) => `
		font-size: 0.8em;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: ${colors.light(colors.gray)};
		margin: 0 0 3px;
	`,
);

const Editor = styled(
	Input,
	({ colors }) => `
		flex: 1;
		width: 100%;
		min-height: 240px;
		resize: vertical;
		font-family: monospace;
		font-size: 0.9em;
		background-color: ${colors.alpha(colors.black, 0.3)};
	`,
);

const Preview = styled(
	Markdown,
	({ colors }) => `
		flex: 1;
		min-height: 240px;
		overflow: auto;
		padding: 9px 12px;
		border: 1px dashed ${colors.alpha(colors.gray, 0.5)};
		border-radius: 6px;
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
		return this.editor.elem.value;
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

		this.append(
			new Pane({ append: [new PaneLabel({ textContent: `${this.options.label} (markdown)` }), this.editor] }),
			new Pane({ append: [new PaneLabel({ textContent: 'Preview' }), this.preview] }),
		);
	}
}
