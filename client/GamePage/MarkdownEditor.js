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
	({ fontSize }) => `
		flex: 1;
		width: 100%;
		min-height: 240px;
		resize: vertical;
		font-family: monospace;
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

		// Both panes are headed alike; the textarea takes its name from its pane's heading
		const heading = new SectionLabel({ textContent: this.options.label });

		heading.elem.id = `${heading.uniqueId}-heading`;

		this.editor = new Editor({
			tag: 'textarea',
			value: this.options.value || '',
			placeholder: this.options.placeholder || 'Markdown supported...',
			attributes: { 'aria-labelledby': heading.elem.id },
			onInput: debounce(({ value }) => {
				this.preview.options.md = value;
			}, 300),
		});


		this.append(
			new Pane({ append: [heading, this.editor] }),
			new Pane({ append: [new SectionLabel({ textContent: 'Preview' }), this.preview] }),
		);
	}
}
