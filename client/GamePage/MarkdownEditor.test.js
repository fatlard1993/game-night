import { afterEach, describe, expect, test } from 'bun:test';
import { Form } from '@vanilla-bean/components';

import MarkdownEditor from './MarkdownEditor';

const type = (textarea, value) => {
	textarea.value = value;
	textarea.dispatchEvent(new Event('input', { bubbles: true }));
};

describe('MarkdownEditor', () => {
	let editor;

	afterEach(() => editor?.destroy());

	test('the panes are headed Markdown and Preview', () => {
		editor = new MarkdownEditor({ appendTo: document.body, value: '' });

		const headings = [...editor.elem.querySelectorAll('[role="heading"]')].map(heading => heading.textContent);

		expect(headings).toEqual(['Markdown', 'Preview']);
	});

	test('value is what has been typed', () => {
		editor = new MarkdownEditor({ appendTo: document.body, value: 'Old' });

		type(editor.elem.querySelector('textarea'), 'New rules');

		expect(editor.value).toBe('New rules');
	});

	test('a value set from outside reaches the textarea', () => {
		editor = new MarkdownEditor({ appendTo: document.body, value: 'Old' });

		editor.options.value = 'From the server';

		expect(editor.elem.querySelector('textarea').value).toBe('From the server');
	});

	describe('as a Form field', () => {
		const form = () =>
			new Form({
				appendTo: document.body,
				data: { rules: 'Old' },
				inputs: [{ key: 'rules', InputComponent: MarkdownEditor }],
			});

		test("the textarea is named by the field's label", () => {
			editor = form();

			const textarea = editor.elem.querySelector('textarea');

			expect(document.querySelector(`label[for="${textarea.id}"]`).textContent).toBe('Rules');
		});

		test("the form's data is what has been typed, before the textarea is left", () => {
			editor = form();

			type(editor.elem.querySelector('textarea'), 'New rules');

			expect(editor.options.data.rules).toBe('New rules');
		});
	});
});
