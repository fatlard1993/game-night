import { afterEach, describe, expect, test } from 'bun:test';

import MarkdownEditor from './MarkdownEditor';

describe('MarkdownEditor', () => {
	let editor;

	afterEach(() => editor?.destroy());

	test("the textarea is named by its pane's heading, not only its placeholder", () => {
		editor = new MarkdownEditor({ appendTo: document.body, label: 'Rules', value: '', placeholder: 'How to play' });

		const textarea = editor.elem.querySelector('textarea');
		const heading = document.getElementById(textarea.getAttribute('aria-labelledby'));

		expect(heading.getAttribute('role')).toBe('heading');
		expect(heading.textContent).toBe('Rules');
	});

	test('both panes are headed by a SectionLabel', () => {
		editor = new MarkdownEditor({ appendTo: document.body, label: 'Rules', value: '' });

		const headings = [...editor.elem.querySelectorAll('[role="heading"]')].map(heading => heading.textContent);

		expect(headings).toEqual(['Rules', 'Preview']);
	});

	test('value is what has been typed', () => {
		editor = new MarkdownEditor({ appendTo: document.body, label: 'Rules', value: 'Old' });

		const textarea = editor.elem.querySelector('textarea');

		textarea.value = 'New rules';
		textarea.dispatchEvent(new Event('input', { bubbles: true }));

		expect(editor.value).toBe('New rules');
	});
});
