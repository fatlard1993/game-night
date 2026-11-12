import { afterEach, describe, expect, test } from 'bun:test';

import MarkdownEditor from './MarkdownEditor';

describe('MarkdownEditor', () => {
	let editor;

	afterEach(() => editor?.destroy());

	test('the textarea is named by a label tied to it, not only its placeholder', () => {
		editor = new MarkdownEditor({ appendTo: document.body, label: 'Rules', value: '', placeholder: 'How to play' });

		const textarea = editor.elem.querySelector('textarea');
		const label = editor.elem.querySelector(`label[for="${textarea.id}"]`);

		expect(textarea.id).toBeTruthy();
		expect(label.textContent).toBe('Rules (markdown)');
	});

	test('value is what has been typed', () => {
		editor = new MarkdownEditor({ appendTo: document.body, label: 'Rules', value: 'Old' });

		const textarea = editor.elem.querySelector('textarea');

		textarea.value = 'New rules';
		textarea.dispatchEvent(new Event('input', { bubbles: true }));

		expect(editor.value).toBe('New rules');
	});
});
